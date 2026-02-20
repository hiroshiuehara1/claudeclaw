import { describe, it, expect } from "vitest";
import { getActiveStreams } from "../src/interfaces/web/routes.js";

describe("Streaming Cancellation", () => {
  it("should export getActiveStreams function", () => {
    expect(typeof getActiveStreams).toBe("function");
  });

  it("getActiveStreams should return a Map", () => {
    const streams = getActiveStreams();
    expect(streams).toBeInstanceOf(Map);
  });

  it("should be able to add and retrieve abort controllers", () => {
    const streams = getActiveStreams();
    const controller = new AbortController();
    streams.set("test-session", controller);
    expect(streams.get("test-session")).toBe(controller);
    streams.delete("test-session");
  });

  it("should be able to abort a controller", () => {
    const streams = getActiveStreams();
    const controller = new AbortController();
    streams.set("test-abort", controller);

    expect(controller.signal.aborted).toBe(false);
    controller.abort();
    expect(controller.signal.aborted).toBe(true);

    streams.delete("test-abort");
  });

  it("should handle deleting non-existent sessions", () => {
    const streams = getActiveStreams();
    expect(streams.delete("nonexistent")).toBe(false);
  });

  it("should support multiple concurrent sessions", () => {
    const streams = getActiveStreams();
    const c1 = new AbortController();
    const c2 = new AbortController();

    streams.set("session-a", c1);
    streams.set("session-b", c2);

    expect(streams.size).toBeGreaterThanOrEqual(2);

    c1.abort();
    expect(c1.signal.aborted).toBe(true);
    expect(c2.signal.aborted).toBe(false);

    streams.delete("session-a");
    streams.delete("session-b");
  });
});
