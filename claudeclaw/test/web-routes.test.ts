import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerRoutes } from "../src/interfaces/web/routes.js";

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "mock-session-id"),
}));

// Mock logger
vi.mock("../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  createChildLogger: vi.fn(() => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  })),
}));

function createMockEngine(events: any[] = []) {
  return {
    chat: vi.fn(async function* () {
      for (const e of events) yield e;
    }),
    config: { defaultBackend: "claude" },
  } as any;
}

function createMockApp() {
  const routes: Record<string, any> = {};
  const app = {
    post: vi.fn((path: string, handler: any) => {
      routes[`POST ${path}`] = handler;
    }),
    register: vi.fn(async (plugin: any) => {
      // Call the plugin with a mock fastify that captures the WS route
      const inner = {
        get: vi.fn((path: string, opts: any, handler: any) => {
          routes[`WS ${path}`] = handler;
        }),
      };
      await plugin(inner);
    }),
  };
  return { app, routes };
}

describe("Web Routes", () => {
  let engine: any;
  let app: any;
  let routes: Record<string, any>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/chat", () => {
    it("should return text response on success", async () => {
      engine = createMockEngine([
        { type: "text", text: "Hello " },
        { type: "text", text: "world" },
        { type: "done" },
      ]);
      ({ app, routes } = createMockApp());
      registerRoutes(app as any, engine);

      const handler = routes["POST /api/chat"];
      const request = { body: { prompt: "hi" } };
      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      const result = await handler(request, reply);
      expect(result).toEqual({
        sessionId: "mock-session-id",
        text: "Hello world",
      });
    });

    it("should return 400 for missing prompt", async () => {
      engine = createMockEngine([]);
      ({ app, routes } = createMockApp());
      registerRoutes(app as any, engine);

      const handler = routes["POST /api/chat"];
      const request = { body: {} };
      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      };

      await handler(request, reply);
      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid request" }),
      );
    });

    it("should return 500 when engine yields error event", async () => {
      engine = createMockEngine([
        { type: "error", error: "Backend failed" },
      ]);
      ({ app, routes } = createMockApp());
      registerRoutes(app as any, engine);

      const handler = routes["POST /api/chat"];
      const request = { body: { prompt: "test" } };
      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      };

      await handler(request, reply);
      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({ error: "Backend failed" });
    });

    it("should use provided sessionId", async () => {
      engine = createMockEngine([{ type: "done" }]);
      ({ app, routes } = createMockApp());
      registerRoutes(app as any, engine);

      const handler = routes["POST /api/chat"];
      const request = { body: { prompt: "test", sessionId: "custom-id" } };
      const reply = { status: vi.fn().mockReturnThis(), send: vi.fn() };

      const result = await handler(request, reply);
      expect(result.sessionId).toBe("custom-id");
    });
  });

  describe("WebSocket /api/chat/ws", () => {
    it("should stream events back to socket", async () => {
      engine = createMockEngine([
        { type: "text", text: "hi" },
        { type: "done" },
      ]);
      ({ app, routes } = createMockApp());
      registerRoutes(app as any, engine);

      const wsHandler = routes["WS /api/chat/ws"];
      const sent: string[] = [];
      const socket = {
        on: vi.fn(),
        send: vi.fn((data: string) => sent.push(data)),
      };

      wsHandler(socket, {});

      // Get the message handler
      const messageHandler = socket.on.mock.calls.find(
        (c: any) => c[0] === "message",
      )?.[1];
      expect(messageHandler).toBeDefined();

      // Send a valid message
      await messageHandler(Buffer.from(JSON.stringify({ prompt: "hello" })));

      expect(sent.length).toBeGreaterThanOrEqual(1);
      const parsed = sent.map((s) => JSON.parse(s));
      expect(parsed).toContainEqual({ type: "text", text: "hi" });
      expect(parsed).toContainEqual({ type: "done" });
    });

    it("should handle invalid JSON", async () => {
      engine = createMockEngine([]);
      ({ app, routes } = createMockApp());
      registerRoutes(app as any, engine);

      const wsHandler = routes["WS /api/chat/ws"];
      const sent: string[] = [];
      const socket = {
        on: vi.fn(),
        send: vi.fn((data: string) => sent.push(data)),
      };

      wsHandler(socket, {});
      const messageHandler = socket.on.mock.calls.find(
        (c: any) => c[0] === "message",
      )?.[1];

      await messageHandler(Buffer.from("not json{{{"));

      const parsed = JSON.parse(sent[0]);
      expect(parsed.type).toBe("error");
      expect(parsed.error).toBe("Invalid JSON");
    });

    it("should handle invalid message format", async () => {
      engine = createMockEngine([]);
      ({ app, routes } = createMockApp());
      registerRoutes(app as any, engine);

      const wsHandler = routes["WS /api/chat/ws"];
      const sent: string[] = [];
      const socket = {
        on: vi.fn(),
        send: vi.fn((data: string) => sent.push(data)),
      };

      wsHandler(socket, {});
      const messageHandler = socket.on.mock.calls.find(
        (c: any) => c[0] === "message",
      )?.[1];

      // Valid JSON but missing prompt
      await messageHandler(Buffer.from(JSON.stringify({ model: "gpt-4o" })));

      const parsed = JSON.parse(sent[0]);
      expect(parsed.type).toBe("error");
      expect(parsed.error).toBe("Invalid message format");
    });

    it("should pass sessionId from client", async () => {
      engine = createMockEngine([{ type: "done" }]);
      ({ app, routes } = createMockApp());
      registerRoutes(app as any, engine);

      const wsHandler = routes["WS /api/chat/ws"];
      const socket = {
        on: vi.fn(),
        send: vi.fn(),
      };

      wsHandler(socket, {});
      const messageHandler = socket.on.mock.calls.find(
        (c: any) => c[0] === "message",
      )?.[1];

      await messageHandler(
        Buffer.from(JSON.stringify({ prompt: "test", sessionId: "ws-sess" })),
      );

      expect(engine.chat).toHaveBeenCalledWith("test", "ws-sess", { model: undefined });
    });

    it("should send error on engine exception", async () => {
      engine = {
        chat: vi.fn(async function* () {
          throw new Error("engine boom");
        }),
        config: { defaultBackend: "claude" },
      } as any;
      ({ app, routes } = createMockApp());
      registerRoutes(app as any, engine);

      const wsHandler = routes["WS /api/chat/ws"];
      const sent: string[] = [];
      const socket = {
        on: vi.fn(),
        send: vi.fn((data: string) => sent.push(data)),
      };

      wsHandler(socket, {});
      const messageHandler = socket.on.mock.calls.find(
        (c: any) => c[0] === "message",
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({ prompt: "test" })));

      const errors = sent.map((s) => JSON.parse(s)).filter((e) => e.type === "error");
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0].error).toBe("engine boom");
    });
  });
});
