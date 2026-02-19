import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfigError } from "../src/utils/errors.js";

// Mock logger
vi.mock("../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  createChildLogger: vi.fn(() => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  })),
}));

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "adapter-session"),
}));

function createMockEngine(events: any[] = []) {
  return {
    chat: vi.fn(async function* () {
      for (const e of events) yield e;
    }),
    config: { defaultBackend: "claude" },
  } as any;
}

function makeConfig(overrides: any = {}): any {
  return {
    defaultBackend: "claude",
    dataDir: "/tmp",
    logLevel: "info",
    web: { port: 3100, host: "127.0.0.1", corsOrigins: [], rateLimitMax: 100 },
    engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000 },
    skills: [],
    vectorMemory: { enabled: false, topK: 5 },
    browserControl: { headless: true, timeout: 30000 },
    ...overrides,
  };
}

describe("DiscordAdapter", () => {
  let DiscordAdapter: any;
  let mockClient: any;
  let mockMessageHandler: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockClient = {
      on: vi.fn((event: string, handler: any) => {
        if (event === "messageCreate") mockMessageHandler = handler;
      }),
      login: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      channels: {
        fetch: vi.fn().mockResolvedValue({
          send: vi.fn(),
        }),
      },
    };

    // Mock discord.js dynamic import
    vi.doMock("discord.js", () => ({
      Client: vi.fn(() => mockClient),
      GatewayIntentBits: { Guilds: 1, GuildMessages: 2, MessageContent: 3 },
    }));

    // Re-import to get fresh module
    const mod = await import("../src/interfaces/chat/discord-adapter.js");
    DiscordAdapter = mod.DiscordAdapter;
  });

  it("should throw ConfigError when botToken is missing", async () => {
    const adapter = new DiscordAdapter(makeConfig());
    await expect(adapter.connect()).rejects.toThrow(ConfigError);
  });

  it("should connect with valid token", async () => {
    const adapter = new DiscordAdapter(
      makeConfig({ discord: { botToken: "test-token" } }),
    );
    await adapter.connect();
    expect(mockClient.login).toHaveBeenCalledWith("test-token");
  });

  it("should ignore bot messages", async () => {
    const engine = createMockEngine([{ type: "text", text: "hi" }, { type: "done" }]);
    const adapter = new DiscordAdapter(
      makeConfig({ discord: { botToken: "test-token" } }),
    );
    await adapter.start(engine);

    // Simulate bot message
    await mockMessageHandler({
      author: { bot: true, id: "bot-1" },
      content: "test",
      channelId: "ch-1",
    });

    expect(engine.chat).not.toHaveBeenCalled();
  });

  it("should handle incoming user messages", async () => {
    const engine = createMockEngine([{ type: "text", text: "reply" }, { type: "done" }]);
    const adapter = new DiscordAdapter(
      makeConfig({ discord: { botToken: "test-token" } }),
    );
    await adapter.start(engine);

    await mockMessageHandler({
      author: { bot: false, id: "user-1" },
      content: "hello",
      channelId: "ch-1",
    });

    expect(engine.chat).toHaveBeenCalledWith("hello", "dc:ch-1");
  });

  it("should send short replies directly", async () => {
    const engine = createMockEngine([{ type: "text", text: "short" }, { type: "done" }]);
    const adapter = new DiscordAdapter(
      makeConfig({ discord: { botToken: "test-token" } }),
    );
    await adapter.start(engine);

    const channel = { send: vi.fn() };
    mockClient.channels.fetch.mockResolvedValue(channel);

    await adapter.sendReply("ch-1", "short reply");
    expect(channel.send).toHaveBeenCalledWith("short reply");
  });

  it("should split long messages for Discord", async () => {
    const engine = createMockEngine([{ type: "done" }]);
    const adapter = new DiscordAdapter(
      makeConfig({ discord: { botToken: "test-token" } }),
    );
    await adapter.start(engine);

    const channel = { send: vi.fn() };
    mockClient.channels.fetch.mockResolvedValue(channel);

    const longText = "x".repeat(3000);
    await adapter.sendReply("ch-1", longText);
    expect(channel.send).toHaveBeenCalledTimes(2);
  });

  it("should call destroy on stop", async () => {
    const adapter = new DiscordAdapter(
      makeConfig({ discord: { botToken: "test-token" } }),
    );
    await adapter.connect();
    await adapter.stop();
    expect(mockClient.destroy).toHaveBeenCalled();
  });
});

describe("TelegramAdapter", () => {
  let TelegramAdapter: any;
  let mockBot: any;
  let mockTextHandler: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockBot = {
      on: vi.fn((event: string, handler: any) => {
        if (event === "text") mockTextHandler = handler;
      }),
      launch: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      telegram: {
        sendMessage: vi.fn(),
      },
    };

    vi.doMock("telegraf", () => ({
      Telegraf: vi.fn(() => mockBot),
    }));

    const mod = await import("../src/interfaces/chat/telegram-adapter.js");
    TelegramAdapter = mod.TelegramAdapter;
  });

  it("should throw ConfigError when botToken is missing", async () => {
    const adapter = new TelegramAdapter(makeConfig());
    await expect(adapter.connect()).rejects.toThrow(ConfigError);
  });

  it("should connect with valid token", async () => {
    const adapter = new TelegramAdapter(
      makeConfig({ telegram: { botToken: "tg-token" } }),
    );
    await adapter.connect();
    expect(mockBot.launch).toHaveBeenCalled();
  });

  it("should handle text messages", async () => {
    const engine = createMockEngine([{ type: "text", text: "hi" }, { type: "done" }]);
    const adapter = new TelegramAdapter(
      makeConfig({ telegram: { botToken: "tg-token" } }),
    );
    await adapter.start(engine);

    await mockTextHandler({
      chat: { id: 12345 },
      message: { text: "hello" },
      from: { id: 67890 },
    });

    expect(engine.chat).toHaveBeenCalledWith("hello", "tg:12345");
  });

  it("should send reply via telegram API", async () => {
    const adapter = new TelegramAdapter(
      makeConfig({ telegram: { botToken: "tg-token" } }),
    );
    await adapter.connect();

    await adapter.sendReply("12345", "response text");
    expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
      "12345",
      "response text",
    );
  });

  it("should call stop on bot", async () => {
    const adapter = new TelegramAdapter(
      makeConfig({ telegram: { botToken: "tg-token" } }),
    );
    await adapter.connect();
    await adapter.stop();
    expect(mockBot.stop).toHaveBeenCalledWith("SIGINT");
  });
});

describe("SlackAdapter", () => {
  let SlackAdapter: any;
  let mockApp: any;
  let mockMessageHandler: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockApp = {
      message: vi.fn((handler: any) => {
        mockMessageHandler = handler;
      }),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      client: {
        chat: {
          postMessage: vi.fn(),
        },
      },
    };

    vi.doMock("@slack/bolt", () => ({
      App: vi.fn(() => mockApp),
    }));

    const mod = await import("../src/interfaces/chat/slack-adapter.js");
    SlackAdapter = mod.SlackAdapter;
  });

  it("should throw ConfigError when tokens are missing", async () => {
    const adapter = new SlackAdapter(makeConfig());
    await expect(adapter.connect()).rejects.toThrow(ConfigError);
  });

  it("should throw ConfigError when appToken is missing", async () => {
    const adapter = new SlackAdapter(
      makeConfig({ slack: { botToken: "xoxb-1" } }),
    );
    await expect(adapter.connect()).rejects.toThrow(ConfigError);
  });

  it("should connect with valid tokens", async () => {
    const adapter = new SlackAdapter(
      makeConfig({
        slack: {
          botToken: "xoxb-1",
          appToken: "xapp-1",
          signingSecret: "secret",
        },
      }),
    );
    await adapter.connect();
    expect(mockApp.start).toHaveBeenCalled();
  });

  it("should ignore messages with subtypes (bot/system)", async () => {
    const engine = createMockEngine([{ type: "done" }]);
    const adapter = new SlackAdapter(
      makeConfig({
        slack: {
          botToken: "xoxb-1",
          appToken: "xapp-1",
          signingSecret: "secret",
        },
      }),
    );
    await adapter.start(engine);

    await mockMessageHandler({
      message: { subtype: "bot_message", text: "bot", channel: "C1", user: "U1" },
      say: vi.fn(),
    });

    expect(engine.chat).not.toHaveBeenCalled();
  });

  it("should handle user messages", async () => {
    const engine = createMockEngine([
      { type: "text", text: "slack reply" },
      { type: "done" },
    ]);
    const adapter = new SlackAdapter(
      makeConfig({
        slack: {
          botToken: "xoxb-1",
          appToken: "xapp-1",
          signingSecret: "secret",
        },
      }),
    );
    await adapter.start(engine);

    await mockMessageHandler({
      message: { text: "hey", channel: "C123", user: "U456" },
      say: vi.fn(),
    });

    expect(engine.chat).toHaveBeenCalledWith("hey", "sl:C123");
  });

  it("should send reply via Slack API", async () => {
    const adapter = new SlackAdapter(
      makeConfig({
        slack: {
          botToken: "xoxb-1",
          appToken: "xapp-1",
          signingSecret: "secret",
        },
      }),
    );
    await adapter.connect();

    await adapter.sendReply("C123", "hello slack");
    expect(mockApp.client.chat.postMessage).toHaveBeenCalledWith({
      channel: "C123",
      text: "hello slack",
    });
  });

  it("should call stop on app", async () => {
    const adapter = new SlackAdapter(
      makeConfig({
        slack: {
          botToken: "xoxb-1",
          appToken: "xapp-1",
          signingSecret: "secret",
        },
      }),
    );
    await adapter.connect();
    await adapter.stop();
    expect(mockApp.stop).toHaveBeenCalled();
  });
});
