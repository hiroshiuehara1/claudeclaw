import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import type { Engine } from "../../core/engine.js";
import { ChatRequestSchema, WebSocketMessageSchema } from "./validation.js";

export function registerRoutes(app: FastifyInstance, engine: Engine): void {
  // One-shot chat endpoint
  app.post("/api/chat", async (request, reply) => {
    const parsed = ChatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request", details: parsed.error.issues });
    }

    const { prompt, sessionId, model } = parsed.data;
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
      let sessionId = nanoid(12);

      socket.on("message", async (raw: Buffer) => {
        let data: { prompt: string; model?: string; sessionId?: string };
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
