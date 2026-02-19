import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import type { Engine } from "../../core/engine.js";

const startTime = Date.now();

function getVersion(): string {
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const pkgPaths = [
      join(currentDir, "../../../package.json"),
      join(currentDir, "../../package.json"),
      join(process.cwd(), "package.json"),
    ];
    for (const p of pkgPaths) {
      try {
        const pkg = JSON.parse(readFileSync(p, "utf-8"));
        if (pkg.name === "claudeclaw") return pkg.version;
      } catch {
        // try next
      }
    }
  } catch {
    // ignore
  }
  return "unknown";
}

export function registerHealthRoutes(app: FastifyInstance, engine: Engine): void {
  const version = getVersion();

  app.get("/health", async () => {
    const dbConnected = checkDatabase(engine);
    return {
      status: dbConnected ? "ok" : "degraded",
      version,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      backend: engine.config.defaultBackend,
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
    if (!engine.memory) return true;
    // Actually test the DB by calling a lightweight operation
    engine.memory.listSessions(1);
    return true;
  } catch {
    return false;
  }
}
