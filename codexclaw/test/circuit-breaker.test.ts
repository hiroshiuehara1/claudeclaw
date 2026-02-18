import { describe, expect, it } from "vitest";
import { CircuitBreaker } from "../src/core/safety/circuit-breaker.js";

describe("CircuitBreaker", () => {
  it("opens after threshold failures", () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 });
    expect(breaker.canRequest(0)).toBe(true);
    breaker.markFailure(10);
    expect(breaker.canRequest(20)).toBe(true);
    breaker.markFailure(30);
    expect(breaker.canRequest(31)).toBe(false);
  });

  it("moves to half-open after reset timeout and closes on success", () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 100 });
    breaker.markFailure(0);
    expect(breaker.canRequest(10)).toBe(false);
    expect(breaker.canRequest(101)).toBe(true);
    breaker.markSuccess();
    expect(breaker.canRequest(102)).toBe(true);
    expect(breaker.getSnapshot().state).toBe("closed");
  });
});
