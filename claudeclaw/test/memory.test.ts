import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SqliteStore } from "../src/core/memory/sqlite-store.js";
import { MemoryManager } from "../src/core/memory/memory-manager.js";

describe("SqliteStore", () => {
  let dir: string;
  let store: SqliteStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "claw-test-"));
    store = new SqliteStore(dir);
  });

  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("should store and retrieve messages", () => {
    store.addMessage("s1", "user", "hello");
    store.addMessage("s1", "assistant", "hi there");
    const msgs = store.getMessages("s1");
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("user");
    expect(msgs[1].content).toBe("hi there");
  });

  it("should isolate messages by session", () => {
    store.addMessage("s1", "user", "msg1");
    store.addMessage("s2", "user", "msg2");
    expect(store.getMessages("s1")).toHaveLength(1);
    expect(store.getMessages("s2")).toHaveLength(1);
  });

  it("should upsert memories", () => {
    store.upsertMemory("pref", "theme", "dark");
    store.upsertMemory("pref", "theme", "light");
    const mems = store.getMemories("pref");
    expect(mems).toHaveLength(1);
    expect(mems[0].value).toBe("light");
  });

  it("should clear session messages", () => {
    store.addMessage("s1", "user", "hello");
    store.addMessage("s1", "assistant", "hi");
    store.clearSession("s1");
    expect(store.getMessages("s1")).toHaveLength(0);
  });
});

describe("MemoryManager", () => {
  let dir: string;
  let store: SqliteStore;
  let mm: MemoryManager;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "claw-test-mm-"));
    store = new SqliteStore(dir);
    mm = new MemoryManager(store);
  });

  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("should persist and retrieve conversation history", async () => {
    await mm.addMessage("s1", "user", "hello");
    await mm.addMessage("s1", "assistant", "hi");
    const history = await mm.getHistory("s1");
    expect(history).toHaveLength(2);
  });

  it("should remember structured facts", async () => {
    await mm.remember("pref: language = typescript");
    const context = await mm.loadContext("s1");
    expect(context).toContain("language");
    expect(context).toContain("typescript");
  });

  it("should remember simple facts", async () => {
    await mm.remember("I prefer dark mode");
    const context = await mm.loadContext("s1");
    expect(context).toContain("I prefer dark mode");
  });

  it("should return null context when no memories", async () => {
    const context = await mm.loadContext("s1");
    expect(context).toBeNull();
  });
});
