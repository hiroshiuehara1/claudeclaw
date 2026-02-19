import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import { registerRequestLogger } from "../src/interfaces/web/middleware/request-logger.js";

describe("Request Logger Middleware", () => {
  const app = Fastify();

  beforeAll(async () => {
    registerRequestLogger(app);

    // Add a test route
    app.get("/test", async () => {
      return { ok: true };
    });

    app.get("/slow", async () => {
      await new Promise((r) => setTimeout(r, 50));
      return { ok: true };
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should add X-Request-Id header to response", async () => {
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(typeof res.headers["x-request-id"]).toBe("string");
  });

  it("should use client-provided X-Request-Id", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/test",
      headers: { "x-request-id": "custom-req-123" },
    });
    expect(res.headers["x-request-id"]).toBe("custom-req-123");
  });

  it("should generate unique request IDs", async () => {
    const res1 = await app.inject({ method: "GET", url: "/test" });
    const res2 = await app.inject({ method: "GET", url: "/test" });
    expect(res1.headers["x-request-id"]).not.toBe(res2.headers["x-request-id"]);
  });

  it("should work with slow routes", async () => {
    const res = await app.inject({ method: "GET", url: "/slow" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("should handle 404 routes", async () => {
    const res = await app.inject({ method: "GET", url: "/nonexistent" });
    expect(res.statusCode).toBe(404);
    // Request logger hooks still run for 404s
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("should return valid JSON body for test route", async () => {
    const res = await app.inject({ method: "GET", url: "/test" });
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
  });
});
