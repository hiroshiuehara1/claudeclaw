import { existsSync, accessSync, constants } from "node:fs";
import type { Config } from "./config/schema.js";

export interface StartupValidation {
  valid: boolean;
  errors: string[];
}

export function validateStartup(config: Config): StartupValidation {
  const errors: string[] = [];

  // Check API key for default backend
  if (config.defaultBackend === "claude" && !config.anthropicApiKey) {
    errors.push("Default backend is 'claude' but ANTHROPIC_API_KEY is not set");
  }
  if (config.defaultBackend === "openai" && !config.openaiApiKey) {
    errors.push("Default backend is 'openai' but OPENAI_API_KEY is not set");
  }

  // Check data directory is writable
  if (config.dataDir) {
    if (existsSync(config.dataDir)) {
      try {
        accessSync(config.dataDir, constants.W_OK);
      } catch {
        errors.push(`Data directory is not writable: ${config.dataDir}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
