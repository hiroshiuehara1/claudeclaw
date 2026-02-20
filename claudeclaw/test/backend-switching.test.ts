import { describe, it, expect, vi } from "vitest";
import { Engine } from "../src/core/engine.js";
import type { Backend, BackendEvent, BackendQueryOptions } from "../src/core/backend/types.js";
import { collectStream } from "../src/utils/stream.js";

function createMockBackend(name: string, events: BackendEvent[]): Backend {
  return {
    name,
    async *query(_prompt: string, _options: BackendQueryOptions) {
      for (const event of events) {
        yield event;
      }
    },
    async interrupt() {},
  };
}

const baseConfig = {
  defaultBackend: "claude" as const,
  dataDir: "/tmp/claw-test-bs",
  logLevel: "error" as const,
  web: { port: 3100, host: "127.0.0.1", corsOrigins: ["http://localhost:3100"], rateLimitMax: 100 },
  engine: { chatTimeout: 120_000, retryMaxAttempts: 1, retryBaseDelay: 100 },
  skills: [],
  vectorMemory: { enabled: false, topK: 5 },
  browserControl: { headless: true, timeout: 30000 },
};

describe("Engine backend switching", () => {
  it("should report current backend name", () => {
    const backend = createMockBackend("test-backend", []);
    const engine = new Engine({ config: baseConfig, backend });
    expect(engine.currentBackend).toBe("test-backend");
  });

  it("should switch to a new backend via setBackend", () => {
    const backend1 = createMockBackend("backend-1", []);
    const backend2 = createMockBackend("backend-2", []);
    const engine = new Engine({ config: baseConfig, backend: backend1 });

    expect(engine.currentBackend).toBe("backend-1");
    engine.setBackend(backend2);
    expect(engine.currentBackend).toBe("backend-2");
  });

  it("should switch back to a previously registered backend", () => {
    const backend1 = createMockBackend("backend-1", []);
    const backend2 = createMockBackend("backend-2", []);
    const engine = new Engine({ config: baseConfig, backend: backend1 });

    engine.setBackend(backend2);
    expect(engine.currentBackend).toBe("backend-2");

    engine.switchBackend("backend-1");
    expect(engine.currentBackend).toBe("backend-1");
  });

  it("should use builtinTools when no skill tools exist", async () => {
    let capturedOptions: BackendQueryOptions | undefined;
    const backend: Backend = {
      name: "capture",
      async *query(_prompt: string, options: BackendQueryOptions) {
        capturedOptions = options;
        yield { type: "done" as const };
      },
      async interrupt() {},
    };

    const engine = new Engine({
      config: baseConfig,
      backend,
      builtinTools: [
        { name: "test_tool", description: "A test tool", inputSchema: { type: "object", properties: {} }, execute: async () => "ok" },
      ],
    });

    await collectStream(engine.chat("test", "s1"));
    expect(capturedOptions?.tools).toHaveLength(1);
    expect(capturedOptions?.tools?.[0].name).toBe("test_tool");
  });

  it("should list available models", () => {
    const engine = new Engine({
      config: { ...baseConfig, anthropicApiKey: "sk-test" },
      backend: createMockBackend("test", []),
    });
    const models = engine.getAvailableModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].backend).toBe("claude");
  });

  it("should return empty models when no API keys configured", () => {
    const engine = new Engine({
      config: baseConfig,
      backend: createMockBackend("test", []),
    });
    const models = engine.getAvailableModels();
    expect(models).toHaveLength(0);
  });

  it("should return registered skills", () => {
    const engine = new Engine({
      config: baseConfig,
      backend: createMockBackend("test", []),
    });
    const skills = engine.getRegisteredSkills();
    expect(skills).toHaveLength(0);
  });

  it("should return available tools (builtins)", () => {
    const tool = { name: "my_tool", description: "test", inputSchema: { type: "object" as const, properties: {} }, execute: async () => "ok" };
    const engine = new Engine({
      config: baseConfig,
      backend: createMockBackend("test", []),
      builtinTools: [tool],
    });
    const tools = engine.getAvailableTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("my_tool");
  });
});
