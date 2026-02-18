import type { FastifyRequest, FastifyReply } from "fastify";

const PUBLIC_PATHS = ["/health", "/ready"];

export function createAuthHook(apiKey: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (PUBLIC_PATHS.includes(request.url)) return;

    const provided = request.headers["x-api-key"];
    if (provided !== apiKey) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  };
}
