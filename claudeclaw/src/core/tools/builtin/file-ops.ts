import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import type { ToolDefinition } from "../../backend/types.js";

export const readFileTool: ToolDefinition = {
  name: "read_file",
  description: "Read the contents of a file at the given path.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to the file to read" },
    },
    required: ["path"],
  },
  async execute(input: unknown): Promise<string> {
    const { path } = input as { path: string };
    const resolved = resolve(path);
    if (!existsSync(resolved)) return `Error: File not found: ${resolved}`;
    return readFileSync(resolved, "utf-8");
  },
};

export const writeFileTool: ToolDefinition = {
  name: "write_file",
  description: "Write content to a file at the given path. Creates the file if it doesn't exist.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to the file" },
      content: { type: "string", description: "Content to write" },
    },
    required: ["path", "content"],
  },
  async execute(input: unknown): Promise<string> {
    const { path, content } = input as { path: string; content: string };
    const resolved = resolve(path);
    writeFileSync(resolved, content, "utf-8");
    return `Written to ${resolved}`;
  },
};

export const listDirTool: ToolDefinition = {
  name: "list_directory",
  description: "List files and directories at the given path.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory path to list" },
    },
    required: ["path"],
  },
  async execute(input: unknown): Promise<string> {
    const { path } = input as { path: string };
    const resolved = resolve(path);
    if (!existsSync(resolved)) return `Error: Directory not found: ${resolved}`;
    const entries = readdirSync(resolved, { withFileTypes: true });
    return entries
      .map((e) => `${e.isDirectory() ? "d" : "f"} ${e.name}`)
      .join("\n");
  },
};
