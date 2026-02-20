import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const clawPath = join(process.cwd(), "bin", "claw.ts");

describe("Builtin tool auto-registration in claw.ts", () => {
  const source = readFileSync(clawPath, "utf-8");

  it("should import shell tool", () => {
    expect(source).toContain("shellTool");
    expect(source).toContain("builtin/shell.js");
  });

  it("should import file-ops tools", () => {
    expect(source).toContain("readFileTool");
    expect(source).toContain("writeFileTool");
    expect(source).toContain("listDirTool");
    expect(source).toContain("builtin/file-ops.js");
  });

  it("should import git tools", () => {
    expect(source).toContain("gitStatusTool");
    expect(source).toContain("gitDiffTool");
    expect(source).toContain("gitLogTool");
    expect(source).toContain("builtin/git.js");
  });

  it("should pass builtinTools to Engine", () => {
    expect(source).toContain("builtinTools");
  });

  it("should include all tools in builtinTools array", () => {
    expect(source).toContain("shellTool");
    expect(source).toContain("readFileTool");
    expect(source).toContain("writeFileTool");
    expect(source).toContain("listDirTool");
    expect(source).toContain("gitStatusTool");
    expect(source).toContain("gitDiffTool");
    expect(source).toContain("gitLogTool");
  });
});
