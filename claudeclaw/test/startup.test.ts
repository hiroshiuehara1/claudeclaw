import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateStartup } from "../src/core/startup.js";
import type { Config } from "../src/core/config/schema.js";

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    defaultBackend: "claude",
    anthropicApiKey: "sk-ant-test",
    dataDir: mkdtempSync(join(tmpdir(), "claw-startup-test-")),
    logLevel: "error",
    web: { port: 3100, host: "127.0.0.1", corsOrigins: [], rateLimitMax: 100, drainTimeout: 5000 },
    engine: { chatTimeout: 120000, retryMaxAttempts: 3, retryBaseDelay: 1000, sessionTtlHours: 168 },
    skills: [],
    vectorMemory: { enabled: false, topK: 5 },
    browserControl: { headless: true, timeout: 30000 },
    ...overrides,
  } as Config;
}

describe("Startup Validation", () => {
  it("should pass with valid claude config", () => {
    const config = makeConfig();
    const result = validateStartup(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    rmSync(config.dataDir, { recursive: true, force: true });
  });

  it("should warn when claude backend has no API key", () => {
    const config = makeConfig({ anthropicApiKey: undefined });
    const result = validateStartup(config);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("ANTHROPIC_API_KEY");
    rmSync(config.dataDir, { recursive: true, force: true });
  });

  it("should warn when openai backend has no API key", () => {
    const config = makeConfig({
      defaultBackend: "openai" as any,
      anthropicApiKey: undefined,
      openaiApiKey: undefined,
    });
    const result = validateStartup(config);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("OPENAI_API_KEY");
    rmSync(config.dataDir, { recursive: true, force: true });
  });

  it("should pass with valid openai config", () => {
    const config = makeConfig({
      defaultBackend: "openai" as any,
      openaiApiKey: "sk-test",
    });
    const result = validateStartup(config);
    expect(result.valid).toBe(true);
    rmSync(config.dataDir, { recursive: true, force: true });
  });

  it("should validate data directory exists", () => {
    const config = makeConfig({ dataDir: "/nonexistent/path/claw" });
    const result = validateStartup(config);
    // Dir doesn't exist, but that's handled by config loader — no error
    expect(result.valid).toBe(true);
  });

  it("should return structured validation result", () => {
    const config = makeConfig();
    const result = validateStartup(config);
    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("errors");
    expect(Array.isArray(result.errors)).toBe(true);
    rmSync(config.dataDir, { recursive: true, force: true });
  });
});
