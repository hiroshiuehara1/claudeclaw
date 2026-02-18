import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { ChatService } from "../src/core/chat-service.js";
import type { BackendAdapter, BackendInvokeRequest, BackendStreamEvent } from "../src/core/adapters/types.js";
import { BackendInvocationError } from "../src/core/adapters/errors.js";
import { SqliteStore } from "../src/core/session/sqlite-store.js";
import type { AppConfig } from "../src/core/config.js";

class StubAdapter implements BackendAdapter {
  constructor(
    public readonly name: "codex" | "claude",
    private readonly run: (request: BackendInvokeRequest) => AsyncGenerator<BackendStreamEvent>
  ) {}

  invoke(request: BackendInvokeRequest): AsyncGenerator<BackendStreamEvent> {
    return this.run(request);
  }
}

function makeConfig(dbPath: string): AppConfig {
  return {
    dataDir: path.dirname(dbPath),
    dbPath,
    publicDir: path.join(process.cwd(), "src/interfaces/web/public"),
    webHost: "127.0.0.1",
    webPort: 3180,
    defaultBackend: "auto",
    requestTimeoutMs: 2000,
    maxOutputBytes: 100000,
    breakerFailureThreshold: 2,
    breakerResetMs: 500,
    retryAttempts: 1,
    workspaceDir: process.cwd()
  };
}

function tempDbPath(name: string): string {
  const dir = path.join(os.tmpdir(), "codexclaw-tests");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
}

describe("ChatService", () => {
  it("falls back to claude when codex fails in auto mode", async () => {
    const dbPath = tempDbPath("fallback");
    const store = new SqliteStore(dbPath);

    const codex = new StubAdapter("codex", async function* () {
      throw new BackendInvocationError("codex unavailable", {
        backend: "codex",
        code: "PROCESS_EXIT_NON_ZERO",
        transient: true
      });
    });

    const claude = new StubAdapter("claude", async function* () {
      yield { type: "delta", text: "hello from claude" };
    });

    const service = new ChatService(makeConfig(dbPath), store, { codex, claude });
    const result = await service.chat({ prompt: "hi", backend: "auto" });

    expect(result.backend).toBe("claude");
    expect(result.text).toContain("hello from claude");
    store.close();
  });

  it("throws for explicit backend failures", async () => {
    const dbPath = tempDbPath("explicit");
    const store = new SqliteStore(dbPath);

    const codex = new StubAdapter("codex", async function* () {
      throw new BackendInvocationError("missing codex", {
        backend: "codex",
        code: "COMMAND_NOT_FOUND",
        transient: false
      });
    });

    const claude = new StubAdapter("claude", async function* () {
      yield { type: "delta", text: "unused" };
    });

    const service = new ChatService(makeConfig(dbPath), store, { codex, claude });

    await expect(service.chat({ prompt: "hi", backend: "codex" })).rejects.toThrow("missing codex");
    store.close();
  });
});
