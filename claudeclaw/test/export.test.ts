import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { SqliteStore } from "../src/core/memory/sqlite-store.js";
import { MemoryManager } from "../src/core/memory/memory-manager.js";
import { registerExportRoutes } from "../src/interfaces/web/export.js";
import type { Engine } from "../src/core/engine.js";

describe("Conversation Export", () => {
  let dir: string;
  let store: SqliteStore;
  let mm: MemoryManager;
  let app: FastifyInstance;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "claw-export-test-"));
    store = new SqliteStore(dir);
    mm = new MemoryManager(store);
    app = Fastify();

    const engine = { memory: mm } as unknown as Engine;
    registerExportRoutes(app, engine);

    // Seed test data
    store.ensureSession("s1", "claude", "claude-3");
    store.addMessage("s1", "user", "Hello AI");
    store.addMessage("s1", "assistant", "Hello! How can I help?");
  });

  afterEach(async () => {
    await app.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("should export as JSON by default", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/sessions/s1/export",
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.headers["content-disposition"]).toContain("session-s1.json");

    const body = res.json();
    expect(body.session.id).toBe("s1");
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe("user");
    expect(body.messages[1].role).toBe("assistant");
  });

  it("should export as JSON explicitly", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/sessions/s1/export?format=json",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.session).toBeDefined();
    expect(body.messages).toBeDefined();
  });

  it("should export as Markdown", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/sessions/s1/export?format=markdown",
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/markdown");
    expect(res.headers["content-disposition"]).toContain("session-s1.md");

    const body = res.body;
    expect(body).toContain("# Session s1");
    expect(body).toContain("### User");
    expect(body).toContain("Hello AI");
    expect(body).toContain("### Assistant");
    expect(body).toContain("Hello! How can I help?");
    expect(body).toContain("---");
  });

  it("should include model in markdown export", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/sessions/s1/export?format=markdown",
    });

    expect(res.body).toContain("**Model:** claude-3");
  });

  it("should return 404 for nonexistent session", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/sessions/nope/export",
    });

    expect(res.statusCode).toBe(404);
  });

  it("should return 503 when memory is not configured", async () => {
    const noMemoryApp = Fastify();
    registerExportRoutes(noMemoryApp, { memory: undefined } as unknown as Engine);

    const res = await noMemoryApp.inject({
      method: "GET",
      url: "/api/sessions/s1/export",
    });

    expect(res.statusCode).toBe(503);
    await noMemoryApp.close();
  });
});
