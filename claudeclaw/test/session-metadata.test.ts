import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tmpdir } from "node:os";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Engine } from "../src/core/engine.js";
import { SqliteStore } from "../src/core/memory/sqlite-store.js";
import { MemoryManager } from "../src/core/memory/memory-manager.js";
import type { Backend, BackendEvent, BackendQueryOptions } from "../src/core/backend/types.js";
import { collectStream } from "../src/utils/stream.js";

function createMockBackend(): Backend {
  return {
    name: "test-backend",
    async *query(_prompt: string, _options: BackendQueryOptions) {
      yield { type: "text" as const, text: "response" };
      yield { type: "done" as const };
    },
    async interrupt() {},
  };
}

describe("Session Metadata Tracking", () => {
  let tmpDir: string;
  let store: SqliteStore;
  let mm: MemoryManager;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "claw-session-meta-"));
    store = new SqliteStore(tmpDir);
    mm = new MemoryManager(store);
  });

  afterEach(() => {
    store.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should populate session metadata on chat", async () => {
    const engine = new Engine({
      config: {
        defaultBackend: "claude",
        dataDir: tmpDir,
        logLevel: "error",
        web: { port: 3100, host: "127.0.0.1" },
        skills: [],
      } as any,
      backend: createMockBackend(),
      memoryManager: mm,
    });

    await collectStream(engine.chat("hello", "sess-1"));

    const session = store.getSession("sess-1");
    expect(session).toBeDefined();
    expect(session!.id).toBe("sess-1");
    expect(session!.backend).toBe("test-backend");
  });

  it("should use backend name from actual backend", async () => {
    const backend: Backend = {
      name: "my-custom-backend",
      async *query() {
        yield { type: "text" as const, text: "ok" };
        yield { type: "done" as const };
      },
      async interrupt() {},
    };

    const engine = new Engine({
      config: {
        defaultBackend: "claude",
        dataDir: tmpDir,
        logLevel: "error",
        web: { port: 3100, host: "127.0.0.1" },
        skills: [],
      } as any,
      backend,
      memoryManager: mm,
    });

    await collectStream(engine.chat("hi", "sess-2"));

    const session = store.getSession("sess-2");
    expect(session!.backend).toBe("my-custom-backend");
  });

  it("should update session on subsequent chats", async () => {
    const engine = new Engine({
      config: {
        defaultBackend: "claude",
        dataDir: tmpDir,
        logLevel: "error",
        web: { port: 3100, host: "127.0.0.1" },
        skills: [],
      } as any,
      backend: createMockBackend(),
      memoryManager: mm,
    });

    await collectStream(engine.chat("hello", "sess-3"));
    const session1 = store.getSession("sess-3");

    await collectStream(engine.chat("again", "sess-3"));
    const session2 = store.getSession("sess-3");

    expect(session2!.id).toBe("sess-3");
    expect(session2!.message_count).toBe(4); // 2 user + 2 assistant
  });

  it("MemoryManager.ensureSession should delegate to store", () => {
    mm.ensureSession("test-s", "claude", "claude-3", "/tmp");
    const session = store.getSession("test-s");
    expect(session).toBeDefined();
    expect(session!.backend).toBe("claude");
    expect(session!.model).toBe("claude-3");
  });

  it("should store model from options when provided", async () => {
    const engine = new Engine({
      config: {
        defaultBackend: "claude",
        dataDir: tmpDir,
        logLevel: "error",
        web: { port: 3100, host: "127.0.0.1" },
        skills: [],
        defaultModel: "default-model",
      } as any,
      backend: createMockBackend(),
      memoryManager: mm,
    });

    await collectStream(engine.chat("hi", "sess-model", { model: "custom-model" }));

    const session = store.getSession("sess-model");
    expect(session!.model).toBe("custom-model");
  });

  it("should not crash when memoryManager is not set", async () => {
    const engine = new Engine({
      config: {
        defaultBackend: "claude",
        dataDir: tmpDir,
        logLevel: "error",
        web: { port: 3100, host: "127.0.0.1" },
        skills: [],
      } as any,
      backend: createMockBackend(),
    });

    const events = await collectStream(engine.chat("hi", "sess-no-mem"));
    expect(events.length).toBeGreaterThan(0);
  });
});
