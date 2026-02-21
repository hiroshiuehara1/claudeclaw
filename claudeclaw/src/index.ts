// ClaudeClaw — Public API

// Core
export { Engine } from "./core/engine.js";
export { loadConfig } from "./core/config/config.js";
export { ConfigSchema, type Config, type BackendType } from "./core/config/schema.js";
export { type Backend, type BackendEvent, type BackendQueryOptions } from "./core/backend/types.js";
export { createBackend } from "./core/backend/backend-factory.js";
export { CircuitBreaker, type CircuitState, type CircuitBreakerOptions } from "./core/backend/circuit-breaker.js";

// Cache
export { ResponseCache, type CacheEntry, type ResponseCacheOptions } from "./core/cache/response-cache.js";
export { validateStartup, type StartupValidation } from "./core/startup.js";
export {
  getConfigPath,
  readRawConfig,
  writeConfigValue,
  redactConfig,
} from "./core/config/config-writer.js";

// Memory
export { SqliteStore } from "./core/memory/sqlite-store.js";
export { MemoryManager } from "./core/memory/memory-manager.js";
export { VectorStore } from "./core/memory/vector-store.js";
export {
  type Embedder,
  createEmbedder,
  NoOpEmbedder,
  CachedEmbedder,
} from "./core/memory/embedder.js";

// Skills
export { defineSkill, type Skill, type SkillManifest } from "./core/skill/types.js";
export { SkillRegistry } from "./core/skill/registry.js";
export { loadSkill, loadAllSkills } from "./core/skill/loader.js";
export { searchSkills, installSkill, removeSkill, scaffoldSkill } from "./core/skill/marketplace.js";

// Tools
export { ToolRegistry } from "./core/tools/tool-registry.js";
export { shellTool } from "./core/tools/builtin/shell.js";
export { readFileTool, writeFileTool, listDirTool } from "./core/tools/builtin/file-ops.js";
export { gitStatusTool, gitDiffTool, gitLogTool } from "./core/tools/builtin/git.js";

// Templates
export { PromptTemplateManager, type PromptTemplate } from "./core/templates/prompt-templates.js";

// Interfaces
export { type InterfaceAdapter, type InterfaceMessage } from "./interfaces/types.js";
export { WebAdapter } from "./interfaces/web/server.js";
export { CliAdapter } from "./interfaces/cli/index.js";
export { ChatPlatformAdapter } from "./interfaces/chat/base-adapter.js";
export { TelegramAdapter } from "./interfaces/chat/telegram-adapter.js";
export { DiscordAdapter } from "./interfaces/chat/discord-adapter.js";
export { SlackAdapter } from "./interfaces/chat/slack-adapter.js";

// Conversation
export { truncateHistory } from "./core/conversation/truncation.js";

// Utils
export { logger, setLogLevel, createChildLogger } from "./utils/logger.js";
export {
  ClawError,
  BackendError,
  ConfigError,
  SkillError,
  MemoryError,
  ValidationError,
  RateLimitError,
  TimeoutError,
  CircuitOpenError,
  errorToHttpStatus,
} from "./utils/errors.js";
export { collectStream, mapStream } from "./utils/stream.js";
export { LifecycleManager } from "./utils/lifecycle.js";
export { retryWithBackoff } from "./utils/retry.js";
export { MetricsCollector, type MetricsSnapshot } from "./utils/metrics.js";
