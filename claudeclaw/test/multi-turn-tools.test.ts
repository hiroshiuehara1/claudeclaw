import { describe, it, expect, vi } from "vitest";
import { Engine } from "../src/core/engine.js";
import type { Backend, BackendEvent, BackendQueryOptions, ToolDefinition } from "../src/core/backend/types.js";
import { collectStream } from "../src/utils/stream.js";
import { ConfigSchema } from "../src/core/config/schema.js";

// Helper: creates a mock backend that simulates multi-turn tool use
function createMultiTurnBackend(rounds: BackendEvent[][]): Backend {
  let callCount = 0;
  return {
    name: "mock-multi-turn",
    async *query(_prompt: string, _options: BackendQueryOptions) {
      const events = rounds[callCount] || [{ type: "done" as const }];
      callCount++;
      for (const event of events) {
        yield event;
      }
    },
    async interrupt() {},
  };
}

describe("Multi-Turn Tool Loop", () => {
  describe("Config schema", () => {
    it("should have maxToolRounds default of 10", () => {
      const config = ConfigSchema.parse({});
      expect(config.engine.maxToolRounds).toBe(10);
    });

    it("should accept maxToolRounds between 1 and 25", () => {
      const config = ConfigSchema.parse({ engine: { maxToolRounds: 5 } });
      expect(config.engine.maxToolRounds).toBe(5);
    });

    it("should reject maxToolRounds below 1", () => {
      expect(() => ConfigSchema.parse({ engine: { maxToolRounds: 0 } })).toThrow();
    });

    it("should reject maxToolRounds above 25", () => {
      expect(() => ConfigSchema.parse({ engine: { maxToolRounds: 26 } })).toThrow();
    });

    it("should have maxHistoryMessages default of 50", () => {
      const config = ConfigSchema.parse({});
      expect(config.engine.maxHistoryMessages).toBe(50);
    });

    it("should accept maxHistoryMessages between 5 and 500", () => {
      const config = ConfigSchema.parse({ engine: { maxHistoryMessages: 100 } });
      expect(config.engine.maxHistoryMessages).toBe(100);
    });
  });

  describe("Engine passes maxToolRounds to backend", () => {
    it("should include maxToolRounds in query options", async () => {
      let capturedOptions: BackendQueryOptions | null = null;

      const backend: Backend = {
        name: "mock",
        async *query(_prompt, options) {
          capturedOptions = options;
          yield { type: "text", text: "hi" };
          yield { type: "done" };
        },
        async interrupt() {},
      };

      const engine = new Engine({
        config: {
          defaultBackend: "claude",
          dataDir: "/tmp/claw-test-mt",
          logLevel: "error",
          web: { port: 3100, host: "127.0.0.1" },
          skills: [],
          engine: { maxToolRounds: 7 },
        } as any,
        backend,
      });

      await collectStream(engine.chat("test", "s1"));
      expect(capturedOptions?.maxToolRounds).toBe(7);
    });
  });

  describe("BackendQueryOptions maxToolRounds", () => {
    it("should be optional and default to undefined when not set", () => {
      const opts: BackendQueryOptions = {};
      expect(opts.maxToolRounds).toBeUndefined();
    });
  });

  describe("Tool round behavior", () => {
    it("should support tools yielding tool_use and tool_result events", async () => {
      const events: BackendEvent[] = [
        { type: "tool_use", toolCall: { id: "t1", name: "calc", input: { x: 1 } } },
        { type: "tool_result", toolResult: { id: "t1", output: "42" } },
        { type: "text", text: "Answer is 42" },
        { type: "done" },
      ];

      const backend: Backend = {
        name: "mock",
        async *query() {
          for (const e of events) yield e;
        },
        async interrupt() {},
      };

      const engine = new Engine({
        config: {
          defaultBackend: "claude",
          dataDir: "/tmp/claw-test-mt2",
          logLevel: "error",
          web: { port: 3100, host: "127.0.0.1" },
          skills: [],
        } as any,
        backend,
      });

      const result = await collectStream(engine.chat("test", "s2"));
      const types = result.map((e) => e.type);
      expect(types).toContain("tool_use");
      expect(types).toContain("tool_result");
      expect(types).toContain("text");
      expect(types).toContain("done");
    });
  });
});
