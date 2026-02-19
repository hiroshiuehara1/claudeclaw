import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SqliteStore } from "../src/core/memory/sqlite-store.js";
import { MemoryManager } from "../src/core/memory/memory-manager.js";
import { ConfigSchema } from "../src/core/config/schema.js";

// Mock logger
vi.mock("../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  createChildLogger: vi.fn(() => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  })),
}));

describe("Session Expiry", () => {
  let dir: string;
  let store: SqliteStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "claw-expiry-"));
    store = new SqliteStore(dir);
  });

  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("should delete expired sessions", () => {
    // Create a session and set its updated_at to 200 hours ago
    store.ensureSession("old-session", "claude", "sonnet");
    store.addMessage("old-session", "user", "old message");

    // Manually backdate the session
    const db = (store as any).db;
    db.prepare(
      `UPDATE sessions SET updated_at = datetime('now', '-200 hours') WHERE id = ?`,
    ).run("old-session");

    const deleted = store.cleanExpiredSessions(168);
    expect(deleted).toBe(1);

    // Session should be gone
    expect(store.getSession("old-session")).toBeUndefined();
    // Messages should also be deleted
    expect(store.getMessages("old-session")).toHaveLength(0);
  });

  it("should preserve recent sessions", () => {
    store.ensureSession("new-session", "openai", "gpt-4o");
    store.addMessage("new-session", "user", "recent message");

    const deleted = store.cleanExpiredSessions(168);
    expect(deleted).toBe(0);

    expect(store.getSession("new-session")).toBeDefined();
    expect(store.getMessages("new-session")).toHaveLength(1);
  });

  it("should cascade delete messages for expired sessions", () => {
    store.ensureSession("expire-me", "claude");
    store.addMessage("expire-me", "user", "msg1");
    store.addMessage("expire-me", "assistant", "msg2");
    store.addMessage("expire-me", "user", "msg3");

    const db = (store as any).db;
    db.prepare(
      `UPDATE sessions SET updated_at = datetime('now', '-500 hours') WHERE id = ?`,
    ).run("expire-me");

    store.cleanExpiredSessions(168);

    expect(store.getMessages("expire-me")).toHaveLength(0);
    expect(store.getSession("expire-me")).toBeUndefined();
  });

  it("should handle mixed expired and active sessions", () => {
    store.ensureSession("old-1", "claude");
    store.ensureSession("old-2", "openai");
    store.ensureSession("active-1", "claude");

    const db = (store as any).db;
    db.prepare(
      `UPDATE sessions SET updated_at = datetime('now', '-200 hours') WHERE id IN ('old-1', 'old-2')`,
    ).run();

    const deleted = store.cleanExpiredSessions(168);
    expect(deleted).toBe(2);
    expect(store.getSession("active-1")).toBeDefined();
    expect(store.getSession("old-1")).toBeUndefined();
    expect(store.getSession("old-2")).toBeUndefined();
  });

  it("should return 0 when no sessions are expired", () => {
    store.ensureSession("fresh", "claude");
    const deleted = store.cleanExpiredSessions(168);
    expect(deleted).toBe(0);
  });
});

describe("MemoryManager.cleanExpiredSessions", () => {
  let dir: string;
  let store: SqliteStore;
  let manager: MemoryManager;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "claw-mm-expiry-"));
    store = new SqliteStore(dir);
    manager = new MemoryManager(store);
  });

  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("should delegate to store.cleanExpiredSessions", () => {
    store.ensureSession("old", "claude");
    const db = (store as any).db;
    db.prepare(
      `UPDATE sessions SET updated_at = datetime('now', '-300 hours') WHERE id = ?`,
    ).run("old");

    const deleted = manager.cleanExpiredSessions(168);
    expect(deleted).toBe(1);
  });
});

describe("Config schema sessionTtlHours", () => {
  it("should accept sessionTtlHours in engine config", () => {
    const config = ConfigSchema.parse({
      engine: { sessionTtlHours: 24 },
    });
    expect(config.engine.sessionTtlHours).toBe(24);
  });

  it("should default sessionTtlHours to 168", () => {
    const config = ConfigSchema.parse({});
    expect(config.engine.sessionTtlHours).toBe(168);
  });
});
