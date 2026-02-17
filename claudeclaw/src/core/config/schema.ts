import { z } from "zod";

export const BackendType = z.enum(["claude", "openai"]);
export type BackendType = z.infer<typeof BackendType>;

export const LogLevel = z.enum(["debug", "info", "warn", "error"]);
export type LogLevel = z.infer<typeof LogLevel>;

export const SkillSourceSchema = z.object({
  type: z.enum(["bundled", "npm", "local"]),
  path: z.string().optional(),
  package: z.string().optional(),
  enabled: z.boolean().default(true),
});

export const ConfigSchema = z.object({
  defaultBackend: BackendType.default("claude"),
  defaultModel: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  dataDir: z.string().default(""),
  logLevel: LogLevel.default("info"),
  web: z
    .object({
      port: z.number().int().min(1).max(65535).default(3100),
      host: z.string().default("127.0.0.1"),
    })
    .default({ port: 3100, host: "127.0.0.1" }),
  skills: z.array(SkillSourceSchema).default([]),
  systemPrompt: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
