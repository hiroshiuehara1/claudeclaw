import type { Config, BackendType } from "../config/schema.js";
import type { Backend } from "./types.js";
import { ClaudeBackend } from "./claude-backend.js";
import { OpenAIBackend } from "./openai-backend.js";
import { ConfigError } from "../../utils/errors.js";

export function createBackend(
  config: Config,
  backendOverride?: BackendType,
): Backend {
  const type = backendOverride || config.defaultBackend;

  switch (type) {
    case "claude": {
      const key = config.anthropicApiKey;
      if (!key) {
        throw new ConfigError(
          "ANTHROPIC_API_KEY is required for Claude backend. Set it in .env or config.json.",
        );
      }
      return new ClaudeBackend(key);
    }
    case "openai": {
      const key = config.openaiApiKey;
      if (!key) {
        throw new ConfigError(
          "OPENAI_API_KEY is required for OpenAI backend. Set it in .env or config.json.",
        );
      }
      return new OpenAIBackend(key);
    }
    default:
      throw new ConfigError(`Unknown backend type: ${type}`);
  }
}
