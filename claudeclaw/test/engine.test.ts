import { describe, it, expect, vi } from "vitest";
import { Engine } from "../src/core/engine.js";
import type { Backend, BackendEvent, BackendQueryOptions } from "../src/core/backend/types.js";
import { collectStream } from "../src/utils/stream.js";

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

describe("Engine", () => {
  it("should yield backend events from chat()", async () => {
    const mockEvents: BackendEvent[] = [
      { type: "text", text: "Hello" },
      { type: "text", text: " world" },
      { type: "done" },
    ];

    const engine = new Engine({
      config: {
        defaultBackend: "claude",
        dataDir: "/tmp/claw-test",
        logLevel: "error",
        web: { port: 3100, host: "127.0.0.1" },
        skills: [],
      },
      backend: createMockBackend(mockEvents),
    });

    const events = await collectStream(engine.chat("test", "session-1"));
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: "text", text: "Hello" });
    expect(events[1]).toEqual({ type: "text", text: " world" });
    expect(events[2]).toEqual({ type: "done" });
  });

  it("should accumulate text for full response", async () => {
    const mockEvents: BackendEvent[] = [
      { type: "text", text: "Hello" },
      { type: "text", text: " world" },
      { type: "done" },
    ];

    const engine = new Engine({
      config: {
        defaultBackend: "claude",
        dataDir: "/tmp/claw-test",
        logLevel: "error",
        web: { port: 3100, host: "127.0.0.1" },
        skills: [],
      },
      backend: createMockBackend(mockEvents),
    });

    let fullText = "";
    for await (const event of engine.chat("test", "session-2")) {
      if (event.type === "text" && event.text) fullText += event.text;
    }
    expect(fullText).toBe("Hello world");
  });

  it("should handle error events", async () => {
    const mockEvents: BackendEvent[] = [
      { type: "error", error: "Something went wrong" },
      { type: "done" },
    ];

    const engine = new Engine({
      config: {
        defaultBackend: "claude",
        dataDir: "/tmp/claw-test",
        logLevel: "error",
        web: { port: 3100, host: "127.0.0.1" },
        skills: [],
      },
      backend: createMockBackend(mockEvents),
    });

    const events = await collectStream(engine.chat("test", "session-3"));
    expect(events[0].type).toBe("error");
    expect(events[0].error).toBe("Something went wrong");
  });
});
