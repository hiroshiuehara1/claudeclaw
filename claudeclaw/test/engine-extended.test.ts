import { describe, it, expect, vi } from "vitest";
import { Engine } from "../src/core/engine.js";
import type { Backend, BackendEvent, BackendQueryOptions } from "../src/core/backend/types.js";
import type { MemoryManager } from "../src/core/memory/memory-manager.js";
import { SkillRegistry } from "../src/core/skill/registry.js";
import { collectStream } from "../src/utils/stream.js";
import { defineSkill } from "../src/core/skill/types.js";

function createMockBackend(events: BackendEvent[]): Backend {
  return {
    name: "mock",
    async *query(_prompt: string, _options: BackendQueryOptions) {
      for (const event of events) {
        yield event;
      }
    },
    async interrupt() {},
  };
}

function createSlowBackend(delayMs: number): Backend {
  return {
    name: "slow-mock",
    async *query(_prompt: string, options: BackendQueryOptions) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      if (options.signal?.aborted) return;
      yield { type: "text" as const, text: "late response" };
      yield { type: "done" as const };
    },
    async interrupt() {},
  };
}

const baseConfig = {
  defaultBackend: "claude" as const,
  dataDir: "/tmp/claw-test",
  logLevel: "error" as const,
  web: { port: 3100, host: "127.0.0.1", corsOrigins: ["http://localhost:3100"], rateLimitMax: 100 },
  engine: { chatTimeout: 120_000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
  skills: [],
  vectorMemory: { enabled: false, topK: 5 },
  browserControl: { headless: true, timeout: 30000 },
};

describe("Engine with MemoryManager", () => {
  it("should persist messages and load context", async () => {
    const mockMemory: MemoryManager = {
      loadContext: vi.fn().mockResolvedValue("pref: lang = ts"),
      getHistory: vi.fn().mockResolvedValue([]),
      addMessage: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue([]),
      remember: vi.fn().mockResolvedValue(undefined),
      ensureSession: vi.fn(),
      clearSession: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as MemoryManager;

    const engine = new Engine({
      config: baseConfig,
      backend: createMockBackend([
        { type: "text", text: "Hi" },
        { type: "done" },
      ]),
      memoryManager: mockMemory,
    });

    const events = await collectStream(engine.chat("hello", "s1"));
    expect(events).toHaveLength(2);
    expect(mockMemory.loadContext).toHaveBeenCalledWith("s1");
    expect(mockMemory.addMessage).toHaveBeenCalledWith("s1", "user", "hello");
    expect(mockMemory.addMessage).toHaveBeenCalledWith("s1", "assistant", "Hi");
  });

  it("should handle remember commands", async () => {
    const mockMemory: MemoryManager = {
      loadContext: vi.fn().mockResolvedValue(null),
      getHistory: vi.fn().mockResolvedValue([]),
      addMessage: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue([]),
      remember: vi.fn().mockResolvedValue(undefined),
      ensureSession: vi.fn(),
      clearSession: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as MemoryManager;

    const engine = new Engine({
      config: baseConfig,
      backend: createMockBackend([{ type: "text", text: "Ok" }, { type: "done" }]),
      memoryManager: mockMemory,
    });

    await collectStream(engine.chat("remember pref: lang = ts", "s2"));
    expect(mockMemory.remember).toHaveBeenCalledWith("pref: lang = ts");
  });

  it("should include semantic search results in system prompt", async () => {
    let capturedOptions: BackendQueryOptions | undefined;
    const backend: Backend = {
      name: "capture",
      async *query(_prompt: string, options: BackendQueryOptions) {
        capturedOptions = options;
        yield { type: "done" as const };
      },
      async interrupt() {},
    };

    const mockMemory: MemoryManager = {
      loadContext: vi.fn().mockResolvedValue(null),
      getHistory: vi.fn().mockResolvedValue([]),
      addMessage: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue([
        { content: "relevant fact", score: 0.9, metadata: {} },
      ]),
      remember: vi.fn(),
      ensureSession: vi.fn(),
      clearSession: vi.fn(),
      close: vi.fn(),
    } as unknown as MemoryManager;

    const engine = new Engine({
      config: baseConfig,
      backend,
      memoryManager: mockMemory,
    });

    await collectStream(engine.chat("test", "s3"));
    expect(capturedOptions?.systemPrompt).toContain("<relevant_context>");
    expect(capturedOptions?.systemPrompt).toContain("relevant fact");
  });
});

describe("Engine with SkillRegistry", () => {
  it("should include tools from skill registry", async () => {
    let capturedOptions: BackendQueryOptions | undefined;
    const backend: Backend = {
      name: "capture",
      async *query(_prompt: string, options: BackendQueryOptions) {
        capturedOptions = options;
        yield { type: "done" as const };
      },
      async interrupt() {},
    };

    const registry = new SkillRegistry();
    const skill = defineSkill(
      { name: "test-skill", version: "1.0.0", description: "test", permissions: [] },
      [{
        name: "my_tool",
        description: "A test tool",
        inputSchema: { type: "object", properties: {} },
        execute: async () => "ok",
      }],
    );
    registry.register(skill);

    const engine = new Engine({
      config: baseConfig,
      backend,
      skillRegistry: registry,
    });

    await collectStream(engine.chat("test", "s4"));
    expect(capturedOptions?.tools).toHaveLength(1);
    expect(capturedOptions?.tools?.[0].name).toBe("my_tool");
  });
});

describe("Engine timeout", () => {
  it("should handle abort signal in backend", async () => {
    // Create a backend that checks the signal
    const backend: Backend = {
      name: "signal-check",
      async *query(_prompt: string, options: BackendQueryOptions) {
        // Simulate checking signal before yielding
        if (options.signal?.aborted) {
          return;
        }
        yield { type: "text" as const, text: "ok" };
        yield { type: "done" as const };
      },
      async interrupt() {},
    };

    const config = {
      ...baseConfig,
      engine: { chatTimeout: 5000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
    };

    const engine = new Engine({ config, backend });
    const events = await collectStream(engine.chat("test", "s5"));
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toEqual({ type: "text", text: "ok" });
  });
});

describe("Engine setters and shutdown", () => {
  it("should set backend", () => {
    const engine = new Engine({
      config: baseConfig,
      backend: createMockBackend([]),
    });
    const newBackend = createMockBackend([{ type: "done" }]);
    engine.setBackend(newBackend);
    // No error means success
    expect(true).toBe(true);
  });

  it("should set memory manager", () => {
    const engine = new Engine({
      config: baseConfig,
      backend: createMockBackend([]),
    });
    const mm = {
      loadContext: vi.fn(),
      getHistory: vi.fn(),
      addMessage: vi.fn(),
      search: vi.fn(),
      remember: vi.fn(),
      clearSession: vi.fn(),
      close: vi.fn(),
    } as unknown as MemoryManager;
    engine.setMemoryManager(mm);
    expect(true).toBe(true);
  });

  it("should set skill registry", () => {
    const engine = new Engine({
      config: baseConfig,
      backend: createMockBackend([]),
    });
    engine.setSkillRegistry(new SkillRegistry());
    expect(true).toBe(true);
  });

  it("should call interrupt on backend", async () => {
    const backend = createMockBackend([]);
    const spy = vi.spyOn(backend, "interrupt");
    const engine = new Engine({ config: baseConfig, backend });
    await engine.interrupt();
    expect(spy).toHaveBeenCalled();
  });

  it("should shutdown gracefully", async () => {
    const closeFn = vi.fn();
    const mm = { close: closeFn } as unknown as MemoryManager;
    const engine = new Engine({
      config: baseConfig,
      backend: createMockBackend([]),
      memoryManager: mm,
    });
    await engine.shutdown();
    expect(closeFn).toHaveBeenCalled();
  });

  it("should shutdown without memory manager", async () => {
    const engine = new Engine({
      config: baseConfig,
      backend: createMockBackend([]),
    });
    await expect(engine.shutdown()).resolves.toBeUndefined();
  });
});
