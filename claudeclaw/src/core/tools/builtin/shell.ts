import { execSync } from "node:child_process";
import type { ToolDefinition } from "../../backend/types.js";

const DENIED_PATTERNS: RegExp[] = [
  /\brm\s+(-\w*\s+)*-\w*r\w*f\w*\s+\//,       // rm -rf /
  /\brm\s+(-\w*\s+)*-\w*f\w*r\w*\s+\//,        // rm -fr /
  /\bmkfs\b/,                                     // mkfs
  /\bdd\b\s+.*\bof=/,                             // dd of=
  /:\(\)\s*\{\s*:\|:\s*&\s*\}\s*;?\s*:/,         // fork bomb
  />\s*\/dev\/sd[a-z]/,                           // > /dev/sda
  /\bchmod\s+(-\w+\s+)*777\s+\//,                // chmod 777 /
  /\bchown\s+(-\w+\s+)*.*\s+\//,                 // chown ... /
];

export function validateCommand(command: string): string | null {
  if (!command || !command.trim()) {
    return "Error: Command must be a non-empty string.";
  }
  for (const pattern of DENIED_PATTERNS) {
    if (pattern.test(command)) {
      return `Error: Blocked dangerous command pattern: "${command}"`;
    }
  }
  return null;
}

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
    const cmdError = validateCommand(command);
    if (cmdError) return cmdError;
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
