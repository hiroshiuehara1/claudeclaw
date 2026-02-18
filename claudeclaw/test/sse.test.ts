import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { registerSseRoutes } from "../src/interfaces/web/sse.js";
import type { Engine } from "../src/core/engine.js";
import type { BackendEvent } from "../src/core/backend/types.js";

function createMockEngine(events: BackendEvent[]): Engine {
  return {
    config: {
      defaultBackend: "claude",
      dataDir: "/tmp",
      logLevel: "error",
      web: { port: 3100, host: "127.0.0.1", corsOrigins: [], rateLimitMax: 100 },
      engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
      skills: [],
    },
    async *chat(_prompt: string, _sessionId: string) {
      for (const event of events) yield event;
    },
  } as unknown as Engine;
}

describe("SSE Streaming", () => {
  let app: FastifyInstance;

  afterEach(async () => {
    if (app) await app.close();
  });

  it("should return 200 with text/event-stream content type", async () => {
    const engine = createMockEngine([
      { type: "text", text: "Hello" },
      { type: "done" },
    ]);
    app = Fastify();
    registerSseRoutes(app, engine);

    const res = await app.inject({
      method: "GET",
      url: "/api/chat/stream?prompt=hello",
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("text/event-stream");
  });

  it("should include X-Session-Id header", async () => {
    const engine = createMockEngine([{ type: "done" }]);
    app = Fastify();
    registerSseRoutes(app, engine);

    const res = await app.inject({
      method: "GET",
      url: "/api/chat/stream?prompt=hello",
    });

    expect(res.headers["x-session-id"]).toBeDefined();
    expect(typeof res.headers["x-session-id"]).toBe("string");
  });

  it("should use provided sessionId", async () => {
    const engine = createMockEngine([{ type: "done" }]);
    app = Fastify();
    registerSseRoutes(app, engine);

    const res = await app.inject({
      method: "GET",
      url: "/api/chat/stream?prompt=hello&sessionId=my-session",
    });

    expect(res.headers["x-session-id"]).toBe("my-session");
  });

  it("should write events in SSE format", async () => {
    const engine = createMockEngine([
      { type: "text", text: "Hello " },
      { type: "text", text: "world" },
      { type: "done" },
    ]);
    app = Fastify();
    registerSseRoutes(app, engine);

    const res = await app.inject({
      method: "GET",
      url: "/api/chat/stream?prompt=hello",
    });

    const body = res.body;
    expect(body).toContain("event: text\n");
    expect(body).toContain("event: done\n");
    expect(body).toContain('"text":"Hello "');
    expect(body).toContain('"text":"world"');
  });

  it("should return 400 on missing prompt", async () => {
    const engine = createMockEngine([]);
    app = Fastify();
    registerSseRoutes(app, engine);

    const res = await app.inject({
      method: "GET",
      url: "/api/chat/stream",
    });

    expect(res.statusCode).toBe(400);
  });

  it("should handle error events from engine", async () => {
    const engine = createMockEngine([
      { type: "error", error: "Something went wrong" },
    ]);
    app = Fastify();
    registerSseRoutes(app, engine);

    const res = await app.inject({
      method: "GET",
      url: "/api/chat/stream?prompt=hello",
    });

    expect(res.body).toContain("event: error\n");
    expect(res.body).toContain("Something went wrong");
  });

  it("should stream error event on engine exception", async () => {
    const engine = {
      config: {
        defaultBackend: "claude",
        dataDir: "/tmp",
        logLevel: "error",
        web: { port: 3100, host: "127.0.0.1", corsOrigins: [], rateLimitMax: 100 },
        engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
        skills: [],
      },
      async *chat() {
        throw new Error("Backend failure");
      },
    } as unknown as Engine;
    app = Fastify();
    registerSseRoutes(app, engine);

    const res = await app.inject({
      method: "GET",
      url: "/api/chat/stream?prompt=hello",
    });

    expect(res.body).toContain("event: error\n");
    expect(res.body).toContain("Backend failure");
  });
});
