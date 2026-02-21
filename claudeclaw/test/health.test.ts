import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import { registerHealthRoutes } from "../src/interfaces/web/health.js";
import type { Engine } from "../src/core/engine.js";

function createMockEngine(opts: { withMemory?: boolean; memoryFails?: boolean } = {}): Engine {
  const mock: any = {
    config: {
      defaultBackend: "claude",
      dataDir: "/tmp/claw-test",
      logLevel: "error",
      web: { port: 0, host: "127.0.0.1", corsOrigins: [], rateLimitMax: 100, drainTimeout: 5000 },
      engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
      skills: [],
    },
  };

  mock.getCircuitBreakerStates = () => ({});

  if (opts.withMemory) {
    mock.memory = {
      listSessions: () => {
        if (opts.memoryFails) throw new Error("DB connection failed");
        return [];
      },
    };
  }

  return mock as Engine;
}

describe("Health Check", () => {
  const app = Fastify();
  const mockEngine = createMockEngine({ withMemory: true });

  beforeAll(async () => {
    registerHealthRoutes(app, mockEngine);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return structured health response", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("uptime");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("memory");
    expect(body).toHaveProperty("database");
    expect(body.database).toHaveProperty("connected");
    expect(typeof body.uptime).toBe("number");
  });

  it("should return ready status", async () => {
    const res = await app.inject({ method: "GET", url: "/ready" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("ready");
    expect(body.database.connected).toBe(true);
  });

  it("should include version in health response", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("version");
  });

  it("should include backend info in health response", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("backend");
    expect(body.backend).toBe("claude");
  });
});

describe("Health Check — degraded DB", () => {
  it("should return degraded when DB check fails", async () => {
    const app = Fastify();
    const engine = createMockEngine({ withMemory: true, memoryFails: true });
    registerHealthRoutes(app, engine);
    await app.ready();

    const res = await app.inject({ method: "GET", url: "/health" });
    const body = JSON.parse(res.body);
    expect(body.status).toBe("degraded");
    expect(body.database.connected).toBe(false);

    await app.close();
  });

  it("should return 503 on ready when DB fails", async () => {
    const app = Fastify();
    const engine = createMockEngine({ withMemory: true, memoryFails: true });
    registerHealthRoutes(app, engine);
    await app.ready();

    const res = await app.inject({ method: "GET", url: "/ready" });
    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("not ready");

    await app.close();
  });
});
