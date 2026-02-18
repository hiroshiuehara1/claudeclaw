export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private openedAt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  canRequest(nowMs = Date.now()): boolean {
    if (this.state === "closed") {
      return true;
    }

    if (this.state === "open") {
      const elapsed = nowMs - this.openedAt;
      if (elapsed >= this.options.resetTimeoutMs) {
        this.state = "half_open";
        return true;
      }
      return false;
    }

    return true;
  }

  markSuccess(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.openedAt = 0;
  }

  markFailure(nowMs = Date.now()): void {
    if (this.state === "half_open") {
      this.state = "open";
      this.openedAt = nowMs;
      this.failureCount = this.options.failureThreshold;
      return;
    }

    this.failureCount += 1;
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = "open";
      this.openedAt = nowMs;
    }
  }

  getSnapshot(): { state: CircuitState; failureCount: number; openedAt: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      openedAt: this.openedAt
    };
  }
}
