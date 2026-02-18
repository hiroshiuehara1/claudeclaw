import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Engine } from "../../core/engine.js";

const ExportQuerySchema = z.object({
  format: z.enum(["json", "markdown"]).default("json"),
});

export function registerExportRoutes(app: FastifyInstance, engine: Engine): void {
  app.get("/api/sessions/:id/export", async (request, reply) => {
    const memory = engine.memory;
    if (!memory) {
      return reply.status(503).send({ error: "Memory not configured" });
    }

    const { id } = request.params as { id: string };
    const session = memory.getSession(id);
    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }

    const messages = memory.getAllMessages(id);
    const parsed = ExportQuerySchema.safeParse(request.query);
    const format = parsed.success ? parsed.data.format : "json";

    if (format === "markdown") {
      const lines: string[] = [
        `# Session ${session.id}`,
        "",
        `**Created:** ${session.created_at}`,
        `**Updated:** ${session.updated_at}`,
        session.model ? `**Model:** ${session.model}` : "",
        "",
        "---",
        "",
      ].filter(Boolean);

      for (const msg of messages) {
        lines.push(`### ${msg.role === "user" ? "User" : "Assistant"}`);
        lines.push("");
        lines.push(msg.content);
        lines.push("");
        lines.push("---");
        lines.push("");
      }

      const markdown = lines.join("\n");
      return reply
        .header("Content-Type", "text/markdown; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="session-${id}.md"`)
        .send(markdown);
    }

    // JSON format (default)
    return reply
      .header("Content-Type", "application/json; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="session-${id}.json"`)
      .send({ session, messages });
  });
}
