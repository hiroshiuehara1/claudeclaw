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
import { registerSecurity } from "./middleware/security.js";
import { createAuthHook } from "./middleware/auth.js";
import { registerHealthRoutes } from "./health.js";

export class WebAdapter implements InterfaceAdapter {
  private engine!: Engine;
  private app = Fastify({ logger: false });

  async start(engine: Engine): Promise<void> {
    this.engine = engine;

    // Register security plugins before routes
    await registerSecurity(this.app, engine.config);

    // API key auth (if configured)
    if (engine.config.web.apiKey) {
      this.app.addHook("onRequest", createAuthHook(engine.config.web.apiKey));
    }

    await this.app.register(websocket);

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

    registerHealthRoutes(this.app, engine);
    registerRoutes(this.app, engine);

    const { web } = engine.config;
    await this.app.listen({ port: web.port, host: web.host });
    logger.info(`Web server listening on http://${web.host}:${web.port}`);
  }

  async stop(): Promise<void> {
    await this.app.close();
  }
}
