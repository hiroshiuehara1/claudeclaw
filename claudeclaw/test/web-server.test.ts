import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all web sub-modules before importing
vi.mock("../src/interfaces/web/routes.js", () => ({
  registerRoutes: vi.fn(),
}));
vi.mock("../src/interfaces/web/sse.js", () => ({
  registerSseRoutes: vi.fn(),
}));
vi.mock("../src/interfaces/web/sessions.js", () => ({
  registerSessionRoutes: vi.fn(),
}));
vi.mock("../src/interfaces/web/export.js", () => ({
  registerExportRoutes: vi.fn(),
}));
vi.mock("../src/interfaces/web/health.js", () => ({
  registerHealthRoutes: vi.fn(),
}));
vi.mock("../src/interfaces/web/api-info.js", () => ({
  registerApiInfoRoutes: vi.fn(),
}));
vi.mock("../src/interfaces/web/middleware/security.js", () => ({
  registerSecurity: vi.fn(),
}));
vi.mock("../src/interfaces/web/middleware/auth.js", () => ({
  createAuthHook: vi.fn(() => vi.fn()),
}));
vi.mock("../src/interfaces/web/middleware/request-logger.js", () => ({
  registerRequestLogger: vi.fn(),
}));
vi.mock("../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  createChildLogger: vi.fn(() => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  })),
}));

// Mock fastify and plugins
const mockFastify = {
  register: vi.fn().mockResolvedValue(undefined),
  addHook: vi.fn(),
  listen: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  post: vi.fn(),
};
vi.mock("fastify", () => ({
  default: vi.fn(() => mockFastify),
}));
vi.mock("@fastify/websocket", () => ({ default: "websocket-plugin" }));
vi.mock("@fastify/static", () => ({ default: "static-plugin" }));

import { WebAdapter } from "../src/interfaces/web/server.js";
import { registerRoutes } from "../src/interfaces/web/routes.js";
import { registerSseRoutes } from "../src/interfaces/web/sse.js";
import { registerSessionRoutes } from "../src/interfaces/web/sessions.js";
import { registerExportRoutes } from "../src/interfaces/web/export.js";
import { registerHealthRoutes } from "../src/interfaces/web/health.js";
import { registerApiInfoRoutes } from "../src/interfaces/web/api-info.js";
import { registerSecurity } from "../src/interfaces/web/middleware/security.js";
import { createAuthHook } from "../src/interfaces/web/middleware/auth.js";

function createMockEngine(apiKey?: string) {
  return {
    config: {
      web: {
        port: 3100,
        host: "127.0.0.1",
        apiKey,
        corsOrigins: ["http://localhost:3100"],
        rateLimitMax: 100,
        drainTimeout: 5000,
      },
    },
    getAvailableTools: vi.fn(() => []),
    getAvailableModels: vi.fn(() => []),
    getRegisteredSkills: vi.fn(() => []),
  } as any;
}

describe("WebAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call start and register all routes", async () => {
    const adapter = new WebAdapter();
    const engine = createMockEngine();

    await adapter.start(engine);

    expect(registerSecurity).toHaveBeenCalled();
    expect(registerHealthRoutes).toHaveBeenCalled();
    expect(registerRoutes).toHaveBeenCalled();
    expect(registerSseRoutes).toHaveBeenCalled();
    expect(registerSessionRoutes).toHaveBeenCalled();
    expect(registerExportRoutes).toHaveBeenCalled();
    expect(registerApiInfoRoutes).toHaveBeenCalled();
    expect(mockFastify.listen).toHaveBeenCalledWith({
      port: 3100,
      host: "127.0.0.1",
    });
  });

  it("should register websocket plugin", async () => {
    const adapter = new WebAdapter();
    const engine = createMockEngine();

    await adapter.start(engine);

    expect(mockFastify.register).toHaveBeenCalledWith("websocket-plugin");
  });

  it("should apply API key auth hook when configured", async () => {
    const adapter = new WebAdapter();
    const engine = createMockEngine("secret-key");

    await adapter.start(engine);

    expect(createAuthHook).toHaveBeenCalledWith("secret-key");
    expect(mockFastify.addHook).toHaveBeenCalledWith(
      "onRequest",
      expect.any(Function),
    );
  });

  it("should register draining hooks on start", async () => {
    const adapter = new WebAdapter();
    const engine = createMockEngine();

    await adapter.start(engine);

    // Should have onRequest and onResponse hooks for draining
    expect(mockFastify.addHook).toHaveBeenCalledWith("onRequest", expect.any(Function));
    expect(mockFastify.addHook).toHaveBeenCalledWith("onResponse", expect.any(Function));
  });

  it("should call stop() and close server", async () => {
    const adapter = new WebAdapter();
    const engine = createMockEngine();

    await adapter.start(engine);
    await adapter.stop();

    expect(mockFastify.close).toHaveBeenCalled();
  });
});
