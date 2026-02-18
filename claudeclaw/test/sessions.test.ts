import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { SqliteStore } from "../src/core/memory/sqlite-store.js";
import { MemoryManager } from "../src/core/memory/memory-manager.js";
import { registerSessionRoutes } from "../src/interfaces/web/sessions.js";
import type { Engine } from "../src/core/engine.js";

describe("SqliteStore session methods", () => {
  let dir: string;
  let store: SqliteStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "claw-session-test-"));
    store = new SqliteStore(dir);
  });

  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("should list sessions with message counts", () => {
    store.ensureSession("s1", "claude", "model-a");
    store.ensureSession("s2", "openai", "model-b");
    store.addMessage("s1", "user", "hello");
    store.addMessage("s2", "user", "hi");
    store.addMessage("s2", "assistant", "hello back");

    const sessions = store.listSessions();
    expect(sessions).toHaveLength(2);

    const s1 = sessions.find((s) => s.id === "s1")!;
    const s2 = sessions.find((s) => s.id === "s2")!;
    expect(s1.message_count).toBe(1);
    expect(s2.message_count).toBe(2);
    expect(s2.backend).toBe("openai");
  });

  it("should paginate sessions", () => {
    store.ensureSession("s1");
    store.ensureSession("s2");
    store.ensureSession("s3");

    const page1 = store.listSessions(2, 0);
    expect(page1).toHaveLength(2);
    const page2 = store.listSessions(2, 2);
    expect(page2).toHaveLength(1);
  });

  it("should get a single session with message count", () => {
    store.ensureSession("s1", "claude");
    store.addMessage("s1", "user", "test");
    store.addMessage("s1", "assistant", "response");

    const session = store.getSession("s1");
    expect(session).toBeDefined();
    expect(session!.id).toBe("s1");
    expect(session!.message_count).toBe(2);
  });

  it("should return undefined for nonexistent session", () => {
    expect(store.getSession("nope")).toBeUndefined();
  });

  it("should delete session and its messages", () => {
    store.ensureSession("s1");
    store.addMessage("s1", "user", "hello");
    store.addMessage("s1", "assistant", "hi");

    store.deleteSession("s1");
    expect(store.getSession("s1")).toBeUndefined();
    expect(store.getMessages("s1")).toHaveLength(0);
  });

  it("should get all messages ordered ASC", () => {
    store.addMessage("s1", "user", "first");
    store.addMessage("s1", "assistant", "second");
    store.addMessage("s1", "user", "third");

    const msgs = store.getAllMessages("s1");
    expect(msgs).toHaveLength(3);
    expect(msgs[0].content).toBe("first");
    expect(msgs[2].content).toBe("third");
  });
});

describe("Session REST API", () => {
  let dir: string;
  let store: SqliteStore;
  let mm: MemoryManager;
  let app: FastifyInstance;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "claw-session-api-"));
    store = new SqliteStore(dir);
    mm = new MemoryManager(store);
    app = Fastify();

    const engine = { memory: mm } as unknown as Engine;
    registerSessionRoutes(app, engine);
  });

  afterEach(async () => {
    await app.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("GET /api/sessions should return session list", async () => {
    store.ensureSession("s1");
    store.addMessage("s1", "user", "hi");

    const res = await app.inject({ method: "GET", url: "/api/sessions" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0].id).toBe("s1");
  });

  it("GET /api/sessions should support pagination", async () => {
    store.ensureSession("s1");
    store.ensureSession("s2");
    store.ensureSession("s3");

    const res = await app.inject({ method: "GET", url: "/api/sessions?limit=2&offset=0" });
    expect(res.json().sessions).toHaveLength(2);
  });

  it("GET /api/sessions/:id should return session with messages", async () => {
    store.ensureSession("s1");
    store.addMessage("s1", "user", "hello");
    store.addMessage("s1", "assistant", "hi there");

    const res = await app.inject({ method: "GET", url: "/api/sessions/s1" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.session.id).toBe("s1");
    expect(body.messages).toHaveLength(2);
  });

  it("GET /api/sessions/:id should return 404 for nonexistent", async () => {
    const res = await app.inject({ method: "GET", url: "/api/sessions/nope" });
    expect(res.statusCode).toBe(404);
  });

  it("DELETE /api/sessions/:id should delete session", async () => {
    store.ensureSession("s1");
    store.addMessage("s1", "user", "hello");

    const res = await app.inject({ method: "DELETE", url: "/api/sessions/s1" });
    expect(res.statusCode).toBe(200);
    expect(res.json().deleted).toBe(true);

    // Verify it's gone
    const check = await app.inject({ method: "GET", url: "/api/sessions/s1" });
    expect(check.statusCode).toBe(404);
  });

  it("DELETE /api/sessions/:id should return 404 for nonexistent", async () => {
    const res = await app.inject({ method: "DELETE", url: "/api/sessions/nope" });
    expect(res.statusCode).toBe(404);
  });

  it("should return 503 when memory is not configured", async () => {
    const noMemoryApp = Fastify();
    const engine = { memory: undefined } as unknown as Engine;
    registerSessionRoutes(noMemoryApp, engine);

    const res = await noMemoryApp.inject({ method: "GET", url: "/api/sessions" });
    expect(res.statusCode).toBe(503);
    await noMemoryApp.close();
  });
});
