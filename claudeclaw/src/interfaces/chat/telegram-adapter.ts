import { ChatPlatformAdapter } from "./base-adapter.js";
import type { Config } from "../../core/config/schema.js";
import { logger } from "../../utils/logger.js";
import { ConfigError } from "../../utils/errors.js";

export class TelegramAdapter extends ChatPlatformAdapter {
  private bot: any = null;

  constructor(private config: Config) {
    super();
  }

  async connect(): Promise<void> {
    const token = this.config.telegram?.botToken;
    if (!token) {
      throw new ConfigError(
        "telegram.botToken is required. Set CLAW_TELEGRAM_TOKEN or add to config.json.",
      );
    }

    const { Telegraf } = (await import("telegraf" as string)) as any;
    this.bot = new Telegraf(token);

    this.bot.on("text", async (ctx: any) => {
      const chatId = String(ctx.chat.id);
      const sessionId = `tg:${chatId}`;

      await this.handleIncoming(
        {
          text: ctx.message.text,
          sessionId,
          userId: String(ctx.from.id),
        },
        chatId,
      );
    });

    await this.bot.launch();
    logger.info("Telegram bot connected");
  }

  async stop(): Promise<void> {
    this.bot?.stop("SIGINT");
  }

  async sendReply(chatId: string, text: string): Promise<void> {
    await this.bot.telegram.sendMessage(chatId, text);
  }
}
