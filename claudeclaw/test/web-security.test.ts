import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { registerSecurity } from "../src/interfaces/web/middleware/security.js";
import { createAuthHook } from "../src/interfaces/web/middleware/auth.js";
import { registerRoutes } from "../src/interfaces/web/routes.js";
import { registerHealthRoutes } from "../src/interfaces/web/health.js";
import type { Engine } from "../src/core/engine.js";
import type { BackendEvent, BackendQueryOptions } from "../src/core/backend/types.js";

function createMockEngine(): Engine {
  return {
    config: {
      defaultBackend: "claude",
      dataDir: "/tmp/claw-test",
      logLevel: "error",
      web: {
        port: 0,
        host: "127.0.0.1",
        corsOrigins: ["http://localhost:3100"],
        rateLimitMax: 5,
      },
      engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
      skills: [],
    },
    async *chat(_prompt: string, _sessionId: string, _options?: Partial<BackendQueryOptions>): AsyncGenerator<BackendEvent> {
      yield { type: "text", text: "Hello" };
      yield { type: "done" };
    },
  } as unknown as Engine;
}

describe("Web Security", () => {
  const app = Fastify();
  const mockEngine = createMockEngine();

  beforeAll(async () => {
    await registerSecurity(app, mockEngine.config);
    app.addHook("onRequest", createAuthHook("test-secret-key"));
    await app.register(websocket);
    registerHealthRoutes(app, mockEngine);
    registerRoutes(app, mockEngine);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return 401 without API key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/chat",
      payload: { prompt: "hello" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("should return 200 with valid API key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/chat",
      headers: { "x-api-key": "test-secret-key" },
      payload: { prompt: "hello" },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.text).toBe("Hello");
  });

  it("should allow /health without API key", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });
    expect(res.statusCode).toBe(200);
  });

  it("should allow /ready without API key", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/ready",
    });
    expect(res.statusCode).toBe(200);
  });

  it("should reject invalid request body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/chat",
      headers: { "x-api-key": "test-secret-key" },
      payload: { notAPrompt: 123 },
    });
    expect(res.statusCode).toBe(400);
  });

  it("should return 429 after rate limit exceeded", async () => {
    // Rate limit is set to 5 per minute
    const results = [];
    for (let i = 0; i < 7; i++) {
      const res = await app.inject({
        method: "GET",
        url: "/health",
      });
      results.push(res.statusCode);
    }
    expect(results).toContain(429);
  });
});
