import { defineSkill } from "../../src/core/skill/types.js";
import { gitStatusTool, gitDiffTool, gitLogTool } from "../../src/core/tools/builtin/git.js";
import { shellTool } from "../../src/core/tools/builtin/shell.js";

export default defineSkill(
  {
    name: "git-workflow",
    version: "0.1.0",
    description: "Git operations — status, diff, log, commit, branch management",
    permissions: ["shell"],
    systemPromptFragment: `You have access to git tools. Use them to help the user with version control tasks like checking status, reviewing diffs, committing changes, and managing branches.`,
  },
  [gitStatusTool, gitDiffTool, gitLogTool, shellTool],
);
