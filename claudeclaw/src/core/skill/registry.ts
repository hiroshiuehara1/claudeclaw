import type { ToolDefinition } from "../backend/types.js";
import type { Skill } from "./types.js";
import { McpManager } from "./mcp-manager.js";
import { logger } from "../../utils/logger.js";

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private mcpManager = new McpManager();
  private mcpTools: ToolDefinition[] = [];

  async register(skill: Skill): Promise<void> {
    this.skills.set(skill.manifest.name, skill);
    logger.info(
      `Registered skill: ${skill.manifest.name} (${skill.tools.length} tools)`,
    );

    // Start any MCP servers declared by this skill
    if (skill.manifest.mcpServers?.length) {
      for (const serverConfig of skill.manifest.mcpServers) {
        try {
          const tools = await this.mcpManager.startServer(serverConfig);
          this.mcpTools.push(...tools);
          logger.info(`Started MCP server ${serverConfig.name} for skill ${skill.manifest.name}`);
        } catch (err) {
          logger.warn(
            `Failed to start MCP server ${serverConfig.name}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }
  }

  async unregister(name: string): Promise<void> {
    const skill = this.skills.get(name);
    if (skill?.manifest.mcpServers?.length) {
      for (const serverConfig of skill.manifest.mcpServers) {
        await this.mcpManager.stopServer(serverConfig.name);
        this.mcpTools = this.mcpTools.filter(
          (t) => !t.name.startsWith(`mcp_${serverConfig.name}_`),
        );
      }
    }
    this.skills.delete(name);
  }

  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  getAllTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    for (const skill of this.skills.values()) {
      tools.push(...skill.tools);
    }
    tools.push(...this.mcpTools);
    return tools;
  }

  getSystemPromptFragments(): string[] {
    const fragments: string[] = [];
    for (const skill of this.skills.values()) {
      if (skill.manifest.systemPromptFragment) {
        fragments.push(skill.manifest.systemPromptFragment);
      }
    }
    return fragments;
  }

  async shutdown(): Promise<void> {
    await this.mcpManager.stopAll();
    this.mcpTools = [];
    logger.info("SkillRegistry shut down");
  }
}
