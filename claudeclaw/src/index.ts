// ClaudeClaw — Public API

// Core
export { Engine } from "./core/engine.js";
export { loadConfig } from "./core/config/config.js";
export { ConfigSchema, type Config, type BackendType } from "./core/config/schema.js";
export { type Backend, type BackendEvent, type BackendQueryOptions } from "./core/backend/types.js";
export { createBackend } from "./core/backend/backend-factory.js";

// Memory
export { SqliteStore } from "./core/memory/sqlite-store.js";
export { MemoryManager } from "./core/memory/memory-manager.js";
export { VectorStore } from "./core/memory/vector-store.js";
export { type Embedder, createEmbedder } from "./core/memory/embedder.js";

// Skills
export { defineSkill, type Skill, type SkillManifest } from "./core/skill/types.js";
export { SkillRegistry } from "./core/skill/registry.js";
export { loadSkill, loadAllSkills } from "./core/skill/loader.js";
export { searchSkills, installSkill, removeSkill, scaffoldSkill } from "./core/skill/marketplace.js";

// Interfaces
export { type InterfaceAdapter, type InterfaceMessage } from "./interfaces/types.js";
export { ChatPlatformAdapter } from "./interfaces/chat/base-adapter.js";
export { TelegramAdapter } from "./interfaces/chat/telegram-adapter.js";
export { DiscordAdapter } from "./interfaces/chat/discord-adapter.js";
export { SlackAdapter } from "./interfaces/chat/slack-adapter.js";

// Utils
export { logger, setLogLevel } from "./utils/logger.js";
export { ClawError, BackendError, ConfigError, SkillError, MemoryError } from "./utils/errors.js";
export { collectStream, mapStream } from "./utils/stream.js";
