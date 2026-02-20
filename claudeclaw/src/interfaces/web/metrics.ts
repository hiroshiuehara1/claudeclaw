import type { FastifyInstance } from "fastify";
import type { MetricsCollector } from "../../utils/metrics.js";

export function registerMetricsRoutes(app: FastifyInstance, metrics: MetricsCollector): void {
  app.get("/api/metrics", async () => {
    return metrics.getSnapshot();
  });
}
