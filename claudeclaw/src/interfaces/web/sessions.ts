import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Engine } from "../../core/engine.js";

const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function registerSessionRoutes(app: FastifyInstance, engine: Engine): void {
  app.get("/api/sessions", async (request, reply) => {
    const memory = engine.memory;
    if (!memory) {
      return reply.status(503).send({ error: "Memory not configured" });
    }

    const parsed = PaginationSchema.safeParse(request.query);
    const { limit, offset } = parsed.success ? parsed.data : { limit: 50, offset: 0 };

    const sessions = memory.listSessions(limit, offset);
    return { sessions };
  });

  app.get("/api/sessions/:id", async (request, reply) => {
    const memory = engine.memory;
    if (!memory) {
      return reply.status(503).send({ error: "Memory not configured" });
    }

    const { id } = request.params as { id: string };
    const session = memory.getSession(id);
    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }

    const messages = memory.getAllMessages(id);
    return { session, messages };
  });

  app.delete("/api/sessions/:id", async (request, reply) => {
    const memory = engine.memory;
    if (!memory) {
      return reply.status(503).send({ error: "Memory not configured" });
    }

    const { id } = request.params as { id: string };
    const session = memory.getSession(id);
    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }

    memory.deleteSession(id);
    return { deleted: true };
  });
}
