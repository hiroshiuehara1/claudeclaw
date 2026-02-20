import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import type { Engine } from "../../core/engine.js";
import { ChatRequestSchema, WebSocketMessageSchema } from "./validation.js";
import { errorToHttpStatus, ClawError } from "../../utils/errors.js";
import type { MetricsCollector } from "../../utils/metrics.js";

// Track active streaming sessions for cancellation
const activeStreams = new Map<string, AbortController>();

export function getActiveStreams(): Map<string, AbortController> {
  return activeStreams;
}

export function registerRoutes(app: FastifyInstance, engine: Engine, metrics?: MetricsCollector): void {
  // One-shot chat endpoint
  app.post("/api/chat", async (request, reply) => {
    const parsed = ChatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request", details: parsed.error.issues });
    }

    const { prompt, sessionId, model, backend } = parsed.data;
    const sid = sessionId || nanoid(12);
    const startTime = Date.now();

    const controller = new AbortController();
    activeStreams.set(sid, controller);

    try {
      let fullText = "";
      for await (const event of engine.chat(prompt, sid, { model, backend })) {
        if (controller.signal.aborted) {
          metrics?.recordRequest(backend || "unknown", Date.now() - startTime, fullText.length, "cancelled");
          return reply.status(499).send({ error: "Request cancelled" });
        }
        if (event.type === "text" && event.text) {
          fullText += event.text;
        }
        if (event.type === "error") {
          metrics?.recordRequest(backend || "unknown", Date.now() - startTime, 0, event.error);
          return reply.status(500).send({ error: event.error });
        }
      }

      metrics?.recordRequest(backend || "unknown", Date.now() - startTime, fullText.length);
      return { sessionId: sid, text: fullText };
    } catch (err) {
      const status = errorToHttpStatus(err);
      const message = err instanceof Error ? err.message : String(err);
      const code = err instanceof ClawError ? err.code : "INTERNAL_ERROR";
      metrics?.recordRequest(backend || "unknown", Date.now() - startTime, 0, message);
      return reply.status(status).send({ error: message, code });
    } finally {
      activeStreams.delete(sid);
    }
  });

  // Cancel a streaming request
  app.post("/api/chat/cancel", async (request, reply) => {
    const body = request.body as { sessionId?: string } | undefined;
    const sessionId = body?.sessionId;
    if (!sessionId) {
      return reply.status(400).send({ error: "sessionId is required" });
    }

    const controller = activeStreams.get(sessionId);
    if (controller) {
      controller.abort();
      activeStreams.delete(sessionId);
      return { cancelled: true, sessionId };
    }

    return reply.status(404).send({ error: "No active stream for this session" });
  });

  // Streaming WebSocket endpoint
  app.register(async (fastify) => {
    fastify.get("/api/chat/ws", { websocket: true }, (socket, _request) => {
      let sessionId = nanoid(12);

      socket.on("message", async (raw: Buffer) => {
        let data: { prompt: string; model?: string; sessionId?: string; backend?: string };
        try {
          const rawData = JSON.parse(raw.toString());
          const parsed = WebSocketMessageSchema.safeParse(rawData);
          if (!parsed.success) {
            socket.send(JSON.stringify({ type: "error", error: "Invalid message format" }));
            return;
          }
          data = parsed.data;
        } catch {
          socket.send(JSON.stringify({ type: "error", error: "Invalid JSON" }));
          return;
        }

        // Allow client to specify sessionId
        if (data.sessionId) {
          sessionId = data.sessionId;
        }

        const controller = new AbortController();
        activeStreams.set(sessionId, controller);
        const startTime = Date.now();

        try {
          for await (const event of engine.chat(data.prompt, sessionId, {
            model: data.model,
            backend: data.backend,
          })) {
            if (controller.signal.aborted) {
              socket.send(JSON.stringify({ type: "done", cancelled: true }));
              break;
            }
            socket.send(JSON.stringify(event));
          }
          metrics?.recordRequest(data.backend || "unknown", Date.now() - startTime, 0);
        } catch (err) {
          const code = err instanceof ClawError ? err.code : "INTERNAL_ERROR";
          const message = err instanceof Error ? err.message : String(err);
          socket.send(
            JSON.stringify({
              type: "error",
              error: message,
              code,
            }),
          );
          metrics?.recordRequest(data.backend || "unknown", Date.now() - startTime, 0, message);
        } finally {
          activeStreams.delete(sessionId);
        }
      });

      // Cleanup on disconnect
      socket.on("close", () => {
        const controller = activeStreams.get(sessionId);
        if (controller) {
          controller.abort();
          activeStreams.delete(sessionId);
        }
      });
    });
  });
}
