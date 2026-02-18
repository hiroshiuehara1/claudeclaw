import { describe, it, expect, vi } from "vitest";
import { ChatPlatformAdapter } from "../src/interfaces/chat/base-adapter.js";
import type { Engine } from "../src/core/engine.js";
import type { BackendEvent, BackendQueryOptions } from "../src/core/backend/types.js";

class TestAdapter extends ChatPlatformAdapter {
  public replies: Array<{ channelId: string; text: string }> = [];
  public connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async stop(): Promise<void> {
    this.connected = false;
  }

  async sendReply(channelId: string, text: string): Promise<void> {
    this.replies.push({ channelId, text });
  }

  // Expose handleIncoming for testing
  async testIncoming(text: string, sessionId: string, replyTarget: string): Promise<void> {
    await this.handleIncoming({ text, sessionId }, replyTarget);
  }
}

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

function createErrorEngine(): Engine {
  return {
    config: {
      defaultBackend: "claude",
      dataDir: "/tmp",
      logLevel: "error",
      web: { port: 3100, host: "127.0.0.1", corsOrigins: [], rateLimitMax: 100 },
      engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
      skills: [],
    },
    async *chat(): AsyncGenerator<BackendEvent> {
      throw new Error("backend crashed");
    },
  } as unknown as Engine;
}

function createTimeoutEngine(): Engine {
  return {
    config: {
      defaultBackend: "claude",
      dataDir: "/tmp",
      logLevel: "error",
      web: { port: 3100, host: "127.0.0.1", corsOrigins: [], rateLimitMax: 100 },
      engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
      skills: [],
    },
    async *chat(): AsyncGenerator<BackendEvent> {
      throw new Error("Request timed out");
    },
  } as unknown as Engine;
}

describe("ChatPlatformAdapter", () => {
  it("should start and set engine", async () => {
    const adapter = new TestAdapter();
    const engine = createMockEngine([{ type: "done" }]);
    await adapter.start(engine);
    expect(adapter.connected).toBe(true);
  });

  it("should handle incoming message and send reply", async () => {
    const adapter = new TestAdapter();
    const engine = createMockEngine([
      { type: "text", text: "Hello " },
      { type: "text", text: "world" },
      { type: "done" },
    ]);
    await adapter.start(engine);
    await adapter.testIncoming("hi", "session-1", "channel-1");

    expect(adapter.replies).toHaveLength(1);
    expect(adapter.replies[0].channelId).toBe("channel-1");
    expect(adapter.replies[0].text).toBe("Hello world");
  });

  it("should send user-friendly error on crash", async () => {
    const adapter = new TestAdapter();
    const engine = createErrorEngine();
    await adapter.start(engine);
    await adapter.testIncoming("hi", "s1", "ch1");

    expect(adapter.replies).toHaveLength(1);
    expect(adapter.replies[0].text).toContain("Sorry, something went wrong");
  });

  it("should send timeout-specific message on timeout", async () => {
    const adapter = new TestAdapter();
    const engine = createTimeoutEngine();
    await adapter.start(engine);
    await adapter.testIncoming("hi", "s1", "ch1");

    expect(adapter.replies).toHaveLength(1);
    expect(adapter.replies[0].text).toContain("timed out");
  });

  it("should handle sendReply failure gracefully", async () => {
    const adapter = new TestAdapter();
    const engine = createErrorEngine();
    await adapter.start(engine);

    // Override sendReply to throw
    adapter.sendReply = vi.fn().mockRejectedValue(new Error("network error"));

    // Should not throw even when reply fails
    await expect(adapter.testIncoming("hi", "s1", "ch1")).resolves.toBeUndefined();
  });

  it("should not send reply if no text accumulated", async () => {
    const adapter = new TestAdapter();
    const engine = createMockEngine([{ type: "done" }]);
    await adapter.start(engine);
    await adapter.testIncoming("hi", "s1", "ch1");

    expect(adapter.replies).toHaveLength(0);
  });

  it("should stop adapter", async () => {
    const adapter = new TestAdapter();
    const engine = createMockEngine([]);
    await adapter.start(engine);
    expect(adapter.connected).toBe(true);
    await adapter.stop();
    expect(adapter.connected).toBe(false);
  });
});
