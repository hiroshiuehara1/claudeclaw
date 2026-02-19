import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Config } from "./schema.js";

export function getConfigPath(dataDir: string): string {
  return join(dataDir, "config.json");
}

export function readRawConfig(dataDir: string): Record<string, unknown> {
  const configPath = getConfigPath(dataDir);
  if (!existsSync(configPath)) return {};
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return {};
  }
}

export function writeConfigValue(dataDir: string, key: string, value: string): void {
  const configPath = getConfigPath(dataDir);
  const config = readRawConfig(dataDir);

  // Support dotted keys like "web.port"
  const parts = key.split(".");
  let current: Record<string, unknown> = config;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof current[parts[i]] !== "object" || current[parts[i]] === null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }

  // Auto-convert numeric and boolean strings
  const lastKey = parts[parts.length - 1];
  if (value === "true") current[lastKey] = true;
  else if (value === "false") current[lastKey] = false;
  else if (/^\d+$/.test(value)) current[lastKey] = parseInt(value, 10);
  else current[lastKey] = value;

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

const SECRET_KEYS = new Set([
  "anthropicApiKey",
  "openaiApiKey",
  "apiKey",
  "botToken",
  "appToken",
  "signingSecret",
]);

export function redactConfig(config: Config): Record<string, unknown> {
  return redactObject(config as unknown as Record<string, unknown>);
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SECRET_KEYS.has(key) && typeof value === "string" && value.length > 0) {
      result[key] = value.slice(0, 4) + "****";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redactObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
