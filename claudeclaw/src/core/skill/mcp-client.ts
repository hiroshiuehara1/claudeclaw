import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ToolDefinition } from "../backend/types.js";
import { logger } from "../../utils/logger.js";

export interface McpServerConfig {
  name: string;
  command: string;
  args: string[];
}

export class McpClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private tools: ToolDefinition[] = [];
  readonly name: string;

  constructor(private config: McpServerConfig) {
    this.name = config.name;
    this.client = new Client({ name: `claudeclaw-${config.name}`, version: "1.0.0" });
  }

  async connect(): Promise<void> {
    this.transport = new StdioClientTransport({
      command: this.config.command,
      args: this.config.args,
    });
    await this.client.connect(this.transport);
    logger.info(`MCP client connected to ${this.name}`);
  }

  async discoverTools(): Promise<ToolDefinition[]> {
    const result = await this.client.listTools();
    this.tools = result.tools.map((tool) => ({
      name: `mcp_${this.name}_${tool.name}`,
      description: tool.description || "",
      inputSchema: (tool.inputSchema as Record<string, unknown>) || {},
      execute: async (input: unknown) => {
        const callResult = await this.client.callTool({
          name: tool.name,
          arguments: input as Record<string, unknown>,
        });
        const content = callResult.content as Array<{ type: string; text?: string }>;
        const textParts = content
          .filter((c) => c.type === "text" && c.text)
          .map((c) => c.text as string);
        return textParts.join("\n") || JSON.stringify(content);
      },
    }));
    logger.info(`Discovered ${this.tools.length} tools from MCP server ${this.name}`);
    return this.tools;
  }

  getTools(): ToolDefinition[] {
    return this.tools;
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    this.tools = [];
    logger.info(`MCP client disconnected from ${this.name}`);
  }
}
