import { parseModelOutputLine } from "./line-parser.js";
import { spawnStreamLines } from "../process/spawn-stream.js";
import type { BackendAdapter, BackendInvokeRequest, BackendStreamEvent } from "./types.js";

export class CodexAdapter implements BackendAdapter {
  readonly name = "codex" as const;

  async *invoke(request: BackendInvokeRequest): AsyncGenerator<BackendStreamEvent> {
    const args = [
      "exec",
      "--json",
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "-C",
      request.workspaceDir,
      request.prompt
    ];

    for await (const line of spawnStreamLines({
      backend: this.name,
      command: "codex",
      args,
      cwd: request.workspaceDir,
      timeoutMs: request.timeoutMs,
      maxOutputBytes: request.maxOutputBytes,
      abortSignal: request.abortSignal
    })) {
      if (line.source !== "stdout") {
        continue;
      }
      const fragments = parseModelOutputLine(line.line);
      for (const fragment of fragments) {
        yield {
          type: "delta",
          text: fragment
        };
      }
    }
  }
}
