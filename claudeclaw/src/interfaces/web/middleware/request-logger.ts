import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { logger } from "../../../utils/logger.js";

export function registerRequestLogger(app: FastifyInstance): void {
  app.addHook("onRequest", async (request, reply) => {
    const requestId = (request.headers["x-request-id"] as string) || nanoid(16);
    (request as any).requestId = requestId;
    (request as any).startTime = Date.now();
    reply.header("X-Request-Id", requestId);
  });

  app.addHook("onResponse", async (request, reply) => {
    const requestId = (request as any).requestId || "-";
    const startTime = (request as any).startTime as number | undefined;
    const duration = startTime ? Date.now() - startTime : 0;

    logger.info(
      `${request.method} ${request.url} ${reply.statusCode} ${duration}ms [${requestId}]`,
    );
  });
}
