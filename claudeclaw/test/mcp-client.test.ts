import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the MCP SDK before importing
vi.mock("@modelcontextprotocol/sdk/client/index.js", () => {
  const mockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({
      tools: [
        {
          name: "read_file",
          description: "Read a file",
          inputSchema: { type: "object", properties: { path: { type: "string" } } },
        },
        {
          name: "write_file",
          description: "Write a file",
          inputSchema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } },
        },
      ],
    }),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "file contents here" }],
    }),
  };
  return {
    Client: vi.fn(() => mockClient),
    __mockClient: mockClient,
  };
});

vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => ({
  StdioClientTransport: vi.fn(),
}));

import { McpClient } from "../src/core/skill/mcp-client.js";
import { McpManager } from "../src/core/skill/mcp-manager.js";
import { SkillRegistry } from "../src/core/skill/registry.js";
import type { Skill } from "../src/core/skill/types.js";

const testConfig = { name: "test-server", command: "node", args: ["server.js"] };

describe("McpClient", () => {
  it("should connect to MCP server", async () => {
    const client = new McpClient(testConfig);
    await client.connect();
    expect(client.name).toBe("test-server");
  });

  it("should discover and bridge tools", async () => {
    const client = new McpClient(testConfig);
    await client.connect();
    const tools = await client.discoverTools();
    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe("mcp_test-server_read_file");
    expect(tools[1].name).toBe("mcp_test-server_write_file");
    expect(tools[0].description).toBe("Read a file");
  });

  it("should execute bridged tools via callTool", async () => {
    const client = new McpClient(testConfig);
    await client.connect();
    const tools = await client.discoverTools();
    const result = await tools[0].execute({ path: "/test" });
    expect(result).toBe("file contents here");
  });

  it("should return tools via getTools()", async () => {
    const client = new McpClient(testConfig);
    await client.connect();
    await client.discoverTools();
    expect(client.getTools()).toHaveLength(2);
  });

  it("should disconnect and clear tools", async () => {
    const client = new McpClient(testConfig);
    await client.connect();
    await client.discoverTools();
    await client.disconnect();
    expect(client.getTools()).toHaveLength(0);
  });
});

describe("McpManager", () => {
  let manager: McpManager;

  beforeEach(() => {
    manager = new McpManager();
  });

  it("should start a server and return tools", async () => {
    const tools = await manager.startServer(testConfig);
    expect(tools).toHaveLength(2);
    expect(tools[0].name).toContain("mcp_test-server_");
  });

  it("should get all tools from running servers", async () => {
    await manager.startServer(testConfig);
    const tools = manager.getAllTools();
    expect(tools).toHaveLength(2);
  });

  it("should stop a server by name", async () => {
    await manager.startServer(testConfig);
    await manager.stopServer("test-server");
    expect(manager.getAllTools()).toHaveLength(0);
  });

  it("should stop all servers", async () => {
    await manager.startServer(testConfig);
    await manager.stopAll();
    expect(manager.getAllTools()).toHaveLength(0);
  });

  it("should handle stopping non-existent server gracefully", async () => {
    await expect(manager.stopServer("nonexistent")).resolves.not.toThrow();
  });

  it("should restart server if already running", async () => {
    await manager.startServer(testConfig);
    await manager.startServer(testConfig);
    expect(manager.getAllTools()).toHaveLength(2);
  });
});

describe("SkillRegistry MCP integration", () => {
  it("should register skill and start MCP servers", async () => {
    const registry = new SkillRegistry();
    const skill: Skill = {
      manifest: {
        name: "test-skill",
        version: "1.0.0",
        description: "Test skill with MCP",
        permissions: [],
        mcpServers: [testConfig],
      },
      tools: [],
    };

    await registry.register(skill);
    const tools = registry.getAllTools();
    expect(tools.length).toBeGreaterThanOrEqual(2);
    expect(tools.some((t) => t.name.startsWith("mcp_"))).toBe(true);
    await registry.shutdown();
  });

  it("should unregister skill and stop MCP servers", async () => {
    const registry = new SkillRegistry();
    const skill: Skill = {
      manifest: {
        name: "test-skill",
        version: "1.0.0",
        description: "Test",
        permissions: [],
        mcpServers: [testConfig],
      },
      tools: [],
    };

    await registry.register(skill);
    await registry.unregister("test-skill");
    const tools = registry.getAllTools();
    expect(tools.every((t) => !t.name.startsWith("mcp_"))).toBe(true);
    await registry.shutdown();
  });

  it("should register skill without MCP servers", async () => {
    const registry = new SkillRegistry();
    const skill: Skill = {
      manifest: {
        name: "simple-skill",
        version: "1.0.0",
        description: "No MCP",
        permissions: [],
        mcpServers: [],
      },
      tools: [
        { name: "my_tool", description: "test", inputSchema: {}, execute: async () => "ok" },
      ],
    };

    await registry.register(skill);
    expect(registry.getAllTools()).toHaveLength(1);
    await registry.shutdown();
  });

  it("should collect system prompt fragments", async () => {
    const registry = new SkillRegistry();
    const skill: Skill = {
      manifest: {
        name: "prompt-skill",
        version: "1.0.0",
        description: "Has prompt",
        permissions: [],
        systemPromptFragment: "You can use my tools.",
        mcpServers: [],
      },
      tools: [],
    };

    await registry.register(skill);
    const fragments = registry.getSystemPromptFragments();
    expect(fragments).toContain("You can use my tools.");
    await registry.shutdown();
  });
});
