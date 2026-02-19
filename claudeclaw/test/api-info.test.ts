import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import { registerApiInfoRoutes } from "../src/interfaces/web/api-info.js";
import type { Engine } from "../src/core/engine.js";

function createMockEngine(opts: {
  tools?: { name: string; description: string; inputSchema: Record<string, unknown> }[];
  skills?: { manifest: { name: string; version: string; description: string; permissions: string[] }; tools: unknown[] }[];
  models?: { backend: string; models: string[] }[];
} = {}): Engine {
  return {
    config: {
      defaultBackend: "claude",
      anthropicApiKey: "sk-ant-test",
      dataDir: "/tmp/claw-test",
      logLevel: "error",
      web: { port: 0, host: "127.0.0.1", corsOrigins: [], rateLimitMax: 100, drainTimeout: 5000 },
      engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000, sessionTtlHours: 168 },
      skills: [],
      vectorMemory: { enabled: false, topK: 5 },
      browserControl: { headless: true, timeout: 30000 },
    },
    getAvailableTools: () => opts.tools || [],
    getAvailableModels: () => opts.models || [{ backend: "claude", models: ["claude-sonnet-4-20250514"] }],
    getRegisteredSkills: () => opts.skills || [],
  } as unknown as Engine;
}

describe("API Info Endpoints", () => {
  describe("GET /api/tools", () => {
    it("should return empty array when no tools", async () => {
      const app = Fastify();
      registerApiInfoRoutes(app, createMockEngine());
      await app.ready();
      const res = await app.inject({ method: "GET", url: "/api/tools" });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual([]);
      await app.close();
    });

    it("should return tools with schemas", async () => {
      const tools = [
        { name: "search", description: "Search the web", inputSchema: { type: "object" } },
      ];
      const app = Fastify();
      registerApiInfoRoutes(app, createMockEngine({ tools }));
      await app.ready();
      const res = await app.inject({ method: "GET", url: "/api/tools" });
      const body = JSON.parse(res.body);
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe("search");
      expect(body[0].inputSchema).toEqual({ type: "object" });
      await app.close();
    });
  });

  describe("GET /api/models", () => {
    it("should return available models", async () => {
      const app = Fastify();
      registerApiInfoRoutes(app, createMockEngine());
      await app.ready();
      const res = await app.inject({ method: "GET", url: "/api/models" });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveLength(1);
      expect(body[0].backend).toBe("claude");
      await app.close();
    });

    it("should return multiple backends when configured", async () => {
      const models = [
        { backend: "claude", models: ["claude-sonnet-4-20250514"] },
        { backend: "openai", models: ["gpt-4o"] },
      ];
      const app = Fastify();
      registerApiInfoRoutes(app, createMockEngine({ models }));
      await app.ready();
      const res = await app.inject({ method: "GET", url: "/api/models" });
      const body = JSON.parse(res.body);
      expect(body).toHaveLength(2);
      await app.close();
    });
  });

  describe("GET /api/config", () => {
    it("should return redacted config", async () => {
      const app = Fastify();
      registerApiInfoRoutes(app, createMockEngine());
      await app.ready();
      const res = await app.inject({ method: "GET", url: "/api/config" });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.anthropicApiKey).toBe("sk-a****");
      expect(body.defaultBackend).toBe("claude");
      await app.close();
    });
  });

  describe("GET /api/skills", () => {
    it("should return empty array when no skills", async () => {
      const app = Fastify();
      registerApiInfoRoutes(app, createMockEngine());
      await app.ready();
      const res = await app.inject({ method: "GET", url: "/api/skills" });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual([]);
      await app.close();
    });

    it("should return skills with metadata", async () => {
      const skills = [
        {
          manifest: { name: "web-search", version: "1.0.0", description: "Search web", permissions: ["network"] },
          tools: [{}],
        },
      ];
      const app = Fastify();
      registerApiInfoRoutes(app, createMockEngine({ skills }));
      await app.ready();
      const res = await app.inject({ method: "GET", url: "/api/skills" });
      const body = JSON.parse(res.body);
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe("web-search");
      expect(body[0].tools).toBe(1);
      await app.close();
    });
  });
});
