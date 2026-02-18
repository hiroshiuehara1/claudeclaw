import fs from "node:fs/promises";
import path from "node:path";
import Fastify, { type FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { AppConfig } from "../../core/config.js";
import { ChatService } from "../../core/chat-service.js";
import type { BackendMode, ChatEvent, ChatRequest } from "../../core/types.js";
import { normalizeStrictOneShotText } from "../cli/normalize-one-shot.js";

const chatRequestSchema = z.object({
  prompt: z.string().min(1),
  backend: z.enum(["auto", "codex", "claude"]).optional(),
  sessionId: z.string().min(1).optional(),
  stream: z.boolean().optional(),
  strict: z.boolean().optional()
});

function serializeErrorEvent(message: string, backend: BackendMode = "auto"): ChatEvent {
  return {
    type: "response.error",
    sessionId: "",
    backend: backend === "auto" ? "codex" : backend,
    requestId: "",
    code: "REQUEST_FAILED",
    message
  };
}

type WsRawMessage = string | Buffer | ArrayBuffer | Buffer[];
type WsSocketLike = {
  on: (event: string, listener: (...args: any[]) => void) => void;
  send: (value: string) => void;
};

function rawMessageToString(rawData: WsRawMessage): string {
  if (typeof rawData === "string") {
    return rawData;
  }
  if (Array.isArray(rawData)) {
    return Buffer.concat(rawData).toString("utf-8");
  }
  if (rawData instanceof ArrayBuffer) {
    return Buffer.from(rawData).toString("utf-8");
  }
  return rawData.toString("utf-8");
}

function resolveWsSocket(connection: unknown): WsSocketLike | null {
  if (typeof connection !== "object" || connection === null) {
    return null;
  }

  const direct = connection as Partial<WsSocketLike>;
  if (typeof direct.on === "function" && typeof direct.send === "function") {
    return direct as WsSocketLike;
  }

  const nested = (connection as { socket?: Partial<WsSocketLike> }).socket;
  if (nested && typeof nested.on === "function" && typeof nested.send === "function") {
    return nested as WsSocketLike;
  }

  return null;
}

export class WebServer {
  private readonly app: FastifyInstance;

  constructor(
    private readonly config: AppConfig,
    private readonly chatService: ChatService
  ) {
    this.app = Fastify({ logger: false });
  }

  async start(): Promise<void> {
    await this.app.register(websocket);
    this.registerRoutes();
    await this.app.listen({ host: this.config.webHost, port: this.config.webPort });
  }

  async stop(): Promise<void> {
    await this.app.close();
  }

  private registerRoutes(): void {
    this.app.get("/", async (_request, reply) => {
      return this.sendStatic(reply, "index.html", "text/html; charset=utf-8");
    });

    this.app.get("/styles.css", async (_request, reply) => {
      return this.sendStatic(reply, "styles.css", "text/css; charset=utf-8");
    });

    this.app.get("/script.js", async (_request, reply) => {
      return this.sendStatic(reply, "script.js", "text/javascript; charset=utf-8");
    });

    this.app.get("/api/health", async () => {
      return {
        ...this.chatService.getHealth(),
        now: new Date().toISOString()
      };
    });

    this.app.get("/api/sessions", async () => {
      return this.chatService.listSessions();
    });

    this.app.get<{ Params: { id: string } }>("/api/sessions/:id/messages", async (request) => {
      return this.chatService.listMessages(request.params.id);
    });

    this.app.post("/api/chat", async (request, reply) => {
      const parsed = chatRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.code(400);
        return {
          error: "invalid_request",
          issues: parsed.error.issues
        };
      }

      const payload: ChatRequest = {
        prompt: parsed.data.prompt,
        backend: parsed.data.backend,
        sessionId: parsed.data.sessionId,
        strict: parsed.data.strict
      };

      const wantsStream =
        parsed.data.stream === true || request.headers.accept?.includes("text/event-stream") === true;

      if (!wantsStream) {
        try {
          const result = await this.chatService.chat(payload);
          if (!parsed.data.strict) {
            return result;
          }
          return {
            ...result,
            text: normalizeStrictOneShotText(result.text)
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          reply.code(500);
          return { error: "chat_failed", message };
        }
      }

      reply.hijack();
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });

      try {
        if (parsed.data.strict) {
          const result = await this.chatService.chat(payload);
          const text = normalizeStrictOneShotText(result.text);
          const requestId = nanoid();
          reply.raw.write(
            `data: ${JSON.stringify({
              type: "response.start",
              sessionId: result.sessionId,
              backend: result.backend,
              requestId
            })}\n\n`
          );
          if (text) {
            reply.raw.write(
              `data: ${JSON.stringify({
                type: "response.delta",
                sessionId: result.sessionId,
                backend: result.backend,
                requestId,
                text
              })}\n\n`
            );
          }
          reply.raw.write(
            `data: ${JSON.stringify({
              type: "response.end",
              sessionId: result.sessionId,
              backend: result.backend,
              requestId,
              text
            })}\n\n`
          );
        } else {
          for await (const event of this.chatService.streamChat(payload)) {
            reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        reply.raw.write(`data: ${JSON.stringify(serializeErrorEvent(message, parsed.data.backend))}\n\n`);
      }

      reply.raw.end();
    });

    this.app.get("/api/chat/ws", { websocket: true }, (connection) => {
      const socket = resolveWsSocket(connection);
      if (!socket) {
        return;
      }

      let busy = false;

      socket.on("message", (rawData: WsRawMessage) => {
        if (busy) {
          socket.send(JSON.stringify(serializeErrorEvent("Connection is busy")));
          return;
        }

        busy = true;
        void (async () => {
          try {
            const body = JSON.parse(rawMessageToString(rawData)) as unknown;
            const parsed = chatRequestSchema.safeParse(body);
            if (!parsed.success) {
              socket.send(
                JSON.stringify(
                  serializeErrorEvent(
                    `Invalid payload: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`
                  )
                )
              );
              return;
            }

            const payload: ChatRequest = {
              prompt: parsed.data.prompt,
              backend: parsed.data.backend,
              sessionId: parsed.data.sessionId,
              strict: parsed.data.strict
            };

            if (parsed.data.strict) {
              const result = await this.chatService.chat(payload);
              const text = normalizeStrictOneShotText(result.text);
              const requestId = nanoid();
              socket.send(
                JSON.stringify({
                  type: "response.start",
                  sessionId: result.sessionId,
                  backend: result.backend,
                  requestId
                })
              );
              if (text) {
                socket.send(
                  JSON.stringify({
                    type: "response.delta",
                    sessionId: result.sessionId,
                    backend: result.backend,
                    requestId,
                    text
                  })
                );
              }
              socket.send(
                JSON.stringify({
                  type: "response.end",
                  sessionId: result.sessionId,
                  backend: result.backend,
                  requestId,
                  text
                })
              );
            } else {
              for await (const event of this.chatService.streamChat(payload)) {
                socket.send(JSON.stringify(event));
              }
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            socket.send(JSON.stringify(serializeErrorEvent(message)));
          } finally {
            busy = false;
          }
        })();
      });
    });
  }

  private async sendStatic(reply: { type: (value: string) => void; send: (value: string) => void }, file: string, contentType: string): Promise<void> {
    const targetPath = path.join(this.config.publicDir, file);
    const contents = await fs.readFile(targetPath, "utf-8");
    reply.type(contentType);
    reply.send(contents);
  }
}
