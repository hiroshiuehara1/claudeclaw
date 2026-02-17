import { execSync } from "node:child_process";
import type { ToolDefinition } from "../../backend/types.js";

function git(args: string, cwd?: string): string {
  try {
    return execSync(`git ${args}`, {
      cwd: cwd || process.cwd(),
      encoding: "utf-8",
      timeout: 15_000,
    }).trim();
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string };
    return `Error: ${e.stderr || e.message || String(err)}`;
  }
}

export const gitStatusTool: ToolDefinition = {
  name: "git_status",
  description: "Show the current git status of the working directory.",
  inputSchema: {
    type: "object",
    properties: {
      cwd: { type: "string", description: "Repository path" },
    },
  },
  async execute(input: unknown): Promise<string> {
    const { cwd } = (input || {}) as { cwd?: string };
    return git("status --short", cwd);
  },
};

export const gitDiffTool: ToolDefinition = {
  name: "git_diff",
  description: "Show git diff of working changes or between refs.",
  inputSchema: {
    type: "object",
    properties: {
      ref: { type: "string", description: "Optional ref to diff against" },
      staged: { type: "boolean", description: "Show staged changes only" },
      cwd: { type: "string", description: "Repository path" },
    },
  },
  async execute(input: unknown): Promise<string> {
    const { ref, staged, cwd } = (input || {}) as {
      ref?: string;
      staged?: boolean;
      cwd?: string;
    };
    const args = ["diff"];
    if (staged) args.push("--cached");
    if (ref) args.push(ref);
    return git(args.join(" "), cwd);
  },
};

export const gitLogTool: ToolDefinition = {
  name: "git_log",
  description: "Show recent git log entries.",
  inputSchema: {
    type: "object",
    properties: {
      count: { type: "number", description: "Number of entries (default 10)" },
      cwd: { type: "string", description: "Repository path" },
    },
  },
  async execute(input: unknown): Promise<string> {
    const { count, cwd } = (input || {}) as { count?: number; cwd?: string };
    return git(`log --oneline -n ${count || 10}`, cwd);
  },
};
