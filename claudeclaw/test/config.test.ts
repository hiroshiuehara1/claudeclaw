import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../src/core/config/config.js";
import { ConfigSchema } from "../src/core/config/schema.js";

describe("Config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.CLAW_DEFAULT_BACKEND;
    delete process.env.CLAW_LOG_LEVEL;
    delete process.env.CLAW_WEB_PORT;
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  it("should parse config with defaults", () => {
    const config = ConfigSchema.parse({});
    expect(config.defaultBackend).toBe("claude");
    expect(config.logLevel).toBe("info");
    expect(config.web.port).toBe(3100);
    expect(config.web.host).toBe("127.0.0.1");
    expect(config.skills).toEqual([]);
  });

  it("should load config from env vars", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.CLAW_DEFAULT_BACKEND = "openai";
    process.env.CLAW_LOG_LEVEL = "debug";
    const config = loadConfig();
    expect(config.anthropicApiKey).toBe("test-key");
    expect(config.defaultBackend).toBe("openai");
    expect(config.logLevel).toBe("debug");
  });

  it("should accept overrides", () => {
    const config = loadConfig({ defaultBackend: "openai", logLevel: "error" });
    expect(config.defaultBackend).toBe("openai");
    expect(config.logLevel).toBe("error");
  });

  it("should reject invalid backend type", () => {
    expect(() => ConfigSchema.parse({ defaultBackend: "invalid" })).toThrow();
  });

  it("should apply vectorMemory defaults", () => {
    const config = ConfigSchema.parse({});
    expect(config.vectorMemory.enabled).toBe(false);
    expect(config.vectorMemory.topK).toBe(5);
    expect(config.vectorMemory.embeddingModel).toBeUndefined();
  });

  it("should apply browserControl defaults", () => {
    const config = ConfigSchema.parse({});
    expect(config.browserControl.headless).toBe(true);
    expect(config.browserControl.timeout).toBe(30000);
  });

  it("should parse telegram config when provided", () => {
    const config = ConfigSchema.parse({ telegram: { botToken: "tok123" } });
    expect(config.telegram?.botToken).toBe("tok123");
  });

  it("should parse discord config when provided", () => {
    const config = ConfigSchema.parse({ discord: { botToken: "tok456", guildId: "g1" } });
    expect(config.discord?.botToken).toBe("tok456");
    expect(config.discord?.guildId).toBe("g1");
  });

  it("should parse slack config when provided", () => {
    const config = ConfigSchema.parse({
      slack: { botToken: "xoxb", appToken: "xapp", signingSecret: "sec" },
    });
    expect(config.slack?.botToken).toBe("xoxb");
    expect(config.slack?.appToken).toBe("xapp");
    expect(config.slack?.signingSecret).toBe("sec");
  });

  it("should load telegram token from env", () => {
    process.env.CLAW_TELEGRAM_TOKEN = "env-tok";
    const config = loadConfig();
    expect(config.telegram?.botToken).toBe("env-tok");
    delete process.env.CLAW_TELEGRAM_TOKEN;
  });
});
