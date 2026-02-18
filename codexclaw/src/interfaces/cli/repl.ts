import readline from "node:readline/promises";
import type { ChatService } from "../../core/chat-service.js";
import type { BackendMode, BackendName } from "../../core/types.js";

function parseBackend(input: string): BackendMode | null {
  if (input === "auto" || input === "codex" || input === "claude") {
    return input;
  }
  return null;
}

export async function runChatRepl(chatService: ChatService, initialBackend: BackendMode = "auto"): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let backend: BackendMode = initialBackend;
  let sessionId: string | undefined;

  process.stdout.write("CodexClaw interactive chat\n");
  process.stdout.write("Commands: /backend auto|codex|claude, /new, /session, /exit\n\n");

  try {
    while (true) {
      const input = (await rl.question("you> ")).trim();
      if (!input) {
        continue;
      }

      if (input === "/exit" || input === "/quit") {
        break;
      }

      if (input.startsWith("/backend")) {
        const value = input.split(/\s+/)[1] || "";
        const parsed = parseBackend(value);
        if (!parsed) {
          process.stdout.write("Valid backends: auto, codex, claude\n");
          continue;
        }
        backend = parsed;
        process.stdout.write(`Backend set to ${backend}\n`);
        continue;
      }

      if (input === "/new") {
        sessionId = undefined;
        process.stdout.write("Started a new session\n");
        continue;
      }

      if (input === "/session") {
        process.stdout.write(`Session: ${sessionId || "(new)"}\n`);
        continue;
      }

      let activeBackend: BackendName | null = null;
      try {
        for await (const event of chatService.streamChat({
          prompt: input,
          backend,
          sessionId
        })) {
          sessionId = event.sessionId;
          if (event.type === "response.start") {
            activeBackend = event.backend;
            process.stdout.write(`\n${event.backend}> `);
            continue;
          }

          if (event.type === "response.delta") {
            process.stdout.write(event.text);
            continue;
          }

          if (event.type === "response.error") {
            process.stdout.write(`\n[${event.backend} error] ${event.code}: ${event.message}\n`);
            continue;
          }

          if (event.type === "response.end") {
            process.stdout.write("\n\n");
            activeBackend = null;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(`\nRequest failed: ${message}\n\n`);
      }

      if (activeBackend) {
        process.stdout.write("\n");
      }
    }
  } finally {
    rl.close();
  }
}
