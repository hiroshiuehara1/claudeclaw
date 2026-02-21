import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircuitBreaker } from "../src/core/backend/circuit-breaker.js";
import { CircuitOpenError } from "../src/utils/errors.js";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
  });

  it("should start in closed state", () => {
    expect(breaker.getState()).toBe("closed");
    expect(breaker.getFailureCount()).toBe(0);
  });

  it("should execute function successfully in closed state", async () => {
    const result = await breaker.execute(async () => 42);
    expect(result).toBe(42);
    expect(breaker.getState()).toBe("closed");
  });

  it("should count failures without opening below threshold", async () => {
    for (let i = 0; i < 2; i++) {
      await expect(breaker.execute(async () => { throw new Error("fail"); })).rejects.toThrow("fail");
    }
    expect(breaker.getState()).toBe("closed");
    expect(breaker.getFailureCount()).toBe(2);
  });

  it("should open circuit after reaching failure threshold", async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(async () => { throw new Error("fail"); })).rejects.toThrow("fail");
    }
    expect(breaker.getState()).toBe("open");
    expect(breaker.getFailureCount()).toBe(3);
  });

  it("should throw CircuitOpenError when circuit is open", async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(async () => { throw new Error("fail"); })).rejects.toThrow();
    }
    await expect(breaker.execute(async () => 1)).rejects.toThrow(CircuitOpenError);
  });

  it("should transition to half-open after reset timeout", async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(async () => { throw new Error("fail"); })).rejects.toThrow();
    }
    expect(breaker.getState()).toBe("open");

    vi.advanceTimersByTime(1001);
    expect(breaker.getState()).toBe("half-open");
    vi.useRealTimers();
  });

  it("should close circuit on success in half-open state", async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(async () => { throw new Error("fail"); })).rejects.toThrow();
    }

    vi.advanceTimersByTime(1001);
    const result = await breaker.execute(async () => "recovered");
    expect(result).toBe("recovered");
    expect(breaker.getState()).toBe("closed");
    expect(breaker.getFailureCount()).toBe(0);
    vi.useRealTimers();
  });

  it("should re-open circuit on failure in half-open state", async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(async () => { throw new Error("fail"); })).rejects.toThrow();
    }

    vi.advanceTimersByTime(1001);
    await expect(breaker.execute(async () => { throw new Error("still failing"); })).rejects.toThrow();
    expect(breaker.getState()).toBe("open");
    vi.useRealTimers();
  });

  it("should reset to closed state", async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(async () => { throw new Error("fail"); })).rejects.toThrow();
    }
    expect(breaker.getState()).toBe("open");

    breaker.reset();
    expect(breaker.getState()).toBe("closed");
    expect(breaker.getFailureCount()).toBe(0);
  });

  it("should use default options when none provided", () => {
    const defaultBreaker = new CircuitBreaker();
    expect(defaultBreaker.getState()).toBe("closed");
  });

  it("should respect custom failure threshold", async () => {
    const custom = new CircuitBreaker({ failureThreshold: 1 });
    await expect(custom.execute(async () => { throw new Error("fail"); })).rejects.toThrow();
    expect(custom.getState()).toBe("open");
  });
});
