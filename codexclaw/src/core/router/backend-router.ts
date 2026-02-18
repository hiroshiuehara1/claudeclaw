import type { BackendMode, BackendName } from "../types.js";
import { CircuitBreaker } from "../safety/circuit-breaker.js";

export class BackendRouter {
  constructor(
    private readonly breakers: Record<BackendName, CircuitBreaker>,
    private readonly preferredOrder: BackendName[] = ["codex", "claude"]
  ) {}

  select(mode: BackendMode): BackendName[] {
    if (mode === "codex" || mode === "claude") {
      return [mode];
    }

    const healthy = this.preferredOrder.filter((backend) => this.breakers[backend].canRequest());
    if (healthy.length > 0) {
      return healthy;
    }
    return [...this.preferredOrder];
  }
}
