import { McpClient, type McpServerConfig } from "./mcp-client.js";
import type { ToolDefinition } from "../backend/types.js";
import { logger } from "../../utils/logger.js";

export class McpManager {
  private clients: Map<string, McpClient> = new Map();

  async startServer(config: McpServerConfig): Promise<ToolDefinition[]> {
    if (this.clients.has(config.name)) {
      logger.warn(`MCP server ${config.name} already running, stopping first`);
      await this.stopServer(config.name);
    }

    const client = new McpClient(config);
    await client.connect();
    const tools = await client.discoverTools();
    this.clients.set(config.name, client);
    return tools;
  }

  async stopServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.disconnect();
      this.clients.delete(name);
    }
  }

  async stopAll(): Promise<void> {
    const names = Array.from(this.clients.keys());
    await Promise.all(names.map((name) => this.stopServer(name)));
    logger.info("All MCP servers stopped");
  }

  getAllTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    for (const client of this.clients.values()) {
      tools.push(...client.getTools());
    }
    return tools;
  }
}
