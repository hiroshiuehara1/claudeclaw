import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Skill } from "./types.js";
import type { SkillRegistry } from "./registry.js";
import type { SkillSourceSchema } from "../config/schema.js";
import { SkillError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import { z } from "zod";

type SkillSource = z.infer<typeof SkillSourceSchema>;

export async function loadSkill(source: SkillSource): Promise<Skill> {
  switch (source.type) {
    case "bundled":
      return loadBundledSkill(source.path!);
    case "local":
      return loadLocalSkill(source.path!);
    case "npm":
      return loadNpmSkill(source.package!);
    default:
      throw new SkillError(`Unknown skill source type: ${source.type}`);
  }
}

async function loadBundledSkill(name: string): Promise<Skill> {
  const skillDir = resolve(import.meta.dirname || ".", "../../skills", name);
  return loadSkillFromDir(skillDir);
}

async function loadLocalSkill(path: string): Promise<Skill> {
  const skillDir = resolve(path);
  return loadSkillFromDir(skillDir);
}

async function loadNpmSkill(packageName: string): Promise<Skill> {
  try {
    const mod = await import(packageName);
    if (!mod.default?.manifest) {
      throw new SkillError(`npm skill ${packageName} must export a default Skill object`);
    }
    return mod.default as Skill;
  } catch (err) {
    throw new SkillError(`Failed to load npm skill ${packageName}`, err);
  }
}

async function loadSkillFromDir(dir: string): Promise<Skill> {
  const indexPath = join(dir, "index.js");
  if (!existsSync(indexPath)) {
    throw new SkillError(`Skill index not found: ${indexPath}`);
  }

  try {
    const mod = await import(pathToFileURL(indexPath).href);
    if (!mod.default?.manifest) {
      throw new SkillError(`Skill at ${dir} must export a default Skill object`);
    }
    logger.debug(`Loaded skill: ${mod.default.manifest.name}`);
    return mod.default as Skill;
  } catch (err) {
    throw new SkillError(`Failed to load skill from ${dir}`, err);
  }
}

export async function loadAllSkills(sources: SkillSource[], registry?: SkillRegistry): Promise<Skill[]> {
  const skills: Skill[] = [];
  for (const source of sources) {
    if (!source.enabled) continue;
    try {
      const skill = await loadSkill(source);
      skills.push(skill);
      if (registry) {
        await registry.register(skill);
      }
    } catch (err) {
      logger.warn(`Skipping skill: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return skills;
}
