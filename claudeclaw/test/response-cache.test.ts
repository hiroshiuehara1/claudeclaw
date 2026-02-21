import { describe, it, expect, beforeEach, vi } from "vitest";
import { ResponseCache } from "../src/core/cache/response-cache.js";
import type { BackendEvent } from "../src/core/backend/types.js";

describe("ResponseCache", () => {
  let cache: ResponseCache;

  const textEvent: BackendEvent = { type: "text", text: "Hello" };
  const doneEvent: BackendEvent = { type: "done" };

  beforeEach(() => {
    cache = new ResponseCache({ maxEntries: 3, ttlMs: 5000 });
  });

  it("should start empty", () => {
    expect(cache.size).toBe(0);
  });

  it("should store and retrieve events", () => {
    const key = ResponseCache.buildKey("claude", "sonnet", "hello");
    cache.set(key, [textEvent, doneEvent]);
    const result = cache.get(key);
    expect(result).toEqual([textEvent, doneEvent]);
    expect(cache.size).toBe(1);
  });

  it("should return null for missing keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("should generate deterministic keys", () => {
    const k1 = ResponseCache.buildKey("claude", "sonnet", "hello");
    const k2 = ResponseCache.buildKey("claude", "sonnet", "hello");
    expect(k1).toBe(k2);
  });

  it("should generate different keys for different inputs", () => {
    const k1 = ResponseCache.buildKey("claude", "sonnet", "hello");
    const k2 = ResponseCache.buildKey("openai", "gpt-4", "hello");
    expect(k1).not.toBe(k2);
  });

  it("should evict oldest entry when at capacity", () => {
    const k1 = ResponseCache.buildKey("a", "m", "p1");
    const k2 = ResponseCache.buildKey("a", "m", "p2");
    const k3 = ResponseCache.buildKey("a", "m", "p3");
    const k4 = ResponseCache.buildKey("a", "m", "p4");

    cache.set(k1, [textEvent]);
    cache.set(k2, [textEvent]);
    cache.set(k3, [textEvent]);
    expect(cache.size).toBe(3);

    cache.set(k4, [textEvent]);
    expect(cache.size).toBe(3);
    expect(cache.get(k1)).toBeNull(); // evicted
    expect(cache.get(k4)).not.toBeNull();
  });

  it("should expire entries after TTL", () => {
    vi.useFakeTimers();
    const key = ResponseCache.buildKey("claude", "sonnet", "hello");
    cache.set(key, [textEvent]);
    expect(cache.get(key)).not.toBeNull();

    vi.advanceTimersByTime(5001);
    expect(cache.get(key)).toBeNull();
    vi.useRealTimers();
  });

  it("should clear all entries", () => {
    cache.set(ResponseCache.buildKey("a", "m", "p1"), [textEvent]);
    cache.set(ResponseCache.buildKey("a", "m", "p2"), [textEvent]);
    expect(cache.size).toBe(2);

    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("should update existing entry position on set", () => {
    const k1 = ResponseCache.buildKey("a", "m", "p1");
    const k2 = ResponseCache.buildKey("a", "m", "p2");
    const k3 = ResponseCache.buildKey("a", "m", "p3");

    cache.set(k1, [textEvent]);
    cache.set(k2, [textEvent]);
    cache.set(k3, [textEvent]);

    // Update k1 — moves to end
    cache.set(k1, [doneEvent]);

    // Adding k4 should evict k2 (now oldest), not k1
    const k4 = ResponseCache.buildKey("a", "m", "p4");
    cache.set(k4, [textEvent]);
    expect(cache.get(k2)).toBeNull();
    expect(cache.get(k1)).toEqual([doneEvent]);
  });

  it("should refresh LRU position on get", () => {
    const k1 = ResponseCache.buildKey("a", "m", "p1");
    const k2 = ResponseCache.buildKey("a", "m", "p2");
    const k3 = ResponseCache.buildKey("a", "m", "p3");

    cache.set(k1, [textEvent]);
    cache.set(k2, [textEvent]);
    cache.set(k3, [textEvent]);

    // Access k1 — moves to end
    cache.get(k1);

    // Adding k4 should evict k2 (now oldest)
    const k4 = ResponseCache.buildKey("a", "m", "p4");
    cache.set(k4, [textEvent]);
    expect(cache.get(k2)).toBeNull();
    expect(cache.get(k1)).not.toBeNull();
  });

  it("should use default options", () => {
    const defaultCache = new ResponseCache();
    expect(defaultCache.size).toBe(0);
  });
});
