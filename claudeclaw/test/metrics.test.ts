import { describe, it, expect, beforeEach } from "vitest";
import { MetricsCollector } from "../src/utils/metrics.js";

describe("MetricsCollector", () => {
  let metrics: MetricsCollector;

  beforeEach(() => {
    metrics = new MetricsCollector();
  });

  it("should start with zero counters", () => {
    const snap = metrics.getSnapshot();
    expect(snap.totalRequests).toBe(0);
    expect(snap.totalCharacters).toBe(0);
    expect(snap.errorCount).toBe(0);
    expect(snap.avgResponseTimeMs).toBe(0);
    expect(Object.keys(snap.requestsByBackend)).toHaveLength(0);
    expect(Object.keys(snap.requestsByModel)).toHaveLength(0);
    expect(snap.tokenEstimate).toBe(0);
    expect(snap.p95ResponseTimeMs).toBe(0);
    expect(Object.keys(snap.errorsByType)).toHaveLength(0);
  });

  it("should record a successful request", () => {
    metrics.recordRequest("claude", "sonnet", 150, 500);
    const snap = metrics.getSnapshot();
    expect(snap.totalRequests).toBe(1);
    expect(snap.totalCharacters).toBe(500);
    expect(snap.errorCount).toBe(0);
    expect(snap.avgResponseTimeMs).toBe(150);
    expect(snap.requestsByBackend.claude).toBe(1);
  });

  it("should record errors", () => {
    metrics.recordRequest("openai", "gpt-4", 200, 0, "rate limited");
    const snap = metrics.getSnapshot();
    expect(snap.totalRequests).toBe(1);
    expect(snap.errorCount).toBe(1);
  });

  it("should track multiple backends", () => {
    metrics.recordRequest("claude", "sonnet", 100, 300);
    metrics.recordRequest("openai", "gpt-4", 200, 500);
    metrics.recordRequest("claude", "haiku", 150, 400);

    const snap = metrics.getSnapshot();
    expect(snap.totalRequests).toBe(3);
    expect(snap.requestsByBackend.claude).toBe(2);
    expect(snap.requestsByBackend.openai).toBe(1);
  });

  it("should calculate average response time", () => {
    metrics.recordRequest("claude", "sonnet", 100, 100);
    metrics.recordRequest("claude", "sonnet", 300, 200);
    const snap = metrics.getSnapshot();
    expect(snap.avgResponseTimeMs).toBe(200);
  });

  it("should accumulate characters", () => {
    metrics.recordRequest("claude", "sonnet", 50, 100);
    metrics.recordRequest("claude", "sonnet", 50, 200);
    metrics.recordRequest("claude", "sonnet", 50, 300);
    const snap = metrics.getSnapshot();
    expect(snap.totalCharacters).toBe(600);
  });

  it("should track uptime", () => {
    const snap = metrics.getSnapshot();
    expect(snap.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(snap.uptimeMs).toBeLessThan(5000);
  });

  it("should reset all counters", () => {
    metrics.recordRequest("claude", "sonnet", 100, 500);
    metrics.recordRequest("openai", "gpt-4", 200, 300, "error");
    metrics.reset();

    const snap = metrics.getSnapshot();
    expect(snap.totalRequests).toBe(0);
    expect(snap.totalCharacters).toBe(0);
    expect(snap.errorCount).toBe(0);
    expect(snap.avgResponseTimeMs).toBe(0);
    expect(Object.keys(snap.requestsByBackend)).toHaveLength(0);
    expect(Object.keys(snap.requestsByModel)).toHaveLength(0);
    expect(snap.tokenEstimate).toBe(0);
    expect(snap.p95ResponseTimeMs).toBe(0);
  });

  // --- New Phase 9 tests ---

  it("should estimate tokens from character count", () => {
    metrics.recordRequest("claude", "sonnet", 100, 400);
    const snap = metrics.getSnapshot();
    expect(snap.tokenEstimate).toBe(100); // 400 / 4
  });

  it("should track errors by type", () => {
    metrics.recordRequest("claude", "sonnet", 100, 0, "rate limited");
    metrics.recordRequest("claude", "sonnet", 100, 0, "rate limited");
    metrics.recordRequest("openai", "gpt-4", 100, 0, "timeout");

    const snap = metrics.getSnapshot();
    expect(snap.errorsByType["rate limited"]).toBe(2);
    expect(snap.errorsByType["timeout"]).toBe(1);
  });

  it("should calculate p95 response time", () => {
    // Add 10 requests with increasing durations
    for (let i = 1; i <= 10; i++) {
      metrics.recordRequest("claude", "sonnet", i * 100, 50);
    }
    // p95 index = ceil(10 * 0.95) - 1 = 9 → sorted[9] = 1000
    const snap = metrics.getSnapshot();
    expect(snap.p95ResponseTimeMs).toBe(1000);
  });

  it("should track requests by model", () => {
    metrics.recordRequest("claude", "sonnet", 100, 100);
    metrics.recordRequest("claude", "haiku", 100, 100);
    metrics.recordRequest("claude", "sonnet", 100, 100);

    const snap = metrics.getSnapshot();
    expect(snap.requestsByModel.sonnet).toBe(2);
    expect(snap.requestsByModel.haiku).toBe(1);
  });

  it("should handle p95 with single request", () => {
    metrics.recordRequest("claude", "sonnet", 250, 100);
    const snap = metrics.getSnapshot();
    expect(snap.p95ResponseTimeMs).toBe(250);
  });
});
