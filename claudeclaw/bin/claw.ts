#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import { loadConfig } from "../src/core/config/config.js";
import { Engine } from "../src/core/engine.js";
import { CliAdapter } from "../src/interfaces/cli/index.js";
import { SqliteStore } from "../src/core/memory/sqlite-store.js";
import { MemoryManager } from "../src/core/memory/memory-manager.js";
import { SkillRegistry } from "../src/core/skill/registry.js";
import { setLogLevel } from "../src/utils/logger.js";
import type { BackendType } from "../src/core/config/schema.js";

dotenv.config();

const program = new Command();

program
  .name("claw")
  .description("ClaudeClaw — Open-Source Personal AI Assistant")
  .version("0.1.0");

function createEngine(backendOverride?: BackendType) {
  const config = loadConfig(
    backendOverride ? { defaultBackend: backendOverride } : {},
  );
  setLogLevel(config.logLevel);

  const store = new SqliteStore(config.dataDir);
  const memoryManager = new MemoryManager(store);
  const skillRegistry = new SkillRegistry();

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
  .command("skill")
  .description("Manage skills")
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

program.parse();
