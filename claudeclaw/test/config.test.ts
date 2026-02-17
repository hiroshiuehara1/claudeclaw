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
});
