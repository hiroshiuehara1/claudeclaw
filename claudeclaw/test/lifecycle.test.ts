import { describe, it, expect, vi } from "vitest";
import { LifecycleManager } from "../src/utils/lifecycle.js";

describe("LifecycleManager", () => {
  it("should register and execute handlers sequentially", async () => {
    const manager = new LifecycleManager();
    const order: string[] = [];

    manager.register("first", async () => {
      await new Promise((r) => setTimeout(r, 10));
      order.push("first");
    });
    manager.register("second", () => {
      order.push("second");
    });

    await manager.runAll();
    expect(order).toEqual(["first", "second"]);
  });

  it("should continue cleanup when a handler fails", async () => {
    const manager = new LifecycleManager();
    const order: string[] = [];

    manager.register("failing", () => {
      throw new Error("boom");
    });
    manager.register("surviving", () => {
      order.push("survived");
    });

    await manager.runAll();
    expect(order).toEqual(["survived"]);
  });

  it("should install signal handlers without throwing", () => {
    const manager = new LifecycleManager();
    expect(() => manager.install()).not.toThrow();
  });
});
