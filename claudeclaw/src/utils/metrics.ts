export interface MetricsSnapshot {
  totalRequests: number;
  totalCharacters: number;
  errorCount: number;
  avgResponseTimeMs: number;
  requestsByBackend: Record<string, number>;
  requestsByModel: Record<string, number>;
  tokenEstimate: number;
  errorsByType: Record<string, number>;
  p95ResponseTimeMs: number;
  uptimeMs: number;
}

const DURATION_BUFFER_SIZE = 1000;

export class MetricsCollector {
  private totalRequests = 0;
  private totalCharacters = 0;
  private errorCount = 0;
  private totalResponseTimeMs = 0;
  private requestsByBackend: Record<string, number> = {};
  private requestsByModel: Record<string, number> = {};
  private errorsByType: Record<string, number> = {};
  private durations: number[] = [];
  private durationIndex = 0;
  private durationCount = 0;
  private startTime = Date.now();

  recordRequest(backend: string, model: string, durationMs: number, charCount: number, error?: string): void {
    this.totalRequests++;
    this.totalCharacters += charCount;
    this.totalResponseTimeMs += durationMs;

    this.requestsByBackend[backend] = (this.requestsByBackend[backend] || 0) + 1;
    this.requestsByModel[model] = (this.requestsByModel[model] || 0) + 1;

    // Circular buffer for latency percentiles
    if (this.durations.length < DURATION_BUFFER_SIZE) {
      this.durations.push(durationMs);
    } else {
      this.durations[this.durationIndex] = durationMs;
    }
    this.durationIndex = (this.durationIndex + 1) % DURATION_BUFFER_SIZE;
    this.durationCount++;

    if (error) {
      this.errorCount++;
      this.errorsByType[error] = (this.errorsByType[error] || 0) + 1;
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
      requestsByModel: { ...this.requestsByModel },
      tokenEstimate: Math.round(this.totalCharacters / 4),
      errorsByType: { ...this.errorsByType },
      p95ResponseTimeMs: this.calculateP95(),
      uptimeMs: Date.now() - this.startTime,
    };
  }

  reset(): void {
    this.totalRequests = 0;
    this.totalCharacters = 0;
    this.errorCount = 0;
    this.totalResponseTimeMs = 0;
    this.requestsByBackend = {};
    this.requestsByModel = {};
    this.errorsByType = {};
    this.durations = [];
    this.durationIndex = 0;
    this.durationCount = 0;
    this.startTime = Date.now();
  }

  private calculateP95(): number {
    const count = Math.min(this.durationCount, DURATION_BUFFER_SIZE);
    if (count === 0) return 0;
    const sorted = this.durations.slice(0, count).sort((a, b) => a - b);
    const idx = Math.ceil(count * 0.95) - 1;
    return sorted[idx];
  }
}
