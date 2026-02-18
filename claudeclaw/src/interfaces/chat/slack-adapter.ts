import { ChatPlatformAdapter } from "./base-adapter.js";
import type { Config } from "../../core/config/schema.js";
import { logger } from "../../utils/logger.js";
import { ConfigError } from "../../utils/errors.js";

export class SlackAdapter extends ChatPlatformAdapter {
  private app: any = null;

  constructor(private config: Config) {
    super();
  }

  async connect(): Promise<void> {
    const slack = this.config.slack;
    if (!slack?.botToken || !slack?.appToken) {
      throw new ConfigError(
        "slack.botToken and slack.appToken are required. Set CLAW_SLACK_BOT_TOKEN and CLAW_SLACK_APP_TOKEN or add to config.json.",
      );
    }

    const { App } = (await import("@slack/bolt" as string)) as any;
    this.app = new App({
      token: slack.botToken,
      appToken: slack.appToken,
      signingSecret: slack.signingSecret,
      socketMode: true,
    });

    this.app.message(async ({ message, say }: any) => {
      if (message.subtype) return; // Ignore bot/system messages
      const channel = message.channel;
      const sessionId = `sl:${channel}`;

      await this.handleIncoming(
        {
          text: message.text || "",
          sessionId,
          userId: message.user,
        },
        channel,
      );
    });

    await this.app.start();
    logger.info("Slack bot connected");
  }

  async stop(): Promise<void> {
    await this.app?.stop();
  }

  async sendReply(channel: string, text: string): Promise<void> {
    await this.app.client.chat.postMessage({
      channel,
      text,
    });
  }
}
