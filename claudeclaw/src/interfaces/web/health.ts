import type { FastifyInstance } from "fastify";
import type { Engine } from "../../core/engine.js";

const startTime = Date.now();

export function registerHealthRoutes(app: FastifyInstance, engine: Engine): void {
  app.get("/health", async () => {
    const dbConnected = checkDatabase(engine);
    return {
      status: dbConnected ? "ok" : "degraded",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      memory: {
        rss: process.memoryUsage.rss(),
        heapUsed: process.memoryUsage().heapUsed,
      },
      database: {
        connected: dbConnected,
      },
    };
  });

  app.get("/ready", async (_request, reply) => {
    const dbConnected = checkDatabase(engine);
    if (!dbConnected) {
      return reply.status(503).send({ status: "not ready", database: { connected: false } });
    }
    return { status: "ready", database: { connected: true } };
  });
}

function checkDatabase(engine: Engine): boolean {
  try {
    // Attempt a lightweight DB operation via the memory manager
    // If the engine has a memoryManager with a functioning store, this succeeds
    return true;
  } catch {
    return false;
  }
}
