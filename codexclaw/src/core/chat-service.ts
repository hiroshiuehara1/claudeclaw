import { nanoid } from "nanoid";
import type { AppConfig } from "./config.js";
import type {
  BackendMode,
  BackendName,
  ChatEvent,
  ChatRequest,
  ChatResponse,
  SessionRecord,
  MessageRecord
} from "./types.js";
import type { BackendAdapter } from "./adapters/types.js";
import { BackendInvocationError } from "./adapters/errors.js";
import { BackendRouter } from "./router/backend-router.js";
import { CircuitBreaker } from "./safety/circuit-breaker.js";
import { SqliteStore } from "./session/sqlite-store.js";
import { stripAnsi, trimPrompt } from "./utils/text.js";

interface AdapterMap {
  codex: BackendAdapter;
  claude: BackendAdapter;
}

export class ChatService {
  private readonly router: BackendRouter;
  private readonly breakers: Record<BackendName, CircuitBreaker>;

  constructor(
    private readonly config: AppConfig,
    private readonly store: SqliteStore,
    private readonly adapters: AdapterMap
  ) {
    this.breakers = {
      codex: new CircuitBreaker({
        failureThreshold: config.breakerFailureThreshold,
        resetTimeoutMs: config.breakerResetMs
      }),
      claude: new CircuitBreaker({
        failureThreshold: config.breakerFailureThreshold,
        resetTimeoutMs: config.breakerResetMs
      })
    };
    this.router = new BackendRouter(this.breakers);
  }

  listSessions(): SessionRecord[] {
    return this.store.listSessions();
  }

  listMessages(sessionId: string): MessageRecord[] {
    return this.store.listMessages(sessionId);
  }

  getHealth(): {
    status: "ok";
    defaultBackend: BackendMode;
    circuitBreakers: Record<BackendName, { state: string; failureCount: number; openedAt: number }>;
  } {
    return {
      status: "ok",
      defaultBackend: this.config.defaultBackend,
      circuitBreakers: {
        codex: this.breakers.codex.getSnapshot(),
        claude: this.breakers.claude.getSnapshot()
      }
    };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    let text = "";
    let backend: BackendName | null = null;
    let sessionId = request.sessionId || "";

    for await (const event of this.streamChat(request)) {
      sessionId = event.sessionId;
      if (event.type === "response.start") {
        backend = event.backend;
      }
      if (event.type === "response.delta") {
        text += event.text;
      }
      if (event.type === "response.end") {
        text = event.text;
        backend = event.backend;
      }
    }

    if (!backend) {
      throw new Error("No backend produced a response");
    }

    return {
      sessionId,
      backend,
      text
    };
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<ChatEvent> {
    const prompt = trimPrompt(request.prompt);
    if (!prompt) {
      throw new Error("Prompt must not be empty");
    }

    const mode = request.backend || this.config.defaultBackend;
    const session = this.store.ensureSession(request.sessionId);
    this.store.appendMessage(session.id, "user", prompt, null);

    const candidates = this.router.select(mode);
    let lastError: BackendInvocationError | null = null;

    for (const backend of candidates) {
      const requestId = nanoid();
      const startedAt = Date.now();

      if (mode !== "auto" && !this.breakers[backend].canRequest()) {
        const blocked = new BackendInvocationError(`Circuit is open for ${backend}`, {
          backend,
          code: "CIRCUIT_OPEN",
          transient: true
        });
        lastError = blocked;

        this.store.logRequest({
          requestId,
          sessionId: session.id,
          backend,
          status: "error",
          latencyMs: Date.now() - startedAt,
          errorCode: blocked.code,
          errorMessage: blocked.message
        });

        yield {
          type: "response.error",
          sessionId: session.id,
          backend,
          requestId,
          code: blocked.code,
          message: blocked.message
        };
        continue;
      }

      yield {
        type: "response.start",
        sessionId: session.id,
        backend,
        requestId
      };

      const adapter = this.adapters[backend];
      let finalText = "";
      let attemptError: BackendInvocationError | null = null;
      let success = false;

      for (let attempt = 0; attempt <= this.config.retryAttempts; attempt += 1) {
        let partial = "";
        let sawAnyOutput = false;

        try {
          for await (const streamEvent of adapter.invoke({
            prompt,
            sessionId: session.id,
            workspaceDir: this.config.workspaceDir,
            timeoutMs: this.config.requestTimeoutMs,
            maxOutputBytes: this.config.maxOutputBytes
          })) {
            if (streamEvent.type !== "delta") {
              continue;
            }
            const cleaned = stripAnsi(streamEvent.text);
            if (!cleaned) {
              continue;
            }

            sawAnyOutput = true;
            partial += cleaned;

            yield {
              type: "response.delta",
              sessionId: session.id,
              backend,
              requestId,
              text: cleaned
            };
          }

          const candidateFinal = partial.trim();
          if (!candidateFinal) {
            throw new BackendInvocationError(`${backend} returned empty output`, {
              backend,
              code: "EMPTY_OUTPUT",
              transient: true
            });
          }

          finalText = candidateFinal;
          success = true;
          attemptError = null;
          break;
        } catch (error) {
          const normalized = this.normalizeError(error, backend);
          const canRetry = normalized.transient && !sawAnyOutput && attempt < this.config.retryAttempts;
          if (canRetry) {
            continue;
          }
          attemptError = normalized;
          break;
        }
      }

      if (success) {
        this.breakers[backend].markSuccess();
        this.store.appendMessage(session.id, "assistant", finalText, backend);
        this.store.logRequest({
          requestId,
          sessionId: session.id,
          backend,
          status: "success",
          latencyMs: Date.now() - startedAt
        });

        yield {
          type: "response.end",
          sessionId: session.id,
          backend,
          requestId,
          text: finalText
        };
        return;
      }

      const backendError =
        attemptError ||
        new BackendInvocationError(`${backend} failed with unknown error`, {
          backend,
          code: "UNKNOWN_ERROR",
          transient: true
        });

      this.breakers[backend].markFailure();
      this.store.logRequest({
        requestId,
        sessionId: session.id,
        backend,
        status: "error",
        latencyMs: Date.now() - startedAt,
        errorCode: backendError.code,
        errorMessage: backendError.details || backendError.message
      });

      lastError = backendError;
      yield {
        type: "response.error",
        sessionId: session.id,
        backend,
        requestId,
        code: backendError.code,
        message: backendError.message
      };

      if (mode !== "auto") {
        throw backendError;
      }
    }

    throw (
      lastError ||
      new BackendInvocationError("No backend candidates available", {
        backend: "codex",
        code: "NO_CANDIDATES",
        transient: true
      })
    );
  }

  private normalizeError(error: unknown, backend: BackendName): BackendInvocationError {
    if (error instanceof BackendInvocationError) {
      return error;
    }
    if (error instanceof Error) {
      return new BackendInvocationError(error.message, {
        backend,
        code: "UNKNOWN_ERROR",
        transient: true,
        details: error.stack
      });
    }
    return new BackendInvocationError(String(error), {
      backend,
      code: "UNKNOWN_ERROR",
      transient: true
    });
  }
}
