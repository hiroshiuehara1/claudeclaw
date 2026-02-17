import { describe, it, expect } from "vitest";
import { readFileTool, listDirTool } from "../src/core/tools/builtin/file-ops.js";
import { ToolRegistry } from "../src/core/tools/tool-registry.js";

describe("Built-in tools", () => {
  it("read_file should return file contents", async () => {
    const result = await readFileTool.execute({ path: "package.json" });
    expect(result).toContain("claudeclaw");
  });

  it("read_file should handle missing files", async () => {
    const result = await readFileTool.execute({ path: "/nonexistent/file.txt" });
    expect(result).toContain("Error");
  });

  it("list_directory should list directory contents", async () => {
    const result = await listDirTool.execute({ path: "." });
    expect(result).toContain("package.json");
  });
});

describe("ToolRegistry", () => {
  it("should register and retrieve tools", () => {
    const registry = new ToolRegistry();
    registry.register(readFileTool);
    expect(registry.has("read_file")).toBe(true);
    expect(registry.get("read_file")).toBe(readFileTool);
    expect(registry.getAll()).toHaveLength(1);
  });
});
