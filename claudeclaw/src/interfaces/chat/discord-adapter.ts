import { ChatPlatformAdapter } from "./base-adapter.js";
import type { Config } from "../../core/config/schema.js";
import { logger } from "../../utils/logger.js";
import { ConfigError } from "../../utils/errors.js";

const DISCORD_MAX_LENGTH = 2000;

export class DiscordAdapter extends ChatPlatformAdapter {
  private client: any = null;

  constructor(private config: Config) {
    super();
  }

  async connect(): Promise<void> {
    const token = this.config.discord?.botToken;
    if (!token) {
      throw new ConfigError(
        "discord.botToken is required. Set CLAW_DISCORD_TOKEN or add to config.json.",
      );
    }

    const { Client, GatewayIntentBits } = (await import("discord.js" as string)) as any;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.client.on("messageCreate", async (message: any) => {
      if (message.author.bot) return;

      const channelId = message.channelId;
      const sessionId = `dc:${channelId}`;

      await this.handleIncoming(
        {
          text: message.content,
          sessionId,
          userId: message.author.id,
        },
        channelId,
      );
    });

    await this.client.login(token);
    logger.info("Discord bot connected");
  }

  async stop(): Promise<void> {
    this.client?.destroy();
  }

  async sendReply(channelId: string, text: string): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel?.send) return;

    // Split long messages to respect Discord's 2000 char limit
    if (text.length <= DISCORD_MAX_LENGTH) {
      await channel.send(text);
    } else {
      const chunks = splitText(text, DISCORD_MAX_LENGTH);
      for (const chunk of chunks) {
        await channel.send(chunk);
      }
    }
  }
}

function splitText(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split at newline
    let splitIdx = remaining.lastIndexOf("\n", maxLen);
    if (splitIdx <= 0) splitIdx = maxLen;
    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).replace(/^\n/, "");
  }
  return chunks;
}
