import type { ToolDefinition } from "../backend/types.js";
import type { Skill } from "./types.js";
import { logger } from "../../utils/logger.js";

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();

  register(skill: Skill): void {
    this.skills.set(skill.manifest.name, skill);
    logger.info(
      `Registered skill: ${skill.manifest.name} (${skill.tools.length} tools)`,
    );
  }

  unregister(name: string): void {
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
}
