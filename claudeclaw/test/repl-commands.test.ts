import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const replPath = join(process.cwd(), "src", "interfaces", "cli", "repl.ts");

describe("REPL slash commands", () => {
  const replSource = readFileSync(replPath, "utf-8");

  it("should have /help command", () => {
    expect(replSource).toContain('case "/help"');
    expect(replSource).toContain("printHelp()");
  });

  it("should have /clear command", () => {
    expect(replSource).toContain('case "/clear"');
    expect(replSource).toContain("console.clear()");
  });

  it("should have /session command", () => {
    expect(replSource).toContain('case "/session"');
    expect(replSource).toContain("Session ID:");
  });

  it("should have /new command", () => {
    expect(replSource).toContain('case "/new"');
    expect(replSource).toContain("New session:");
  });

  it("should have /backend command", () => {
    expect(replSource).toContain('case "/backend"');
    expect(replSource).toContain("currentBackend");
  });

  it("should have /model command", () => {
    expect(replSource).toContain('case "/model"');
    expect(replSource).toContain("getAvailableModels");
  });

  it("should have /tools command", () => {
    expect(replSource).toContain('case "/tools"');
    expect(replSource).toContain("getAvailableTools");
  });

  it("should have /skills command", () => {
    expect(replSource).toContain('case "/skills"');
    expect(replSource).toContain("getRegisteredSkills");
  });

  it("should have /quit and /exit commands", () => {
    expect(replSource).toContain('case "/quit"');
    expect(replSource).toContain('case "/exit"');
  });

  it("should handle unknown commands", () => {
    expect(replSource).toContain("Unknown command:");
  });
});
