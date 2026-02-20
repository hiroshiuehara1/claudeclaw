export interface MetricsSnapshot {
  totalRequests: number;
  totalCharacters: number;
  errorCount: number;
  avgResponseTimeMs: number;
  requestsByBackend: Record<string, number>;
  uptimeMs: number;
}

export class MetricsCollector {
  private totalRequests = 0;
  private totalCharacters = 0;
  private errorCount = 0;
  private totalResponseTimeMs = 0;
  private requestsByBackend: Record<string, number> = {};
  private startTime = Date.now();

  recordRequest(backend: string, durationMs: number, charCount: number, error?: string): void {
    this.totalRequests++;
    this.totalCharacters += charCount;
    this.totalResponseTimeMs += durationMs;

    this.requestsByBackend[backend] = (this.requestsByBackend[backend] || 0) + 1;

    if (error) {
      this.errorCount++;
    }
  }

  getSnapshot(): MetricsSnapshot {
    return {
      totalRequests: this.totalRequests,
      totalCharacters: this.totalCharacters,
      errorCount: this.errorCount,
      avgResponseTimeMs: this.totalRequests > 0
        ? Math.round(this.totalResponseTimeMs / this.totalRequests)
        : 0,
      requestsByBackend: { ...this.requestsByBackend },
      uptimeMs: Date.now() - this.startTime,
    };
  }

  reset(): void {
    this.totalRequests = 0;
    this.totalCharacters = 0;
    this.errorCount = 0;
    this.totalResponseTimeMs = 0;
    this.requestsByBackend = {};
    this.startTime = Date.now();
  }
}
