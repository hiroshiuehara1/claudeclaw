import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import type { Engine } from "../../core/engine.js";

export function registerRoutes(app: FastifyInstance, engine: Engine): void {
  // Health check
  app.get("/health", async () => ({ status: "ok" }));

  // One-shot chat endpoint
  app.post<{
    Body: { prompt: string; sessionId?: string; model?: string };
  }>("/api/chat", async (request, reply) => {
    const { prompt, sessionId, model } = request.body;
    const sid = sessionId || nanoid(12);

    let fullText = "";
    for await (const event of engine.chat(prompt, sid, { model })) {
      if (event.type === "text" && event.text) {
        fullText += event.text;
      }
      if (event.type === "error") {
        return reply.status(500).send({ error: event.error });
      }
    }

    return { sessionId: sid, text: fullText };
  });

  // Streaming WebSocket endpoint
  app.register(async (fastify) => {
    fastify.get("/api/chat/ws", { websocket: true }, (socket, _request) => {
      const sessionId = nanoid(12);

      socket.on("message", async (raw: Buffer) => {
        let data: { prompt: string; model?: string };
        try {
          data = JSON.parse(raw.toString());
        } catch {
          socket.send(JSON.stringify({ type: "error", error: "Invalid JSON" }));
          return;
        }

        try {
          for await (const event of engine.chat(data.prompt, sessionId, {
            model: data.model,
          })) {
            socket.send(JSON.stringify(event));
          }
        } catch (err) {
          socket.send(
            JSON.stringify({
              type: "error",
              error: err instanceof Error ? err.message : String(err),
            }),
          );
        }
      });
    });
  });
}
