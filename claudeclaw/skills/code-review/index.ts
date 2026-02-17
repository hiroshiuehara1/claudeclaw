import { defineSkill } from "../../src/core/skill/types.js";
import { readFileTool, listDirTool } from "../../src/core/tools/builtin/file-ops.js";
import { gitDiffTool } from "../../src/core/tools/builtin/git.js";

export default defineSkill(
  {
    name: "code-review",
    version: "0.1.0",
    description: "Code review — read files, review diffs, provide feedback",
    permissions: ["fs:read"],
    systemPromptFragment: `You have code review tools. When reviewing code, read the relevant files and diffs, then provide constructive feedback on code quality, potential bugs, and improvements.`,
  },
  [readFileTool, listDirTool, gitDiffTool],
);
