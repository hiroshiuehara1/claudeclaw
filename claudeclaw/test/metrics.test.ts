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
  });

  it("should record a successful request", () => {
    metrics.recordRequest("claude", 150, 500);
    const snap = metrics.getSnapshot();
    expect(snap.totalRequests).toBe(1);
    expect(snap.totalCharacters).toBe(500);
    expect(snap.errorCount).toBe(0);
    expect(snap.avgResponseTimeMs).toBe(150);
    expect(snap.requestsByBackend.claude).toBe(1);
  });

  it("should record errors", () => {
    metrics.recordRequest("openai", 200, 0, "rate limited");
    const snap = metrics.getSnapshot();
    expect(snap.totalRequests).toBe(1);
    expect(snap.errorCount).toBe(1);
  });

  it("should track multiple backends", () => {
    metrics.recordRequest("claude", 100, 300);
    metrics.recordRequest("openai", 200, 500);
    metrics.recordRequest("claude", 150, 400);

    const snap = metrics.getSnapshot();
    expect(snap.totalRequests).toBe(3);
    expect(snap.requestsByBackend.claude).toBe(2);
    expect(snap.requestsByBackend.openai).toBe(1);
  });

  it("should calculate average response time", () => {
    metrics.recordRequest("claude", 100, 100);
    metrics.recordRequest("claude", 300, 200);
    const snap = metrics.getSnapshot();
    expect(snap.avgResponseTimeMs).toBe(200);
  });

  it("should accumulate characters", () => {
    metrics.recordRequest("claude", 50, 100);
    metrics.recordRequest("claude", 50, 200);
    metrics.recordRequest("claude", 50, 300);
    const snap = metrics.getSnapshot();
    expect(snap.totalCharacters).toBe(600);
  });

  it("should track uptime", () => {
    const snap = metrics.getSnapshot();
    expect(snap.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(snap.uptimeMs).toBeLessThan(5000);
  });

  it("should reset all counters", () => {
    metrics.recordRequest("claude", 100, 500);
    metrics.recordRequest("openai", 200, 300, "error");
    metrics.reset();

    const snap = metrics.getSnapshot();
    expect(snap.totalRequests).toBe(0);
    expect(snap.totalCharacters).toBe(0);
    expect(snap.errorCount).toBe(0);
    expect(snap.avgResponseTimeMs).toBe(0);
    expect(Object.keys(snap.requestsByBackend)).toHaveLength(0);
  });
});
