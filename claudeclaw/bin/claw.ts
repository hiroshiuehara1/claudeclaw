#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import { loadConfig } from "../src/core/config/config.js";
import { Engine } from "../src/core/engine.js";
import { CliAdapter } from "../src/interfaces/cli/index.js";
import { SqliteStore } from "../src/core/memory/sqlite-store.js";
import { MemoryManager } from "../src/core/memory/memory-manager.js";
import { SkillRegistry } from "../src/core/skill/registry.js";
import { VectorStore } from "../src/core/memory/vector-store.js";
import { createEmbedder } from "../src/core/memory/embedder.js";
import {
  searchSkills,
  installSkill,
  removeSkill,
  scaffoldSkill,
} from "../src/core/skill/marketplace.js";
import { setLogLevel } from "../src/utils/logger.js";
import { LifecycleManager } from "../src/utils/lifecycle.js";
import { validateStartup } from "../src/core/startup.js";
import {
  getConfigPath,
  readRawConfig,
  writeConfigValue,
  redactConfig,
} from "../src/core/config/config-writer.js";
import type { BackendType, Config } from "../src/core/config/schema.js";
import type { InterfaceAdapter } from "../src/interfaces/types.js";

dotenv.config();

const program = new Command();

program
  .name("claw")
  .description("ClaudeClaw — Open-Source Personal AI Assistant")
  .version("0.1.0");

function createMemoryManager(config: Config) {
  const store = new SqliteStore(config.dataDir);

  let vectorStore: VectorStore | undefined;
  let embedder: NonNullable<ReturnType<typeof createEmbedder>> | undefined;
  if (config.vectorMemory?.enabled) {
    vectorStore = new VectorStore(config.dataDir);
    embedder = createEmbedder(config) ?? undefined;
  }

  return new MemoryManager(store, vectorStore, embedder);
}

function createEngine(backendOverride?: BackendType) {
  const config = loadConfig(
    backendOverride ? { defaultBackend: backendOverride } : {},
  );
  setLogLevel(config.logLevel);

  const memoryManager = createMemoryManager(config);
  const skillRegistry = new SkillRegistry();

  // Startup validation — warn on issues but don't prevent startup
  const validation = validateStartup(config);
  if (!validation.valid) {
    for (const err of validation.errors) {
      console.warn(`Warning: ${err}`);
    }
  }

  return new Engine({
    config,
    memoryManager,
    skillRegistry,
  });
}

program
  .command("run")
  .description("Send a one-shot prompt and get a response")
  .argument("<prompt>", "The prompt to send")
  .option("-b, --backend <type>", "Backend to use (claude | openai)")
  .option("-m, --model <model>", "Model to use")
  .action(async (prompt: string, opts: { backend?: string; model?: string }) => {
    const engine = createEngine(opts.backend as BackendType | undefined);
    const cli = new CliAdapter();
    await cli.start(engine);
    await cli.runOnce(prompt);
  });

program
  .command("chat")
  .description("Start an interactive chat session")
  .option("-b, --backend <type>", "Backend to use (claude | openai)")
  .action(async (opts: { backend?: string }) => {
    const engine = createEngine(opts.backend as BackendType | undefined);
    const cli = new CliAdapter();
    await cli.start(engine);
    await cli.startChat();
  });

program
  .command("serve <platform>")
  .description("Start a chat platform adapter (web | telegram | discord | slack)")
  .option("-b, --backend <type>", "Backend to use (claude | openai)")
  .action(async (platform: string, opts: { backend?: string }) => {
    const engine = createEngine(opts.backend as BackendType | undefined);
    let adapter: InterfaceAdapter;

    switch (platform) {
      case "web": {
        const { WebAdapter } = await import(
          "../src/interfaces/web/server.js"
        );
        adapter = new WebAdapter();
        break;
      }
      case "telegram": {
        const { TelegramAdapter } = await import(
          "../src/interfaces/chat/telegram-adapter.js"
        );
        adapter = new TelegramAdapter(engine.config);
        break;
      }
      case "discord": {
        const { DiscordAdapter } = await import(
          "../src/interfaces/chat/discord-adapter.js"
        );
        adapter = new DiscordAdapter(engine.config);
        break;
      }
      case "slack": {
        const { SlackAdapter } = await import(
          "../src/interfaces/chat/slack-adapter.js"
        );
        adapter = new SlackAdapter(engine.config);
        break;
      }
      default:
        console.error(`Unknown platform: ${platform}. Use web, telegram, discord, or slack.`);
        process.exit(1);
    }

    const lifecycle = new LifecycleManager();
    lifecycle.register("engine", () => engine.shutdown());
    lifecycle.register("adapter", () => adapter.stop());
    lifecycle.install();

    await adapter.start(engine);
  });

// --- Session commands ---

const sessionCmd = program.command("session").description("Manage chat sessions");

sessionCmd
  .command("list")
  .description("List recent sessions")
  .option("-l, --limit <n>", "Number of sessions to show", "20")
  .action((opts: { limit: string }) => {
    const config = loadConfig();
    const mm = createMemoryManager(config);
    const sessions = mm.listSessions(parseInt(opts.limit, 10));
    if (sessions.length === 0) {
      console.log("No sessions found.");
    } else {
      for (const s of sessions) {
        console.log(
          `  ${s.id}  ${s.backend || "-"}/${s.model || "-"}  msgs:${s.message_count}  updated:${s.updated_at}`,
        );
      }
    }
  });

sessionCmd
  .command("show <id>")
  .description("Show session details and messages")
  .action((id: string) => {
    const config = loadConfig();
    const mm = createMemoryManager(config);
    const session = mm.getSession(id);
    if (!session) {
      console.error(`Session not found: ${id}`);
      process.exit(1);
    }
    console.log(`Session: ${session.id}`);
    console.log(`Backend: ${session.backend || "-"}`);
    console.log(`Model: ${session.model || "-"}`);
    console.log(`Created: ${session.created_at}`);
    console.log(`Updated: ${session.updated_at}`);
    console.log(`Messages: ${session.message_count}`);
    console.log("---");
    const messages = mm.getAllMessages(id);
    for (const msg of messages) {
      console.log(`[${msg.role}] ${msg.content}`);
    }
  });

sessionCmd
  .command("delete <id>")
  .description("Delete a session and its messages")
  .action((id: string) => {
    const config = loadConfig();
    const mm = createMemoryManager(config);
    mm.deleteSession(id);
    console.log(`Deleted session: ${id}`);
  });

sessionCmd
  .command("export <id>")
  .description("Export a session")
  .option("-f, --format <format>", "Export format (json | markdown)", "json")
  .action((id: string, opts: { format: string }) => {
    const config = loadConfig();
    const mm = createMemoryManager(config);
    const session = mm.getSession(id);
    if (!session) {
      console.error(`Session not found: ${id}`);
      process.exit(1);
    }
    const messages = mm.getAllMessages(id);

    if (opts.format === "markdown") {
      console.log(`# Session ${session.id}\n`);
      console.log(`**Created:** ${session.created_at}`);
      console.log(`**Updated:** ${session.updated_at}`);
      if (session.model) console.log(`**Model:** ${session.model}`);
      console.log("\n---\n");
      for (const msg of messages) {
        console.log(`### ${msg.role === "user" ? "User" : "Assistant"}\n`);
        console.log(`${msg.content}\n`);
        console.log("---\n");
      }
    } else {
      console.log(JSON.stringify({ session, messages }, null, 2));
    }
  });

sessionCmd
  .command("clean")
  .description("Delete expired sessions")
  .option("--older-than <hours>", "TTL in hours", "168")
  .action((opts: { olderThan: string }) => {
    const config = loadConfig();
    const mm = createMemoryManager(config);
    const count = mm.cleanExpiredSessions(parseInt(opts.olderThan, 10));
    console.log(`Cleaned ${count} expired sessions.`);
  });

// --- Memory commands ---

const memoryCmd = program.command("memory").description("Manage stored memories");

memoryCmd
  .command("list")
  .description("List all memories")
  .option("-c, --category <cat>", "Filter by category")
  .action((opts: { category?: string }) => {
    const config = loadConfig();
    const mm = createMemoryManager(config);
    const memories = mm.getMemories(opts.category);
    if (memories.length === 0) {
      console.log("No memories found.");
    } else {
      for (const m of memories) {
        console.log(`  [${m.category}] ${m.key} = ${m.value}`);
      }
    }
  });

memoryCmd
  .command("set <category> <key> <value>")
  .description("Set a memory value")
  .action(async (category: string, key: string, value: string) => {
    const config = loadConfig();
    const mm = createMemoryManager(config);
    await mm.remember(`${category}: ${key} = ${value}`);
    console.log(`Set [${category}] ${key} = ${value}`);
  });

memoryCmd
  .command("delete <category> <key>")
  .description("Delete a memory")
  .action((category: string, key: string) => {
    const config = loadConfig();
    const mm = createMemoryManager(config);
    const deleted = mm.deleteMemory(category, key);
    if (deleted) {
      console.log(`Deleted [${category}] ${key}`);
    } else {
      console.log(`Memory not found: [${category}] ${key}`);
    }
  });

// --- Config commands ---

const configCmd = program.command("config").description("Manage configuration");

configCmd
  .command("show")
  .description("Display current configuration (secrets redacted)")
  .action(() => {
    const config = loadConfig();
    const redacted = redactConfig(config);
    console.log(JSON.stringify(redacted, null, 2));
  });

configCmd
  .command("set <key> <value>")
  .description("Set a configuration value")
  .action((key: string, value: string) => {
    const config = loadConfig();
    writeConfigValue(config.dataDir, key, value);
    console.log(`Set ${key} = ${value}`);
  });

configCmd
  .command("path")
  .description("Print config file path")
  .action(() => {
    const config = loadConfig();
    console.log(getConfigPath(config.dataDir));
  });

// --- Skill commands ---

const skillCmd = program.command("skill").description("Manage skills");

skillCmd
  .command("list")
  .description("List registered skills")
  .action(() => {
    const config = loadConfig();
    const registry = new SkillRegistry();
    const skills = registry.listSkills();
    if (skills.length === 0) {
      console.log("No skills registered. Add skills in ~/.claudeclaw/config.json");
    } else {
      for (const skill of skills) {
        console.log(
          `  ${skill.manifest.name}@${skill.manifest.version} — ${skill.manifest.description} (${skill.tools.length} tools)`,
        );
      }
    }
  });

skillCmd
  .command("search <query>")
  .description("Search npm for claudeclaw skills")
  .action(async (query: string) => {
    const results = await searchSkills(query);
    if (results.length === 0) {
      console.log("No skills found.");
    } else {
      for (const r of results) {
        console.log(`  ${r.name}@${r.version} — ${r.description}`);
      }
    }
  });

skillCmd
  .command("install <name>")
  .description("Install a skill from npm")
  .action(async (name: string) => {
    const config = loadConfig();
    installSkill(name, config.dataDir);
  });

skillCmd
  .command("remove <name>")
  .description("Remove an installed skill")
  .action(async (name: string) => {
    const config = loadConfig();
    removeSkill(name, config.dataDir);
  });

skillCmd
  .command("create <name>")
  .description("Scaffold a new skill project")
  .action((name: string) => {
    scaffoldSkill(name);
  });

program.parse();
