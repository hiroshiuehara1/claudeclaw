import { describe, it, expect } from "vitest";
import { validatePath, readFileTool, writeFileTool, listDirTool } from "../src/core/tools/builtin/file-ops.js";
import { validateCommand, shellTool } from "../src/core/tools/builtin/shell.js";

describe("File-ops path traversal protection", () => {
  it("should reject ../../../etc/passwd", () => {
    const err = validatePath("../../../etc/passwd");
    expect(err).toContain("Path traversal blocked");
  });

  it("should reject absolute paths outside cwd", () => {
    const err = validatePath("/etc/shadow");
    expect(err).toContain("Path traversal blocked");
  });

  it("should allow ./safe/file.txt", () => {
    const err = validatePath("./safe/file.txt");
    expect(err).toBeNull();
  });

  it("should allow relative paths within cwd", () => {
    const err = validatePath("src/index.ts");
    expect(err).toBeNull();
  });

  it("read_file should return error for path traversal", async () => {
    const result = await readFileTool.execute({ path: "../../../etc/passwd" });
    expect(result).toContain("Path traversal blocked");
  });

  it("write_file should return error for path traversal", async () => {
    const result = await writeFileTool.execute({
      path: "/etc/malicious",
      content: "bad",
    });
    expect(result).toContain("Path traversal blocked");
  });

  it("list_directory should return error for path traversal", async () => {
    const result = await listDirTool.execute({ path: "../../../" });
    expect(result).toContain("Path traversal blocked");
  });
});

describe("Shell command deny list", () => {
  it("should block rm -rf /", () => {
    const err = validateCommand("rm -rf /");
    expect(err).toContain("Blocked dangerous command");
  });

  it("should block rm -fr /", () => {
    const err = validateCommand("rm -fr /");
    expect(err).toContain("Blocked dangerous command");
  });

  it("should block mkfs", () => {
    const err = validateCommand("mkfs.ext4 /dev/sda1");
    expect(err).toContain("Blocked dangerous command");
  });

  it("should block dd of=", () => {
    const err = validateCommand("dd if=/dev/zero of=/dev/sda");
    expect(err).toContain("Blocked dangerous command");
  });

  it("should block > /dev/sda", () => {
    const err = validateCommand("echo bad > /dev/sda");
    expect(err).toContain("Blocked dangerous command");
  });

  it("should allow safe commands", () => {
    expect(validateCommand("ls -la")).toBeNull();
    expect(validateCommand("git status")).toBeNull();
    expect(validateCommand("npm test")).toBeNull();
    expect(validateCommand("echo hello")).toBeNull();
  });

  it("should reject empty command", () => {
    const err = validateCommand("");
    expect(err).toContain("non-empty");
  });

  it("should reject whitespace-only command", () => {
    const err = validateCommand("   ");
    expect(err).toContain("non-empty");
  });

  it("shell tool should return error for denied commands", async () => {
    const result = await shellTool.execute({ command: "rm -rf /" });
    expect(result).toContain("Blocked dangerous command");
  });

  it("shell tool should return error for empty command", async () => {
    const result = await shellTool.execute({ command: "" });
    expect(result).toContain("non-empty");
  });
});
