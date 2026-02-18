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

export const TelegramConfigSchema = z.object({
  botToken: z.string(),
});

export const DiscordConfigSchema = z.object({
  botToken: z.string(),
  guildId: z.string().optional(),
});

export const SlackConfigSchema = z.object({
  botToken: z.string(),
  appToken: z.string(),
  signingSecret: z.string(),
});

export const VectorMemoryConfigSchema = z.object({
  enabled: z.boolean().default(false),
  topK: z.number().int().min(1).max(50).default(5),
  embeddingModel: z.string().optional(),
});

export const BrowserControlConfigSchema = z.object({
  headless: z.boolean().default(true),
  timeout: z.number().int().default(30000),
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
      apiKey: z.string().optional(),
      corsOrigins: z.array(z.string()).default(["http://localhost:3100"]),
      rateLimitMax: z.number().int().min(1).default(100),
    })
    .default({ port: 3100, host: "127.0.0.1", corsOrigins: ["http://localhost:3100"], rateLimitMax: 100 }),
  engine: z
    .object({
      chatTimeout: z.number().int().min(1000).default(120_000),
      retryMaxAttempts: z.number().int().min(0).default(3),
      retryBaseDelay: z.number().int().min(100).default(1000),
    })
    .default({ chatTimeout: 120_000, retryMaxAttempts: 3, retryBaseDelay: 1000 }),
  skills: z.array(SkillSourceSchema).default([]),
  systemPrompt: z.string().optional(),
  telegram: TelegramConfigSchema.optional(),
  discord: DiscordConfigSchema.optional(),
  slack: SlackConfigSchema.optional(),
  vectorMemory: VectorMemoryConfigSchema.default({
    enabled: false,
    topK: 5,
  }),
  browserControl: BrowserControlConfigSchema.default({
    headless: true,
    timeout: 30000,
  }),
});

export type Config = z.infer<typeof ConfigSchema>;
