import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SqliteStore } from "../src/core/memory/sqlite-store.js";
import { MemoryManager } from "../src/core/memory/memory-manager.js";

describe("CLI Session & Memory Commands (unit)", () => {
  let dataDir: string;
  let store: SqliteStore;
  let mm: MemoryManager;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), "claw-cli-test-"));
    store = new SqliteStore(dataDir);
    mm = new MemoryManager(store);
  });

  afterEach(() => {
    store.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  // Session commands
  it("session list should return empty for fresh DB", () => {
    const sessions = mm.listSessions(20);
    expect(sessions).toEqual([]);
  });

  it("session list should return sessions after adding messages", () => {
    store.ensureSession("sess-1", "claude", "sonnet");
    store.addMessage("sess-1", "user", "hello");
    const sessions = mm.listSessions(20);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe("sess-1");
    expect(sessions[0].message_count).toBe(1);
  });

  it("session show should return session details", () => {
    store.ensureSession("sess-2", "openai", "gpt-4o");
    store.addMessage("sess-2", "user", "test prompt");
    const session = mm.getSession("sess-2");
    expect(session).toBeDefined();
    expect(session!.id).toBe("sess-2");
    expect(session!.backend).toBe("openai");
  });

  it("session show should return undefined for missing session", () => {
    const session = mm.getSession("nonexistent");
    expect(session).toBeUndefined();
  });

  it("session delete should remove session and messages", () => {
    store.ensureSession("sess-3");
    store.addMessage("sess-3", "user", "hello");
    store.addMessage("sess-3", "assistant", "hi");
    mm.deleteSession("sess-3");
    expect(mm.getSession("sess-3")).toBeUndefined();
    expect(mm.getAllMessages("sess-3")).toHaveLength(0);
  });

  it("session export should return messages for a session", () => {
    store.ensureSession("sess-4");
    store.addMessage("sess-4", "user", "q1");
    store.addMessage("sess-4", "assistant", "a1");
    const messages = mm.getAllMessages("sess-4");
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("user");
    expect(messages[1].role).toBe("assistant");
  });

  it("session clean should remove expired sessions", () => {
    store.ensureSession("old-sess");
    store.addMessage("old-sess", "user", "old msg");
    // Won't be cleaned because TTL is 168h and it's fresh
    const count = mm.cleanExpiredSessions(168);
    expect(count).toBe(0);
  });

  // Memory commands
  it("memory list should return empty for fresh DB", () => {
    const memories = mm.getMemories();
    expect(memories).toEqual([]);
  });

  it("memory set should store and retrieve a memory", async () => {
    await mm.remember("preferences: theme = dark");
    const memories = mm.getMemories("preferences");
    expect(memories).toHaveLength(1);
    expect(memories[0].key).toBe("theme");
    expect(memories[0].value).toBe("dark");
  });

  it("memory list with category filter should only return matching", async () => {
    await mm.remember("preferences: theme = dark");
    await mm.remember("skills: python = advanced");
    const prefs = mm.getMemories("preferences");
    expect(prefs).toHaveLength(1);
    expect(prefs[0].category).toBe("preferences");
  });

  it("memory delete should remove a specific memory", async () => {
    await mm.remember("facts: color = blue");
    expect(mm.getMemories("facts")).toHaveLength(1);
    const deleted = mm.deleteMemory("facts", "color");
    expect(deleted).toBe(true);
    expect(mm.getMemories("facts")).toHaveLength(0);
  });

  it("memory delete should return false for nonexistent memory", () => {
    const deleted = mm.deleteMemory("nope", "nothing");
    expect(deleted).toBe(false);
  });
});
