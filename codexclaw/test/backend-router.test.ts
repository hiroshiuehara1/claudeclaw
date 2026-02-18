import { describe, expect, it } from "vitest";
import { BackendRouter } from "../src/core/router/backend-router.js";
import { CircuitBreaker } from "../src/core/safety/circuit-breaker.js";

describe("BackendRouter", () => {
  it("returns explicit backend when requested", () => {
    const router = new BackendRouter({
      codex: new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 }),
      claude: new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 })
    });

    expect(router.select("codex")).toEqual(["codex"]);
    expect(router.select("claude")).toEqual(["claude"]);
  });

  it("returns healthy backends for auto mode", () => {
    const codex = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60_000 });
    const claude = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60_000 });
    codex.markFailure(Date.now());

    const router = new BackendRouter({ codex, claude });
    expect(router.select("auto")).toEqual(["claude"]);
  });
});
