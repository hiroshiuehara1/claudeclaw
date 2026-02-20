import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { Engine } from "../../core/engine.js";
import { logger } from "../../utils/logger.js";
import { getActiveStreams } from "./routes.js";

const SseQuerySchema = z.object({
  prompt: z.string().min(1).max(100_000),
  sessionId: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
});

export function registerSseRoutes(app: FastifyInstance, engine: Engine): void {
  app.get("/api/chat/stream", async (request, reply) => {
    const parsed = SseQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request", details: parsed.error.issues });
    }

    const { prompt, model } = parsed.data;
    const sessionId = parsed.data.sessionId || nanoid(12);

    const controller = new AbortController();
    const activeStreams = getActiveStreams();
    activeStreams.set(sessionId, controller);

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Session-Id": sessionId,
    });

    // Auto-cancel on client disconnect
    request.raw.on("close", () => {
      controller.abort();
      activeStreams.delete(sessionId);
    });

    try {
      for await (const event of engine.chat(prompt, sessionId, { model })) {
        if (controller.signal.aborted) {
          const cancelEvent = JSON.stringify({ type: "done", cancelled: true });
          reply.raw.write(`event: done\ndata: ${cancelEvent}\n\n`);
          break;
        }
        const data = JSON.stringify(event);
        reply.raw.write(`event: ${event.type}\ndata: ${data}\n\n`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`SSE stream error: ${errorMsg}`);
      const errorEvent = JSON.stringify({ type: "error", error: errorMsg });
      reply.raw.write(`event: error\ndata: ${errorEvent}\n\n`);
    } finally {
      activeStreams.delete(sessionId);
    }

    reply.raw.end();
  });
}
