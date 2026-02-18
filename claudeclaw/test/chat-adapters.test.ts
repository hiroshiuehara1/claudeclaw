import { describe, it, expect, vi } from "vitest";
import type { Config } from "../src/core/config/schema.js";
import { ConfigError } from "../src/utils/errors.js";

const baseConfig: Config = {
  defaultBackend: "claude",
  dataDir: "/tmp/claw-test",
  logLevel: "error",
  web: { port: 3100, host: "127.0.0.1" },
  skills: [],
  vectorMemory: { enabled: false, topK: 5 },
  browserControl: { headless: true, timeout: 30000 },
};

describe("TelegramAdapter", () => {
  it("should throw if no bot token configured", async () => {
    const { TelegramAdapter } = await import(
      "../src/interfaces/chat/telegram-adapter.js"
    );
    const adapter = new TelegramAdapter(baseConfig);
    // connect() should throw since no telegram config
    await expect(adapter.connect()).rejects.toThrow("botToken");
  });

  it("should store config", async () => {
    const { TelegramAdapter } = await import(
      "../src/interfaces/chat/telegram-adapter.js"
    );
    const config = { ...baseConfig, telegram: { botToken: "test-token" } };
    const adapter = new TelegramAdapter(config);
    expect(adapter).toBeDefined();
  });
});

describe("DiscordAdapter", () => {
  it("should throw if no bot token configured", async () => {
    const { DiscordAdapter } = await import(
      "../src/interfaces/chat/discord-adapter.js"
    );
    const adapter = new DiscordAdapter(baseConfig);
    await expect(adapter.connect()).rejects.toThrow("botToken");
  });

  it("should store config", async () => {
    const { DiscordAdapter } = await import(
      "../src/interfaces/chat/discord-adapter.js"
    );
    const config = { ...baseConfig, discord: { botToken: "test-token" } };
    const adapter = new DiscordAdapter(config);
    expect(adapter).toBeDefined();
  });
});

describe("SlackAdapter", () => {
  it("should throw if no bot token configured", async () => {
    const { SlackAdapter } = await import(
      "../src/interfaces/chat/slack-adapter.js"
    );
    const adapter = new SlackAdapter(baseConfig);
    await expect(adapter.connect()).rejects.toThrow("botToken");
  });

  it("should throw if no app token configured", async () => {
    const { SlackAdapter } = await import(
      "../src/interfaces/chat/slack-adapter.js"
    );
    const config = {
      ...baseConfig,
      slack: { botToken: "xoxb-test", appToken: "", signingSecret: "sec" },
    };
    const adapter = new SlackAdapter(config);
    await expect(adapter.connect()).rejects.toThrow("appToken");
  });

  it("should store config", async () => {
    const { SlackAdapter } = await import(
      "../src/interfaces/chat/slack-adapter.js"
    );
    const config = {
      ...baseConfig,
      slack: { botToken: "xoxb", appToken: "xapp", signingSecret: "sec" },
    };
    const adapter = new SlackAdapter(config);
    expect(adapter).toBeDefined();
  });
});

describe("ChatPlatformAdapter base", () => {
  it("should export barrel from index", async () => {
    const mod = await import("../src/interfaces/chat/index.js");
    expect(mod.TelegramAdapter).toBeDefined();
    expect(mod.DiscordAdapter).toBeDefined();
    expect(mod.SlackAdapter).toBeDefined();
    expect(mod.ChatPlatformAdapter).toBeDefined();
  });
});
