import Fastify from "fastify";
import websocket from "@fastify/websocket";
import type { Engine } from "../../core/engine.js";
import type { InterfaceAdapter } from "../types.js";
import { logger } from "../../utils/logger.js";
import { registerRoutes } from "./routes.js";

export class WebAdapter implements InterfaceAdapter {
  private engine!: Engine;
  private app = Fastify({ logger: false });

  async start(engine: Engine): Promise<void> {
    this.engine = engine;

    await this.app.register(websocket);
    registerRoutes(this.app, engine);

    const { web } = engine.config;
    await this.app.listen({ port: web.port, host: web.host });
    logger.info(`Web server listening on http://${web.host}:${web.port}`);
  }

  async stop(): Promise<void> {
    await this.app.close();
  }
}
