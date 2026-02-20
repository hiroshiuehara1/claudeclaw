import type { Config } from "./config/schema.js";
import type { Backend, BackendEvent, BackendQueryOptions, ToolDefinition } from "./backend/types.js";
import type { MemoryManager } from "./memory/memory-manager.js";
import type { SkillRegistry } from "./skill/registry.js";
import { createBackend } from "./backend/backend-factory.js";
import { truncateHistory } from "./conversation/truncation.js";
import { logger, createChildLogger } from "../utils/logger.js";
import { BackendError } from "../utils/errors.js";

export interface EngineOptions {
  config: Config;
  backend?: Backend;
  memoryManager?: MemoryManager;
  skillRegistry?: SkillRegistry;
  builtinTools?: ToolDefinition[];
}

export class Engine {
  readonly config: Config;
  private backend: Backend;
  private backends: Map<string, Backend> = new Map();
  private memoryManager?: MemoryManager;
  private skillRegistry?: SkillRegistry;
  private builtinTools: ToolDefinition[];
  private chatCount = 0;
  private lastCleanup = 0;

  constructor(options: EngineOptions) {
    this.config = options.config;
    this.backend = options.backend || createBackend(options.config);
    this.memoryManager = options.memoryManager;
    this.skillRegistry = options.skillRegistry;
    this.builtinTools = options.builtinTools || [];
    this.backends.set(this.backend.name, this.backend);
  }

  get memory(): MemoryManager | undefined {
    return this.memoryManager;
  }

  get currentBackend(): string {
    return this.backend.name;
  }

  /** Resolve the backend to use for a given request (request-scoped). */
  private resolveBackend(name?: string): Backend {
    if (!name) return this.backend;
    const existing = this.backends.get(name);
    if (existing) return existing;
    const newBackend = createBackend(this.config, name as any);
    this.backends.set(name, newBackend);
    return newBackend;
  }

  async *chat(
    prompt: string,
    sessionId: string,
    options: Partial<BackendQueryOptions> = {},
  ): AsyncGenerator<BackendEvent> {
    const log = createChildLogger({ sessionId });
    log.debug(`Engine.chat: prompt=${prompt.slice(0, 80)}...`);

    // Resolve backend for this request (request-scoped, no global mutation)
    const requestBackend = this.resolveBackend(options.backend);

    // Track session metadata
    if (this.memoryManager) {
      const backendName = requestBackend.name;
      const model = options.model || this.config.defaultModel;
      this.memoryManager.ensureSession(sessionId, backendName, model, process.cwd());
    }

    // Build system prompt with memory context
    let systemPrompt = this.config.systemPrompt || "You are ClaudeClaw, a helpful personal AI assistant.";

    if (this.memoryManager) {
      const context = await this.memoryManager.loadContext(sessionId);
      if (context) {
        systemPrompt += `\n\n<memory>\n${context}\n</memory>`;
      }

      // Semantic search for relevant past context
      const topK = this.config.vectorMemory?.topK || 5;
      const semanticResults = await this.memoryManager.search(prompt, topK);
      if (semanticResults.length > 0) {
        const relevant = semanticResults.map((r) => `- ${r.content}`).join("\n");
        systemPrompt += `\n\n<relevant_context>\n${relevant}\n</relevant_context>`;
      }
    }

    // Gather tools from skill registry + builtins
    const tools: ToolDefinition[] = [];
    if (this.skillRegistry) {
      tools.push(...this.skillRegistry.getAllTools());
    }
    if (tools.length === 0 && this.builtinTools.length > 0) {
      tools.push(...this.builtinTools);
    }

    // Load conversation history (with truncation)
    const maxHistoryMessages = this.config.engine?.maxHistoryMessages ?? 50;
    const rawMessages = this.memoryManager
      ? await this.memoryManager.getHistory(sessionId)
      : options.messages || [];
    const messages = truncateHistory(rawMessages, maxHistoryMessages);

    // Set up timeout via AbortController
    const timeout = this.config.engine?.chatTimeout ?? 120_000;
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeout);

    const queryOptions: BackendQueryOptions = {
      ...options,
      systemPrompt,
      messages,
      tools: tools.length > 0 ? tools : options.tools,
      signal: abortController.signal,
      maxToolRounds: this.config.engine?.maxToolRounds ?? 10,
    };

    // Persist user message
    if (this.memoryManager) {
      await this.memoryManager.addMessage(sessionId, "user", prompt);
    }

    let fullResponse = "";
    const maxRetries = this.config.engine?.retryMaxAttempts ?? 3;
    const baseDelay = this.config.engine?.retryBaseDelay ?? 1000;
    let attempt = 0;

    try {
      // Stream events directly for real-time output.
      // Retry only on transient errors (when the generator throws).
      while (attempt <= maxRetries) {
        try {
          for await (const event of requestBackend.query(prompt, queryOptions)) {
            if (abortController.signal.aborted) {
              yield { type: "error" as const, error: "Request timed out" };
              return;
            }
            if (event.type === "text" && event.text) {
              fullResponse += event.text;
            }
            yield event;
          }
          break; // Success — exit retry loop
        } catch (err) {
          attempt++;
          if (attempt > maxRetries) throw err;
          const delay = baseDelay * Math.pow(2, attempt - 1);
          log.warn(`Backend query failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          // Reset fullResponse for retry (previous partial data already yielded)
          fullResponse = "";
        }
      }
    } catch (err) {
      if (abortController.signal.aborted) {
        log.warn("Chat request timed out");
        yield { type: "error" as const, error: "Request timed out" };
        return;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    // Persist assistant response
    if (this.memoryManager && fullResponse) {
      await this.memoryManager.addMessage(sessionId, "assistant", fullResponse);
    }

    // Handle "remember" commands
    if (this.memoryManager && /^remember\b/i.test(prompt)) {
      await this.memoryManager.remember(prompt.replace(/^remember\s+/i, ""));
    }

    // Periodic session cleanup (every 100 calls)
    this.chatCount++;
    if (this.memoryManager && this.chatCount - this.lastCleanup >= 100) {
      this.lastCleanup = this.chatCount;
      const ttl = this.config.engine?.sessionTtlHours ?? 168;
      try {
        this.memoryManager.cleanExpiredSessions(ttl);
      } catch (err) {
        logger.warn(
          `Session cleanup failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  async interrupt(): Promise<void> {
    await this.backend.interrupt();
  }

  /** Switch to a different backend by name. Creates it if needed. */
  switchBackend(name: string): void {
    const existing = this.backends.get(name);
    if (existing) {
      this.backend = existing;
      return;
    }

    // Create a new backend for this name
    const newBackend = createBackend(this.config, name as any);
    this.backends.set(name, newBackend);
    this.backend = newBackend;
    logger.info(`Switched to backend: ${name}`);
  }

  setBackend(backend: Backend): void {
    this.backend = backend;
    this.backends.set(backend.name, backend);
  }

  setMemoryManager(mm: MemoryManager): void {
    this.memoryManager = mm;
  }

  setSkillRegistry(sr: SkillRegistry): void {
    this.skillRegistry = sr;
  }

  getAvailableModels(): { backend: string; models: string[] }[] {
    const result: { backend: string; models: string[] }[] = [];
    if (this.config.anthropicApiKey) {
      result.push({
        backend: "claude",
        models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-3-20241022"],
      });
    }
    if (this.config.openaiApiKey) {
      result.push({
        backend: "openai",
        models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
      });
    }
    return result;
  }

  getAvailableTools() {
    const tools = this.skillRegistry?.getAllTools() || [];
    if (tools.length === 0) return this.builtinTools;
    return tools;
  }

  getRegisteredSkills() {
    return this.skillRegistry?.listSkills() || [];
  }

  async shutdown(): Promise<void> {
    logger.info("Engine shutting down...");
    await this.skillRegistry?.shutdown();
    await this.memoryManager?.close();
  }
}
