import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { ConfigSchema, type Config } from "./schema.js";

function getDataDir(envOverride?: string): string {
  const dir = envOverride || join(homedir(), ".claudeclaw");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function loadConfigFile(dataDir: string): Record<string, unknown> {
  const configPath = join(dataDir, "config.json");
  if (!existsSync(configPath)) return {};
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return {};
  }
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const envDataDir = process.env.CLAW_DATA_DIR;
  const dataDir = getDataDir(envDataDir);
  const fileConfig = loadConfigFile(dataDir);

  const merged: Record<string, unknown> = {
    defaultBackend: process.env.CLAW_DEFAULT_BACKEND,
    defaultModel: process.env.CLAW_DEFAULT_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    dataDir,
    logLevel: process.env.CLAW_LOG_LEVEL,
    web: {
      port: process.env.CLAW_WEB_PORT
        ? parseInt(process.env.CLAW_WEB_PORT, 10)
        : undefined,
      host: process.env.CLAW_WEB_HOST,
    },
    ...(process.env.CLAW_TELEGRAM_TOKEN
      ? { telegram: { botToken: process.env.CLAW_TELEGRAM_TOKEN } }
      : {}),
    ...(process.env.CLAW_DISCORD_TOKEN
      ? { discord: { botToken: process.env.CLAW_DISCORD_TOKEN } }
      : {}),
    ...(process.env.CLAW_SLACK_BOT_TOKEN
      ? {
          slack: {
            botToken: process.env.CLAW_SLACK_BOT_TOKEN,
            appToken: process.env.CLAW_SLACK_APP_TOKEN || "",
            signingSecret: process.env.CLAW_SLACK_SIGNING_SECRET || "",
          },
        }
      : {}),
    ...(process.env.CLAW_VECTOR_MEMORY_ENABLED
      ? { vectorMemory: { enabled: process.env.CLAW_VECTOR_MEMORY_ENABLED === "true" } }
      : {}),
    ...fileConfig,
    ...overrides,
  };

  // Remove undefined values so Zod defaults apply
  const cleaned = JSON.parse(JSON.stringify(merged));
  return ConfigSchema.parse(cleaned);
}
