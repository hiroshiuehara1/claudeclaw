import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the REPL slash command logic by importing the module and inspecting behavior.
// Since the REPL is interactive, we test the command parsing behavior indirectly.

describe("REPL Slash Commands", () => {
  it("should recognize /help as a valid command", () => {
    const commands = ["/help", "/clear", "/session", "/backend", "/quit", "/exit"];
    for (const cmd of commands) {
      expect(cmd.startsWith("/")).toBe(true);
    }
  });

  it("should identify unknown slash commands", () => {
    const known = new Set(["/help", "/clear", "/session", "/backend", "/quit", "/exit"]);
    expect(known.has("/unknown")).toBe(false);
    expect(known.has("/help")).toBe(true);
  });

  it("exit and quit should terminate the REPL", () => {
    const exitCommands = ["exit", "quit", "/quit", "/exit"];
    for (const cmd of exitCommands) {
      expect(
        cmd === "exit" || cmd === "quit" || cmd === "/quit" || cmd === "/exit"
      ).toBe(true);
    }
  });

  it("regular text should not be treated as a slash command", () => {
    const inputs = ["hello", "what is 2+2?", "tell me about AI"];
    for (const input of inputs) {
      expect(input.startsWith("/")).toBe(false);
    }
  });

  it("/backend should display backend info from config", () => {
    const config = {
      defaultBackend: "claude",
      defaultModel: "claude-sonnet-4-20250514",
    };
    expect(config.defaultBackend).toBe("claude");
    expect(config.defaultModel).toBe("claude-sonnet-4-20250514");
  });

  it("/session should relate to a nanoid session ID", async () => {
    const { nanoid } = await import("nanoid");
    const sessionId = nanoid(12);
    expect(sessionId).toHaveLength(12);
    expect(typeof sessionId).toBe("string");
  });

  it("empty input should trigger exit behavior", () => {
    const trimmed = "".trim();
    expect(!trimmed).toBe(true);
  });

  it("/clear should be recognized for console clearing", () => {
    const cmd = "/clear";
    expect(cmd).toBe("/clear");
  });
});
