import { describe, it, expect } from "vitest";
import { truncateHistory } from "../src/core/conversation/truncation.js";
import type { ConversationMessage } from "../src/core/backend/types.js";

function makeMessages(count: number): ConversationMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
    content: `message-${i}`,
  }));
}

describe("truncateHistory", () => {
  it("should return all messages when under limit", () => {
    const msgs = makeMessages(5);
    const result = truncateHistory(msgs, 10);
    expect(result).toHaveLength(5);
    expect(result).toEqual(msgs);
  });

  it("should return all messages when exactly at limit", () => {
    const msgs = makeMessages(10);
    const result = truncateHistory(msgs, 10);
    expect(result).toHaveLength(10);
  });

  it("should truncate keeping first and last N-1 messages", () => {
    const msgs = makeMessages(20);
    const result = truncateHistory(msgs, 5);
    expect(result).toHaveLength(5);
    expect(result[0].content).toBe("message-0"); // first message preserved
    expect(result[1].content).toBe("message-16"); // last 4 messages
    expect(result[4].content).toBe("message-19");
  });

  it("should handle maxMessages of 1", () => {
    const msgs = makeMessages(10);
    const result = truncateHistory(msgs, 1);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("message-9"); // just the last message
  });

  it("should handle empty messages array", () => {
    const result = truncateHistory([], 10);
    expect(result).toHaveLength(0);
  });

  it("should handle single message", () => {
    const msgs = makeMessages(1);
    const result = truncateHistory(msgs, 5);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("message-0");
  });

  it("should preserve message roles correctly", () => {
    const msgs = makeMessages(10);
    const result = truncateHistory(msgs, 4);
    expect(result[0].role).toBe("user"); // first message
    for (const m of result) {
      expect(["user", "assistant"]).toContain(m.role);
    }
  });

  it("should handle maxMessages of 2", () => {
    const msgs = makeMessages(10);
    const result = truncateHistory(msgs, 2);
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe("message-0");
    expect(result[1].content).toBe("message-9");
  });
});
