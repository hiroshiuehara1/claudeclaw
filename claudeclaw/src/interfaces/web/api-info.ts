import type { FastifyInstance } from "fastify";
import type { Engine } from "../../core/engine.js";
import { redactConfig } from "../../core/config/config-writer.js";

export function registerApiInfoRoutes(app: FastifyInstance, engine: Engine): void {
  app.get("/api/tools", async () => {
    const tools = engine.getAvailableTools();
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  });

  app.get("/api/models", async () => {
    return engine.getAvailableModels();
  });

  app.get("/api/config", async () => {
    return redactConfig(engine.config);
  });

  app.get("/api/skills", async () => {
    const skills = engine.getRegisteredSkills();
    return skills.map((s) => ({
      name: s.manifest.name,
      version: s.manifest.version,
      description: s.manifest.description,
      permissions: s.manifest.permissions,
      tools: s.tools.length,
    }));
  });
}
