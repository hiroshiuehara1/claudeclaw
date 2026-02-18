import { describe, it, expect, vi } from "vitest";
import { retryWithBackoff, isTransientError } from "../src/utils/retry.js";

describe("retryWithBackoff", () => {
  it("should return result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await retryWithBackoff(fn, { maxRetries: 3, baseDelay: 10 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on transient errors and succeed", async () => {
    const error429 = Object.assign(new Error("rate limited"), { status: 429 });
    const fn = vi.fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce("ok");

    const result = await retryWithBackoff(fn, { maxRetries: 3, baseDelay: 10 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should throw on permanent errors without retrying", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("invalid API key"));
    await expect(retryWithBackoff(fn, { maxRetries: 3, baseDelay: 10 })).rejects.toThrow("invalid API key");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should throw after max retries exhausted", async () => {
    const error503 = Object.assign(new Error("service unavailable 503"), { status: 503 });
    const fn = vi.fn().mockRejectedValue(error503);
    await expect(retryWithBackoff(fn, { maxRetries: 2, baseDelay: 10 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("should apply exponential backoff delays", async () => {
    const error503 = Object.assign(new Error("service unavailable 503"), { status: 503 });
    const fn = vi.fn()
      .mockRejectedValueOnce(error503)
      .mockRejectedValueOnce(error503)
      .mockResolvedValueOnce("ok");

    const start = Date.now();
    await retryWithBackoff(fn, { maxRetries: 3, baseDelay: 50 });
    const elapsed = Date.now() - start;
    // First retry: 50ms, second: 100ms => ~150ms total minimum
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});

describe("isTransientError", () => {
  it("should detect 429 status", () => {
    const err = Object.assign(new Error("rate limited"), { status: 429 });
    expect(isTransientError(err)).toBe(true);
  });

  it("should detect 503 status", () => {
    const err = Object.assign(new Error("service unavailable"), { status: 503 });
    expect(isTransientError(err)).toBe(true);
  });

  it("should detect network errors", () => {
    expect(isTransientError(new Error("ECONNRESET"))).toBe(true);
    expect(isTransientError(new Error("socket hang up"))).toBe(true);
  });

  it("should not treat auth errors as transient", () => {
    expect(isTransientError(new Error("invalid API key"))).toBe(false);
  });
});
