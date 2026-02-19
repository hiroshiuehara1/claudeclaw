import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  getConfigPath,
  readRawConfig,
  writeConfigValue,
  redactConfig,
} from "../src/core/config/config-writer.js";
import type { Config } from "../src/core/config/schema.js";

describe("Config Writer", () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), "claw-config-test-"));
  });

  afterEach(() => {
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("getConfigPath returns correct path", () => {
    expect(getConfigPath(dataDir)).toBe(join(dataDir, "config.json"));
  });

  it("readRawConfig returns empty object when no file exists", () => {
    expect(readRawConfig(dataDir)).toEqual({});
  });

  it("writeConfigValue creates config file and writes simple key", () => {
    writeConfigValue(dataDir, "logLevel", "debug");
    const config = readRawConfig(dataDir);
    expect(config.logLevel).toBe("debug");
  });

  it("writeConfigValue supports dotted keys", () => {
    writeConfigValue(dataDir, "web.port", "4000");
    const config = readRawConfig(dataDir);
    expect((config.web as any).port).toBe(4000);
  });

  it("writeConfigValue converts booleans and numbers", () => {
    writeConfigValue(dataDir, "vectorMemory.enabled", "true");
    writeConfigValue(dataDir, "web.rateLimitMax", "200");
    const config = readRawConfig(dataDir);
    expect((config.vectorMemory as any).enabled).toBe(true);
    expect((config.web as any).rateLimitMax).toBe(200);
  });

  it("redactConfig masks secret values", () => {
    const config = {
      anthropicApiKey: "sk-ant-secret-key-12345",
      openaiApiKey: "sk-proj-secret-key-12345",
      dataDir: "/home/user/.claudeclaw",
      defaultBackend: "claude",
      logLevel: "info",
      web: {
        port: 3100,
        host: "127.0.0.1",
        apiKey: "my-api-key-secret",
        corsOrigins: [],
        rateLimitMax: 100,
        drainTimeout: 5000,
      },
      engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000, sessionTtlHours: 168 },
      skills: [],
      vectorMemory: { enabled: false, topK: 5 },
      browserControl: { headless: true, timeout: 30000 },
    } as unknown as Config;

    const redacted = redactConfig(config);
    expect(redacted.anthropicApiKey).toBe("sk-a****");
    expect(redacted.openaiApiKey).toBe("sk-p****");
    expect((redacted.web as any).apiKey).toBe("my-a****");
    expect(redacted.dataDir).toBe("/home/user/.claudeclaw");
  });
});
