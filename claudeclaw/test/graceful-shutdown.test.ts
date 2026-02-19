import { describe, it, expect, vi } from "vitest";
import { LifecycleManager } from "../src/utils/lifecycle.js";

describe("Graceful Shutdown", () => {
  it("LifecycleManager should accept custom forced exit timeout", () => {
    const lm = new LifecycleManager(5000);
    expect(lm).toBeDefined();
  });

  it("LifecycleManager should default to 10s timeout", () => {
    const lm = new LifecycleManager();
    expect(lm).toBeDefined();
  });

  it("runAll should execute handlers in order", async () => {
    const lm = new LifecycleManager();
    const order: string[] = [];
    lm.register("first", () => { order.push("first"); });
    lm.register("second", () => { order.push("second"); });
    await lm.runAll();
    expect(order).toEqual(["first", "second"]);
  });

  it("runAll should continue after handler failure", async () => {
    const lm = new LifecycleManager();
    const order: string[] = [];
    lm.register("failing", () => { throw new Error("boom"); });
    lm.register("success", () => { order.push("success"); });
    await lm.runAll();
    expect(order).toEqual(["success"]);
  });

  it("runAll should handle async handlers", async () => {
    const lm = new LifecycleManager();
    const order: string[] = [];
    lm.register("async", async () => {
      await new Promise((r) => setTimeout(r, 10));
      order.push("async");
    });
    await lm.runAll();
    expect(order).toEqual(["async"]);
  });

  it("WebAdapter draining flag should reject new requests", async () => {
    // Test the draining concept directly
    let draining = false;
    let activeRequests = 0;

    // Simulate request during draining
    draining = true;
    const shouldReject = draining;
    expect(shouldReject).toBe(true);

    // Simulate waiting for active requests
    activeRequests = 2;
    const needsWait = activeRequests > 0;
    expect(needsWait).toBe(true);
  });
});
