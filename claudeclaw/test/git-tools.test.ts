import { describe, it, expect } from "vitest";
import { gitStatusTool, gitDiffTool, gitLogTool } from "../src/core/tools/builtin/git.js";
import { shellTool } from "../src/core/tools/builtin/shell.js";

describe("Git tools", () => {
  it("git_status should return status output", async () => {
    const result = await gitStatusTool.execute({});
    expect(typeof result).toBe("string");
  });

  it("git_status should accept cwd parameter", async () => {
    const result = await gitStatusTool.execute({ cwd: process.cwd() });
    expect(typeof result).toBe("string");
  });

  it("git_diff should return diff output", async () => {
    const result = await gitDiffTool.execute({});
    expect(typeof result).toBe("string");
  });

  it("git_diff should handle staged flag", async () => {
    const result = await gitDiffTool.execute({ staged: true });
    expect(typeof result).toBe("string");
  });

  it("git_diff should handle ref parameter", async () => {
    const result = await gitDiffTool.execute({ ref: "HEAD" });
    expect(typeof result).toBe("string");
  });

  it("git_log should return log entries", async () => {
    const result = await gitLogTool.execute({});
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("git_log should accept count parameter", async () => {
    const result = await gitLogTool.execute({ count: 3 });
    expect(typeof result).toBe("string");
  });

  it("git_status should handle invalid cwd gracefully", async () => {
    const result = await gitStatusTool.execute({ cwd: "/nonexistent/path" });
    expect(result).toContain("Error");
  });
});

describe("Shell tool", () => {
  it("should execute simple commands", async () => {
    const result = await shellTool.execute({ command: "echo hello" });
    expect(result).toBe("hello");
  });

  it("should return '(no output)' for empty output", async () => {
    const result = await shellTool.execute({ command: "true" });
    expect(result).toBe("(no output)");
  });

  it("should handle errors gracefully", async () => {
    const result = await shellTool.execute({ command: "ls /nonexistent_dir_xyz" });
    expect(result).toContain("Error");
  });

  it("should accept cwd parameter", async () => {
    const result = await shellTool.execute({ command: "pwd", cwd: "/tmp" });
    expect(result).toContain("tmp");
  });
});
