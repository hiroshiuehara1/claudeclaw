import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import type { Engine } from "../../core/engine.js";
import type { InterfaceAdapter } from "../types.js";
import { logger } from "../../utils/logger.js";
import { registerRoutes } from "./routes.js";
import { registerSseRoutes } from "./sse.js";
import { registerSessionRoutes } from "./sessions.js";
import { registerExportRoutes } from "./export.js";
import { registerSecurity } from "./middleware/security.js";
import { createAuthHook } from "./middleware/auth.js";
import { registerHealthRoutes } from "./health.js";
import { registerApiInfoRoutes } from "./api-info.js";
import { registerRequestLogger } from "./middleware/request-logger.js";

export class WebAdapter implements InterfaceAdapter {
  private engine!: Engine;
  private app = Fastify({ logger: false });
  private draining = false;
  private activeRequests = 0;

  async start(engine: Engine): Promise<void> {
    this.engine = engine;

    // Register security plugins before routes
    await registerSecurity(this.app, engine.config);

    // API key auth (if configured)
    if (engine.config.web.apiKey) {
      this.app.addHook("onRequest", createAuthHook(engine.config.web.apiKey));
    }

    await this.app.register(websocket);

    // Track in-flight requests for graceful draining
    this.app.addHook("onRequest", async (_request, reply) => {
      if (this.draining) {
        return reply.status(503).send({ error: "Server is shutting down" });
      }
      this.activeRequests++;
    });

    this.app.addHook("onResponse", async () => {
      this.activeRequests--;
    });

    // Serve static web UI files
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const webDirs = [
      join(currentDir, "../../web"),
      join(currentDir, "../../../web"),
      join(process.cwd(), "web"),
    ];
    const webRoot = webDirs.find((d) => existsSync(d));
    if (webRoot) {
      await this.app.register(fastifyStatic, {
        root: webRoot,
        prefix: "/",
        decorateReply: false,
      });
      logger.debug(`Serving web UI from ${webRoot}`);
    }

    registerRequestLogger(this.app);
    registerHealthRoutes(this.app, engine);
    registerRoutes(this.app, engine);
    registerSseRoutes(this.app, engine);
    registerSessionRoutes(this.app, engine);
    registerExportRoutes(this.app, engine);
    registerApiInfoRoutes(this.app, engine);

    const { web } = engine.config;
    await this.app.listen({ port: web.port, host: web.host });
    logger.info(`Web server listening on http://${web.host}:${web.port}`);
  }

  async stop(): Promise<void> {
    this.draining = true;
    const drainTimeout = this.engine?.config.web.drainTimeout ?? 5000;

    if (this.activeRequests > 0 && drainTimeout > 0) {
      logger.info(`Draining ${this.activeRequests} active request(s)...`);
      await this.waitForDrain(drainTimeout);
    }

    await this.app.close();
    logger.info("Web server stopped");
  }

  private waitForDrain(timeout: number): Promise<void> {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeout;
      const check = () => {
        if (this.activeRequests <= 0 || Date.now() >= deadline) {
          resolve();
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });
  }
}
