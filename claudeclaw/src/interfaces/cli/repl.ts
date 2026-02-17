import * as readline from "node:readline";
import { nanoid } from "nanoid";
import chalk from "chalk";
import type { Engine } from "../../core/engine.js";

export async function startRepl(engine: Engine): Promise<void> {
  const sessionId = nanoid(12);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.bold.cyan("\n🐾 ClaudeClaw Interactive Chat"));
  console.log(chalk.dim(`Session: ${sessionId}`));
  console.log(chalk.dim('Type "exit" or Ctrl+C to quit.\n'));

  const prompt = () => {
    rl.question(chalk.green("you> "), async (input) => {
      const trimmed = input.trim();
      if (!trimmed || trimmed === "exit" || trimmed === "quit") {
        console.log(chalk.dim("\nGoodbye!"));
        rl.close();
        return;
      }

      process.stdout.write(chalk.blue("claw> "));

      try {
        for await (const event of engine.chat(trimmed, sessionId)) {
          switch (event.type) {
            case "text":
              process.stdout.write(event.text || "");
              break;
            case "tool_use":
              process.stdout.write(
                chalk.dim(`\n[using tool: ${event.toolCall?.name}]\n`),
              );
              break;
            case "error":
              process.stdout.write(chalk.red(`\nError: ${event.error}\n`));
              break;
            case "done":
              process.stdout.write("\n\n");
              break;
          }
        }
      } catch (err) {
        console.error(
          chalk.red(`\nError: ${err instanceof Error ? err.message : String(err)}`),
        );
      }

      prompt();
    });
  };

  rl.on("close", () => {
    process.exit(0);
  });

  prompt();
}
