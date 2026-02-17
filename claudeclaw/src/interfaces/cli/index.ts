import { nanoid } from "nanoid";
import chalk from "chalk";
import type { Engine } from "../../core/engine.js";
import { startRepl } from "./repl.js";
import type { InterfaceAdapter } from "../types.js";

export class CliAdapter implements InterfaceAdapter {
  private engine!: Engine;

  async start(engine: Engine): Promise<void> {
    this.engine = engine;
  }

  async stop(): Promise<void> {}

  async runOnce(prompt: string, options: { sessionId?: string } = {}): Promise<void> {
    const sessionId = options.sessionId || nanoid(12);
    let hasOutput = false;

    for await (const event of this.engine.chat(prompt, sessionId)) {
      switch (event.type) {
        case "text":
          process.stdout.write(event.text || "");
          hasOutput = true;
          break;
        case "tool_use":
          if (process.env.CLAW_LOG_LEVEL === "debug") {
            process.stderr.write(
              chalk.dim(`[tool: ${event.toolCall?.name}]\n`),
            );
          }
          break;
        case "error":
          process.stderr.write(chalk.red(`Error: ${event.error}\n`));
          break;
        case "done":
          if (hasOutput) process.stdout.write("\n");
          break;
      }
    }
  }

  async startChat(): Promise<void> {
    await startRepl(this.engine);
  }
}
