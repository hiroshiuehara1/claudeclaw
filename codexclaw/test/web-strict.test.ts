import net from "node:net";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { WebServer } from "../src/interfaces/web/server.js";
import type { AppConfig } from "../src/core/config.js";
import type { ChatService } from "../src/core/chat-service.js";
import type { ChatRequest, ChatResponse } from "../src/core/types.js";

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not resolve free port"));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

function makeConfig(port: number): AppConfig {
  return {
    dataDir: path.join(process.cwd(), ".codexclaw"),
    dbPath: path.join(process.cwd(), ".codexclaw", "memory.db"),
    publicDir: path.join(process.cwd(), "src/interfaces/web/public"),
    webHost: "127.0.0.1",
    webPort: port,
    defaultBackend: "auto",
    requestTimeoutMs: 90_000,
    maxOutputBytes: 1_000_000,
    breakerFailureThreshold: 3,
    breakerResetMs: 30_000,
    retryAttempts: 1,
    workspaceDir: process.cwd()
  };
}

function makeStubService(rawText = "**Returning exact OK**OK"): ChatService {
  const chat = vi.fn(async (_request: ChatRequest): Promise<ChatResponse> => {
    return {
      sessionId: "session-1",
      backend: "codex",
      text: rawText
    };
  });

  const stub = {
    chat,
    streamChat: vi.fn(async function* () {
      throw new Error("streamChat should not be called in strict mode tests");
    }),
    getHealth: () => ({
      status: "ok" as const,
      defaultBackend: "auto" as const,
      circuitBreakers: {
        codex: { state: "closed", failureCount: 0, openedAt: 0 },
        claude: { state: "closed", failureCount: 0, openedAt: 0 }
      }
    }),
    listSessions: () => [],
    listMessages: () => []
  };

  return stub as unknown as ChatService;
}

function parseSseEvents(raw: string): Array<Record<string, unknown>> {
  return raw
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => JSON.parse(line.slice(6)) as Record<string, unknown>);
}

function rawWsToString(raw: unknown): string {
  if (typeof raw === "string") {
    return raw;
  }
  if (Buffer.isBuffer(raw)) {
    return raw.toString("utf-8");
  }
  if (raw instanceof ArrayBuffer) {
    return Buffer.from(raw).toString("utf-8");
  }
  if (Array.isArray(raw)) {
    return Buffer.concat(raw.filter((value): value is Buffer => Buffer.isBuffer(value))).toString("utf-8");
  }
  return String(raw);
}

describe("Web strict mode", () => {
  it("normalizes strict JSON /api/chat responses", async () => {
    const port = await getFreePort();
    const web = new WebServer(makeConfig(port), makeStubService());
    await web.start();

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Reply with exactly OK",
          backend: "auto",
          strict: true
        })
      });

      expect(response.ok).toBe(true);
      const payload = (await response.json()) as { text: string };
      expect(payload.text).toBe("OK");
    } finally {
      await web.stop();
    }
  });

  it("emits normalized strict SSE event sequence", async () => {
    const port = await getFreePort();
    const web = new WebServer(makeConfig(port), makeStubService());
    await web.start();

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify({
          prompt: "Reply with exactly OK",
          backend: "auto",
          stream: true,
          strict: true
        })
      });

      expect(response.ok).toBe(true);
      const body = await response.text();
      const events = parseSseEvents(body);
      expect(events).toHaveLength(3);
      expect(events.map((event) => event.type)).toEqual([
        "response.start",
        "response.delta",
        "response.end"
      ]);
      expect(events[1].text).toBe("OK");
      expect(events[2].text).toBe("OK");
    } finally {
      await web.stop();
    }
  });

  it("emits normalized strict WebSocket event sequence", async () => {
    const port = await getFreePort();
    const web = new WebServer(makeConfig(port), makeStubService());
    await web.start();

    try {
      const wsModuleName = "ws";
      const wsModule = (await import(wsModuleName)) as {
        WebSocket?: new (url: string) => {
          on: (event: string, listener: (...args: any[]) => void) => void;
          send: (value: string) => void;
          close: () => void;
        };
        default?: new (url: string) => {
          on: (event: string, listener: (...args: any[]) => void) => void;
          send: (value: string) => void;
          close: () => void;
        };
      };
      const WebSocketCtor = wsModule.WebSocket || wsModule.default;
      if (!WebSocketCtor) {
        throw new Error("WebSocket client constructor is unavailable");
      }

      const messages: Array<Record<string, unknown>> = [];

      await new Promise<void>((resolve, reject) => {
        const socket = new WebSocketCtor(`ws://127.0.0.1:${port}/api/chat/ws`);
        let settled = false;

        const finish = (next: () => void): void => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timeout);
          next();
        };

        const timeout = setTimeout(() => {
          finish(() => {
            socket.close();
            reject(new Error(`Timed out waiting for WebSocket events: ${JSON.stringify(messages)}`));
          });
        }, 8_000);

        socket.on("open", () => {
          socket.send(
            JSON.stringify({
              prompt: "Reply with exactly OK",
              backend: "auto",
              strict: true
            })
          );
        });

        socket.on("message", (raw: unknown) => {
          messages.push(JSON.parse(rawWsToString(raw)) as Record<string, unknown>);
          const latest = messages[messages.length - 1];
          if (latest.type === "response.error") {
            finish(() => {
              socket.close();
              reject(new Error(`WebSocket returned response.error: ${JSON.stringify(latest)}`));
            });
            return;
          }
          if (latest.type === "response.end") {
            finish(() => {
              socket.close();
              resolve();
            });
          }
        });

        socket.on("error", (error: unknown) => {
          finish(() => {
            reject(error instanceof Error ? error : new Error(String(error)));
          });
        });

        socket.on("close", () => {
          if (settled) {
            return;
          }
          finish(() => {
            reject(
              new Error(`WebSocket closed before terminal event; received: ${JSON.stringify(messages)}`)
            );
          });
        });
      });

      expect(messages.length).toBeGreaterThanOrEqual(3);
      expect(messages.map((event) => event.type)).toEqual([
        "response.start",
        "response.delta",
        "response.end"
      ]);
      expect(messages[1].text).toBe("OK");
      expect(messages[2].text).toBe("OK");
    } finally {
      await web.stop();
    }
  });
});
