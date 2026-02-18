import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import { registerHealthRoutes } from "../src/interfaces/web/health.js";
import type { Engine } from "../src/core/engine.js";

function createMockEngine(): Engine {
  return {
    config: {
      defaultBackend: "claude",
      dataDir: "/tmp/claw-test",
      logLevel: "error",
      web: { port: 0, host: "127.0.0.1", corsOrigins: [], rateLimitMax: 100 },
      engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
      skills: [],
    },
  } as unknown as Engine;
}

describe("Health Check", () => {
  const app = Fastify();
  const mockEngine = createMockEngine();

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
});
