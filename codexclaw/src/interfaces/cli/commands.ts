import type { ChatService } from "../../core/chat-service.js";
import type { BackendMode } from "../../core/types.js";
import { normalizeStrictOneShotText } from "./normalize-one-shot.js";

export async function runOneShot(
  chatService: ChatService,
  prompt: string,
  backend: BackendMode,
  asJson: boolean,
  strict: boolean,
  sessionId?: string
): Promise<void> {
  if (strict) {
    const result = await chatService.chat({ prompt, backend, sessionId });
    const normalizedText = normalizeStrictOneShotText(result.text);
    if (asJson) {
      process.stdout.write(`${JSON.stringify({ ...result, text: normalizedText })}\n`);
      return;
    }
    process.stdout.write(`${result.backend}> ${normalizedText}\n`);
    return;
  }

  if (asJson) {
    const result = await chatService.chat({ prompt, backend, sessionId });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  for await (const event of chatService.streamChat({ prompt, backend, sessionId })) {
    if (event.type === "response.start") {
      process.stdout.write(`${event.backend}> `);
      continue;
    }

    if (event.type === "response.delta") {
      process.stdout.write(event.text);
      continue;
    }

    if (event.type === "response.error") {
      process.stderr.write(`\n[${event.backend}] ${event.code}: ${event.message}\n`);
      continue;
    }

    if (event.type === "response.end") {
      process.stdout.write("\n");
    }
  }
}

export function printHealth(chatService: ChatService): void {
  process.stdout.write(`${JSON.stringify(chatService.getHealth(), null, 2)}\n`);
}
