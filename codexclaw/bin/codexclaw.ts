#!/usr/bin/env node
import { Command } from "commander";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/core/config.js";
import { runOneShot, printHealth } from "../src/interfaces/cli/commands.js";
import { runChatRepl } from "../src/interfaces/cli/repl.js";
import { printDoctorReport, runDoctor } from "../src/interfaces/cli/doctor.js";
import type { BackendMode } from "../src/core/types.js";

function parseBackend(value: string): BackendMode {
  if (value !== "auto" && value !== "codex" && value !== "claude") {
    throw new Error(`Invalid backend: ${value}`);
  }
  return value;
}

const program = new Command();
program
  .name("codexclaw")
  .description("Local-first AI assistant with codex and claude command backends")
  .version("0.1.0");

program
  .command("run")
  .description("Run one prompt and return output")
  .argument("<prompt>", "Prompt text")
  .option("--backend <backend>", "auto | codex | claude", "auto")
  .option("--json", "Emit JSON response", false)
  .option("--strict", "Normalize one-shot output to a clean final answer", false)
  .option("--session <id>", "Continue an existing session")
  .action(async (prompt: string, options: { backend: string; json: boolean; strict: boolean; session?: string }) => {
    const app = createApp();
    try {
      await runOneShot(
        app.service,
        prompt,
        parseBackend(options.backend),
        options.json,
        options.strict,
        options.session
      );
    } finally {
      app.store.close();
    }
  });

program
  .command("chat")
  .description("Start interactive chat session")
  .option("--backend <backend>", "auto | codex | claude", "auto")
  .action(async (options: { backend: string }) => {
    const app = createApp();
    try {
      await runChatRepl(app.service, parseBackend(options.backend));
    } finally {
      app.store.close();
    }
  });

program
  .command("health")
  .description("Print backend and circuit-breaker status")
  .action(() => {
    const app = createApp();
    try {
      printHealth(app.service);
    } finally {
      app.store.close();
    }
  });

program
  .command("web")
  .description("Start local web server")
  .action(async () => {
    const app = createApp();

    const shutdown = async (): Promise<void> => {
      await app.web.stop();
      app.store.close();
      process.exit(0);
    };

    process.on("SIGINT", () => {
      void shutdown();
    });
    process.on("SIGTERM", () => {
      void shutdown();
    });

    await app.web.start();
    process.stdout.write(
      `Web server running at http://${app.config.webHost}:${app.config.webPort} (press Ctrl+C to stop)\n`
    );
  });

program
  .command("doctor")
  .description("Check codex/claude command availability and local runtime prerequisites")
  .option("--json", "Emit JSON report", false)
  .option("--no-write-check", "Skip filesystem writability checks", false)
  .action((options: { json: boolean; noWriteCheck: boolean }) => {
    const config = loadConfig();
    const report = runDoctor(config, { noWriteCheck: options.noWriteCheck });
    if (options.json) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
      printDoctorReport(report);
    }
    if (!report.ok) {
      process.exitCode = 1;
    }
  });

const argv = process.argv.length <= 2 ? [process.argv[0], process.argv[1], "chat"] : process.argv;
await program.parseAsync(argv);
