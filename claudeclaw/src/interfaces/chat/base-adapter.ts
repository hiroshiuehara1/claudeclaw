import type { Engine } from "../../core/engine.js";
import type { InterfaceAdapter, InterfaceMessage } from "../types.js";
import { nanoid } from "nanoid";
import { logger } from "../../utils/logger.js";

export abstract class ChatPlatformAdapter implements InterfaceAdapter {
  protected engine!: Engine;

  async start(engine: Engine): Promise<void> {
    this.engine = engine;
    await this.connect();
  }

  abstract connect(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract sendReply(channelId: string, text: string): Promise<void>;

  protected async handleIncoming(
    message: InterfaceMessage,
    replyTarget?: string,
  ): Promise<void> {
    const sessionId = message.sessionId || nanoid(12);
    let fullText = "";

    try {
      for await (const event of this.engine.chat(message.text, sessionId)) {
        if (event.type === "text" && event.text) {
          fullText += event.text;
        }
      }
      if (fullText) {
        await this.sendReply(replyTarget || sessionId, fullText);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Chat adapter error: ${errMsg}`);

      // Provide user-friendly error message
      const isTimeout = errMsg.includes("timed out") || errMsg.includes("aborted");
      const userMessage = isTimeout
        ? "Sorry, the request timed out. Please try again."
        : "Sorry, something went wrong processing your message. Please try again.";

      try {
        await this.sendReply(replyTarget || sessionId, userMessage);
      } catch (replyErr) {
        logger.error(
          `Failed to send error reply: ${replyErr instanceof Error ? replyErr.message : String(replyErr)}`,
        );
      }
    }
  }
}
