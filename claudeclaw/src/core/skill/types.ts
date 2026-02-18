import { z } from "zod";
import type { ToolDefinition } from "../backend/types.js";

export const PermissionSchema = z.enum([
  "fs:read",
  "fs:write",
  "shell",
  "network",
  "browser",
]);
export type Permission = z.infer<typeof PermissionSchema>;

export const SkillManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  permissions: z.array(PermissionSchema).default([]),
  systemPromptFragment: z.string().optional(),
  mcpServers: z
    .array(
      z.object({
        name: z.string(),
        command: z.string(),
        args: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});

export type SkillManifest = z.infer<typeof SkillManifestSchema>;

export interface Skill {
  manifest: SkillManifest;
  tools: ToolDefinition[];
}

export function defineSkill(manifest: SkillManifest, tools: ToolDefinition[]): Skill {
  return { manifest: SkillManifestSchema.parse(manifest), tools };
}
