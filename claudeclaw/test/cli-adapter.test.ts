import { describe, it, expect, vi } from "vitest";
import { CliAdapter } from "../src/interfaces/cli/index.js";
import type { Engine } from "../src/core/engine.js";
import type { BackendEvent, BackendQueryOptions } from "../src/core/backend/types.js";

function createMockEngine(events: BackendEvent[]): Engine {
  return {
    config: {
      defaultBackend: "claude",
      dataDir: "/tmp",
      logLevel: "error",
      web: { port: 3100, host: "127.0.0.1", corsOrigins: [], rateLimitMax: 100 },
      engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
      skills: [],
    },
    async *chat(_prompt: string, _sessionId: string, _options?: Partial<BackendQueryOptions>): AsyncGenerator<BackendEvent> {
      for (const event of events) {
        yield event;
      }
    },
  } as unknown as Engine;
}

describe("CliAdapter", () => {
  it("should start without error", async () => {
    const adapter = new CliAdapter();
    const engine = createMockEngine([]);
    await adapter.start(engine);
    expect(true).toBe(true);
  });

  it("should stop without error", async () => {
    const adapter = new CliAdapter();
    await adapter.stop();
    expect(true).toBe(true);
  });

  it("should run once and write text to stdout", async () => {
    const adapter = new CliAdapter();
    const engine = createMockEngine([
      { type: "text", text: "Response" },
      { type: "done" },
    ]);
    await adapter.start(engine);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await adapter.runOnce("test prompt");

    const written = writeSpy.mock.calls.map((c) => c[0]).join("");
    expect(written).toContain("Response");
    writeSpy.mockRestore();
  });

  it("should handle error events", async () => {
    const adapter = new CliAdapter();
    const engine = createMockEngine([
      { type: "error", error: "Something broke" },
      { type: "done" },
    ]);
    await adapter.start(engine);

    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    await adapter.runOnce("test");

    const written = stderrSpy.mock.calls.map((c) => c[0]).join("");
    expect(written).toContain("Something broke");
    stderrSpy.mockRestore();
  });

  it("should handle tool_use events in debug mode", async () => {
    const oldLevel = process.env.CLAW_LOG_LEVEL;
    process.env.CLAW_LOG_LEVEL = "debug";

    const adapter = new CliAdapter();
    const engine = createMockEngine([
      { type: "tool_use", toolCall: { id: "1", name: "test_tool", input: {} } },
      { type: "done" },
    ]);
    await adapter.start(engine);

    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    await adapter.runOnce("test");

    const written = stderrSpy.mock.calls.map((c) => c[0]).join("");
    expect(written).toContain("test_tool");
    stderrSpy.mockRestore();

    process.env.CLAW_LOG_LEVEL = oldLevel;
  });
});
