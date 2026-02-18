import type { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { Config } from "../../../core/config/schema.js";

export async function registerSecurity(
  app: FastifyInstance,
  config: Config,
): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: config.web.corsOrigins ?? ["http://localhost:3100"],
  });

  await app.register(rateLimit, {
    max: config.web.rateLimitMax ?? 100,
    timeWindow: "1 minute",
  });
}
