import { describe, it, expect } from "vitest";
import { createBackend } from "../src/core/backend/backend-factory.js";
import type { Config } from "../src/core/config/schema.js";

const baseConfig: Config = {
  defaultBackend: "claude",
  dataDir: "/tmp",
  logLevel: "error",
  web: { port: 3100, host: "127.0.0.1" },
  skills: [],
};

describe("createBackend", () => {
  it("should create claude backend when api key provided", () => {
    const backend = createBackend({
      ...baseConfig,
      anthropicApiKey: "test-key",
    });
    expect(backend.name).toBe("claude");
  });

  it("should create openai backend when api key provided", () => {
    const backend = createBackend(
      { ...baseConfig, openaiApiKey: "test-key" },
      "openai",
    );
    expect(backend.name).toBe("openai");
  });

  it("should throw when claude api key missing", () => {
    expect(() => createBackend(baseConfig)).toThrow("ANTHROPIC_API_KEY");
  });

  it("should throw when openai api key missing", () => {
    expect(() => createBackend(baseConfig, "openai")).toThrow("OPENAI_API_KEY");
  });
});
