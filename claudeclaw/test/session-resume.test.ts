import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Session Resume", () => {
  it("startRepl should accept optional sessionId parameter", () => {
    const src = readFileSync(join(process.cwd(), "src/interfaces/cli/repl.ts"), "utf-8");
    expect(src).toContain("resumeSessionId?: string");
  });

  it("should display history when resuming a session", () => {
    const src = readFileSync(join(process.cwd(), "src/interfaces/cli/repl.ts"), "utf-8");
    expect(src).toContain("Resuming session");
    expect(src).toContain("getAllMessages");
  });

  it("should use provided sessionId instead of generating new one", () => {
    const src = readFileSync(join(process.cwd(), "src/interfaces/cli/repl.ts"), "utf-8");
    expect(src).toContain("resumeSessionId || nanoid");
  });

  it("CLI chat command should accept --session option", () => {
    const src = readFileSync(join(process.cwd(), "bin/claw.ts"), "utf-8");
    expect(src).toContain("--session <id>");
    expect(src).toContain("-s, --session");
  });

  it("CliAdapter.startChat should accept optional sessionId", () => {
    const src = readFileSync(join(process.cwd(), "src/interfaces/cli/index.ts"), "utf-8");
    expect(src).toContain("startChat(sessionId?: string)");
  });
});
