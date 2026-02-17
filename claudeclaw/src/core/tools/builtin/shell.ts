import { execSync } from "node:child_process";
import type { ToolDefinition } from "../../backend/types.js";

export const shellTool: ToolDefinition = {
  name: "shell",
  description:
    "Execute a shell command and return its output. Use for system operations, git commands, package management, etc.",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The shell command to execute",
      },
      cwd: {
        type: "string",
        description: "Working directory (defaults to current directory)",
      },
    },
    required: ["command"],
  },
  async execute(input: unknown): Promise<string> {
    const { command, cwd } = input as { command: string; cwd?: string };
    try {
      const output = execSync(command, {
        cwd: cwd || process.cwd(),
        encoding: "utf-8",
        timeout: 30_000,
        maxBuffer: 1024 * 1024,
      });
      return output.trim() || "(no output)";
    } catch (err: unknown) {
      const e = err as { stderr?: string; message?: string };
      return `Error: ${e.stderr || e.message || String(err)}`;
    }
  },
};
