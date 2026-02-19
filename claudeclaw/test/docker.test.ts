import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

describe("Docker deployment files", () => {
  it("docker-compose.yml should exist and be valid YAML", () => {
    const composePath = join(ROOT, "docker-compose.yml");
    expect(existsSync(composePath)).toBe(true);

    const content = readFileSync(composePath, "utf-8");
    // Basic YAML structure checks
    expect(content).toContain("services:");
    expect(content).toContain("claudeclaw:");
    expect(content).toContain("volumes:");
    expect(content).toContain("healthcheck:");
    expect(content).toContain("ports:");
  });

  it("docker-compose.yml should map port 3100", () => {
    const content = readFileSync(join(ROOT, "docker-compose.yml"), "utf-8");
    expect(content).toContain("3100:3100");
  });

  it("docker-compose.yml should mount data volume", () => {
    const content = readFileSync(join(ROOT, "docker-compose.yml"), "utf-8");
    expect(content).toContain("claw-data:/data");
  });

  it(".env.example should exist and contain required variables", () => {
    const envPath = join(ROOT, ".env.example");
    expect(existsSync(envPath)).toBe(true);

    const content = readFileSync(envPath, "utf-8");
    expect(content).toContain("ANTHROPIC_API_KEY");
    expect(content).toContain("OPENAI_API_KEY");
    expect(content).toContain("CLAW_DEFAULT_BACKEND");
    expect(content).toContain("CLAW_DATA_DIR");
    expect(content).toContain("CLAW_LOG_LEVEL");
    expect(content).toContain("CLAW_WEB_PORT");
    expect(content).toContain("CLAW_WEB_API_KEY");
  });

  it("Dockerfile should exist and have HEALTHCHECK", () => {
    const dockerfilePath = join(ROOT, "Dockerfile");
    expect(existsSync(dockerfilePath)).toBe(true);

    const content = readFileSync(dockerfilePath, "utf-8");
    expect(content).toContain("HEALTHCHECK");
    expect(content).toContain("EXPOSE 3100");
    expect(content).toContain("FROM node:20-alpine");
  });
});
