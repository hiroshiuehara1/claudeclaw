import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClaudeBackend } from "../src/core/backend/claude-backend.js";
import { BackendError } from "../src/utils/errors.js";

// Mock @anthropic-ai/sdk
vi.mock("@anthropic-ai/sdk", () => {
  const MockAnthropic = vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn(),
    },
  }));
  return { default: MockAnthropic };
});

// Mock logger
vi.mock("../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  createChildLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

function createMockStream(events: any[], finalMsg?: any) {
  const iter = {
    [Symbol.asyncIterator]: () => {
      let i = 0;
      return {
        async next() {
          if (i < events.length) return { value: events[i++], done: false };
          return { value: undefined, done: true };
        },
      };
    },
    finalMessage: vi.fn().mockResolvedValue(finalMsg || { content: [] }),
  };
  return iter;
}

async function collectEvents(gen: AsyncGenerator<any>): Promise<any[]> {
  const events: any[] = [];
  try {
    for await (const e of gen) events.push(e);
  } catch {
    // collect what we can
  }
  return events;
}

describe("ClaudeBackend", () => {
  let backend: ClaudeBackend;

  beforeEach(() => {
    vi.clearAllMocks();
    backend = new ClaudeBackend("test-api-key");
  });

  it("should set name to 'claude'", () => {
    expect(backend.name).toBe("claude");
  });

  it("should stream text from content_block_delta events", async () => {
    const stream = createMockStream([
      { type: "content_block_delta", delta: { text: "Hello" } },
      { type: "content_block_delta", delta: { text: " world" } },
    ]);

    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(stream);

    const events = await collectEvents(
      backend.query("test", {}),
    );

    expect(events).toContainEqual({ type: "text", text: "Hello" });
    expect(events).toContainEqual({ type: "text", text: " world" });
    expect(events).toContainEqual({ type: "done" });
  });

  it("should skip delta without text", async () => {
    const stream = createMockStream([
      { type: "content_block_delta", delta: { input_json_delta: "{}" } },
    ]);

    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(stream);

    const events = await collectEvents(backend.query("test", {}));

    const textEvents = events.filter((e: any) => e.type === "text");
    expect(textEvents).toHaveLength(0);
    expect(events).toContainEqual({ type: "done" });
  });

  it("should yield tool_use on content_block_start with tool_use type", async () => {
    const stream = createMockStream([
      {
        type: "content_block_start",
        content_block: { type: "tool_use", id: "tool-1", name: "read_file" },
      },
    ]);

    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(stream);

    const events = await collectEvents(backend.query("test", {}));

    expect(events).toContainEqual({
      type: "tool_use",
      toolCall: { id: "tool-1", name: "read_file", input: {} },
    });
  });

  it("should execute tools on message_stop and yield tool_result", async () => {
    const mockTool = {
      name: "read_file",
      description: "Read a file",
      inputSchema: {},
      execute: vi.fn().mockResolvedValue("file contents"),
    };

    const stream = createMockStream(
      [{ type: "message_stop" }],
      {
        content: [
          { type: "tool_use", id: "t1", name: "read_file", input: { path: "test.txt" } },
        ],
      },
    );

    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(stream);

    const events = await collectEvents(
      backend.query("test", { tools: [mockTool] }),
    );

    expect(mockTool.execute).toHaveBeenCalledWith({ path: "test.txt" });
    expect(events).toContainEqual({
      type: "tool_result",
      toolResult: { id: "t1", output: "file contents" },
    });
  });

  it("should yield tool_result with isError on tool execution failure", async () => {
    const mockTool = {
      name: "shell",
      description: "Run command",
      inputSchema: {},
      execute: vi.fn().mockRejectedValue(new Error("command failed")),
    };

    const stream = createMockStream(
      [{ type: "message_stop" }],
      {
        content: [
          { type: "tool_use", id: "t2", name: "shell", input: { command: "bad" } },
        ],
      },
    );

    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(stream);

    const events = await collectEvents(
      backend.query("test", { tools: [mockTool] }),
    );

    const toolResult = events.find(
      (e: any) => e.type === "tool_result" && e.toolResult?.isError,
    );
    expect(toolResult).toBeDefined();
    expect(toolResult.toolResult.isError).toBe(true);
    expect(toolResult.toolResult.output).toContain("command failed");
  });

  it("should handle stream error — yield error event and throw BackendError", async () => {
    const errorStream = {
      [Symbol.asyncIterator]: () => ({
        async next() {
          throw new Error("stream explosion");
        },
      }),
      finalMessage: vi.fn(),
    };

    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(errorStream);

    const events: any[] = [];
    try {
      for await (const e of backend.query("test", {})) {
        events.push(e);
      }
    } catch (err) {
      expect(err).toBeInstanceOf(BackendError);
      expect((err as Error).message).toContain("stream explosion");
    }

    expect(events).toContainEqual(
      expect.objectContaining({ type: "error", error: "stream explosion" }),
    );
  });

  it("should handle abort/interrupt — yield done and return", async () => {
    // Create a stream that checks abort signal
    const stream = createMockStream([
      { type: "content_block_delta", delta: { text: "start" } },
    ]);

    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(stream);

    // Start the query, then interrupt
    const gen = backend.query("test", {});

    // Get first event
    const first = await gen.next();
    expect(first.value?.type).toBe("text");

    // Interrupt
    await backend.interrupt();

    // Remaining events should end cleanly
    const remaining: any[] = [];
    for await (const e of gen) remaining.push(e);
    expect(remaining).toContainEqual({ type: "done" });
  });

  it("should handle abort during stream error — yield done without throwing", async () => {
    // Simulate a scenario where the stream throws but the abort signal is set
    const errorStream = {
      [Symbol.asyncIterator]: () => ({
        async next() {
          // Set aborted right before throwing (simulating concurrent abort + error)
          (backend as any).abortController?.abort();
          throw new Error("some error");
        },
      }),
      finalMessage: vi.fn(),
    };

    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(errorStream);

    const events = await collectEvents(backend.query("test", {}));
    // When aborted and error thrown, should yield done and return
    expect(events).toContainEqual({ type: "done" });
  });

  it("should use default model when not specified", async () => {
    const stream = createMockStream([]);
    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(stream);

    await collectEvents(backend.query("test", {}));

    expect(client.messages.stream).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-sonnet-4-20250514" }),
    );
  });

  it("should use specified model", async () => {
    const stream = createMockStream([]);
    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(stream);

    await collectEvents(backend.query("test", { model: "claude-opus-4-20250514" }));

    expect(client.messages.stream).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-4-20250514" }),
    );
  });

  describe("buildMessages", () => {
    it("should build messages with user prompt only", () => {
      const msgs = (backend as any).buildMessages("hello", undefined);
      expect(msgs).toEqual([{ role: "user", content: "hello" }]);
    });

    it("should build messages with history and user prompt", () => {
      const history = [
        { role: "user", content: "prev question" },
        { role: "assistant", content: "prev answer" },
      ];
      const msgs = (backend as any).buildMessages("new question", history);
      expect(msgs).toHaveLength(3);
      expect(msgs[0]).toEqual({ role: "user", content: "prev question" });
      expect(msgs[1]).toEqual({ role: "assistant", content: "prev answer" });
      expect(msgs[2]).toEqual({ role: "user", content: "new question" });
    });
  });

  it("should pass maxTokens and systemPrompt to stream call", async () => {
    const stream = createMockStream([]);
    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(stream);

    await collectEvents(
      backend.query("test", {
        maxTokens: 2048,
        systemPrompt: "Be helpful",
      }),
    );

    expect(client.messages.stream).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 2048,
        system: "Be helpful",
      }),
    );
  });

  it("should pass tools in Anthropic format", async () => {
    const stream = createMockStream([]);
    const client = (backend as any).client;
    client.messages.stream.mockReturnValue(stream);

    const tools = [
      {
        name: "my_tool",
        description: "A tool",
        inputSchema: { type: "object", properties: {} },
        execute: vi.fn(),
      },
    ];

    await collectEvents(backend.query("test", { tools }));

    expect(client.messages.stream).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [
          {
            name: "my_tool",
            description: "A tool",
            input_schema: { type: "object", properties: {} },
          },
        ],
      }),
    );
  });
});
