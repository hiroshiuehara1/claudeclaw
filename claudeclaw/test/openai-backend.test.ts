import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIBackend } from "../src/core/backend/openai-backend.js";
import { BackendError } from "../src/utils/errors.js";

// Mock openai
vi.mock("openai", () => {
  const MockOpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  }));
  return { default: MockOpenAI };
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

function createMockChunks(chunks: any[]) {
  return {
    [Symbol.asyncIterator]: () => {
      let i = 0;
      return {
        async next() {
          if (i < chunks.length) return { value: chunks[i++], done: false };
          return { value: undefined, done: true };
        },
      };
    },
  };
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

describe("OpenAIBackend", () => {
  let backend: OpenAIBackend;

  beforeEach(() => {
    vi.clearAllMocks();
    backend = new OpenAIBackend("test-api-key");
  });

  it("should set name to 'openai'", () => {
    expect(backend.name).toBe("openai");
  });

  it("should stream text from delta.content", async () => {
    const chunks = createMockChunks([
      { choices: [{ delta: { content: "Hello" } }] },
      { choices: [{ delta: { content: " world" } }] },
    ]);

    const client = (backend as any).client;
    client.chat.completions.create.mockResolvedValue(chunks);

    const events = await collectEvents(backend.query("test", {}));

    expect(events).toContainEqual({ type: "text", text: "Hello" });
    expect(events).toContainEqual({ type: "text", text: " world" });
    expect(events).toContainEqual({ type: "done" });
  });

  it("should skip chunks with no delta", async () => {
    const chunks = createMockChunks([
      { choices: [{}] },
      { choices: [{ delta: { content: "ok" } }] },
    ]);

    const client = (backend as any).client;
    client.chat.completions.create.mockResolvedValue(chunks);

    const events = await collectEvents(backend.query("test", {}));

    const textEvents = events.filter((e: any) => e.type === "text");
    expect(textEvents).toHaveLength(1);
    expect(textEvents[0].text).toBe("ok");
  });

  it("should accumulate tool calls across multiple chunks", async () => {
    const mockTool = {
      name: "shell",
      description: "Run command",
      inputSchema: {},
      execute: vi.fn().mockResolvedValue("output"),
    };

    const chunks = createMockChunks([
      {
        choices: [
          {
            delta: {
              tool_calls: [
                { index: 0, id: "tc-1", function: { name: "shell", arguments: '{"com' } },
              ],
            },
          },
        ],
      },
      {
        choices: [
          {
            delta: {
              tool_calls: [
                { index: 0, function: { arguments: 'mand":"ls"}' } },
              ],
            },
          },
        ],
      },
    ]);

    const client = (backend as any).client;
    client.chat.completions.create.mockResolvedValue(chunks);

    const events = await collectEvents(
      backend.query("test", { tools: [mockTool] }),
    );

    expect(events).toContainEqual({
      type: "tool_use",
      toolCall: { id: "tc-1", name: "shell", input: { command: "ls" } },
    });

    expect(mockTool.execute).toHaveBeenCalledWith({ command: "ls" });
    expect(events).toContainEqual({
      type: "tool_result",
      toolResult: { id: "tc-1", output: "output" },
    });
  });

  it("should handle tool execution failure with isError", async () => {
    const mockTool = {
      name: "shell",
      description: "Run",
      inputSchema: {},
      execute: vi.fn().mockRejectedValue(new Error("exec failed")),
    };

    const chunks = createMockChunks([
      {
        choices: [
          {
            delta: {
              tool_calls: [
                { index: 0, id: "tc-2", function: { name: "shell", arguments: '{}' } },
              ],
            },
          },
        ],
      },
    ]);

    const client = (backend as any).client;
    client.chat.completions.create.mockResolvedValue(chunks);

    const events = await collectEvents(
      backend.query("test", { tools: [mockTool] }),
    );

    const result = events.find(
      (e: any) => e.type === "tool_result" && e.toolResult?.isError,
    );
    expect(result).toBeDefined();
    expect(result.toolResult.isError).toBe(true);
    expect(result.toolResult.output).toContain("exec failed");
  });

  it("should handle stream error — yield error event and throw BackendError", async () => {
    const client = (backend as any).client;
    client.chat.completions.create.mockRejectedValue(new Error("API error"));

    const events: any[] = [];
    try {
      for await (const e of backend.query("test", {})) {
        events.push(e);
      }
    } catch (err) {
      expect(err).toBeInstanceOf(BackendError);
      expect((err as Error).message).toContain("API error");
    }

    expect(events).toContainEqual(
      expect.objectContaining({ type: "error", error: "API error" }),
    );
  });

  it("should handle abort/interrupt — yield done and return cleanly", async () => {
    const chunks = createMockChunks([
      { choices: [{ delta: { content: "data" } }] },
    ]);

    const client = (backend as any).client;
    client.chat.completions.create.mockResolvedValue(chunks);

    const gen = backend.query("test", {});
    const first = await gen.next();
    expect(first.value?.type).toBe("text");

    await backend.interrupt();

    const remaining: any[] = [];
    for await (const e of gen) remaining.push(e);
    expect(remaining).toContainEqual({ type: "done" });
  });

  it("should handle abort during error — yield done without throwing", async () => {
    const client = (backend as any).client;
    // Simulate concurrent abort + create rejection
    client.chat.completions.create.mockImplementation(async () => {
      (backend as any).abortController?.abort();
      throw new Error("fail");
    });

    const events = await collectEvents(backend.query("test", {}));
    expect(events).toContainEqual({ type: "done" });
  });

  it("should use default model gpt-4o when not specified", async () => {
    const chunks = createMockChunks([]);
    const client = (backend as any).client;
    client.chat.completions.create.mockResolvedValue(chunks);

    await collectEvents(backend.query("test", {}));

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o" }),
    );
  });

  it("should use specified model", async () => {
    const chunks = createMockChunks([]);
    const client = (backend as any).client;
    client.chat.completions.create.mockResolvedValue(chunks);

    await collectEvents(backend.query("test", { model: "gpt-4o-mini" }));

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o-mini" }),
    );
  });

  describe("buildMessages", () => {
    it("should include system prompt when provided", () => {
      const msgs = (backend as any).buildMessages("hello", {
        systemPrompt: "Be helpful",
      });
      expect(msgs[0]).toEqual({ role: "system", content: "Be helpful" });
      expect(msgs[msgs.length - 1]).toEqual({ role: "user", content: "hello" });
    });

    it("should build messages without system prompt", () => {
      const msgs = (backend as any).buildMessages("hello", {});
      expect(msgs).toEqual([{ role: "user", content: "hello" }]);
    });

    it("should include history messages in order", () => {
      const msgs = (backend as any).buildMessages("new", {
        messages: [
          { role: "user", content: "old" },
          { role: "assistant", content: "response" },
        ],
      });
      expect(msgs).toHaveLength(3);
      expect(msgs[0]).toEqual({ role: "user", content: "old" });
      expect(msgs[1]).toEqual({ role: "assistant", content: "response" });
      expect(msgs[2]).toEqual({ role: "user", content: "new" });
    });

    it("should include system prompt, history, and user message in correct order", () => {
      const msgs = (backend as any).buildMessages("new", {
        systemPrompt: "System",
        messages: [{ role: "user", content: "old" }],
      });
      expect(msgs).toHaveLength(3);
      expect(msgs[0].role).toBe("system");
      expect(msgs[1].role).toBe("user");
      expect(msgs[2]).toEqual({ role: "user", content: "new" });
    });
  });

  it("should pass tools in OpenAI function format", async () => {
    const chunks = createMockChunks([]);
    const client = (backend as any).client;
    client.chat.completions.create.mockResolvedValue(chunks);

    const tools = [
      {
        name: "my_tool",
        description: "A tool",
        inputSchema: { type: "object", properties: {} },
        execute: vi.fn(),
      },
    ];

    await collectEvents(backend.query("test", { tools }));

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [
          {
            type: "function",
            function: {
              name: "my_tool",
              description: "A tool",
              parameters: { type: "object", properties: {} },
            },
          },
        ],
      }),
    );
  });

  it("should pass maxTokens and stream flag", async () => {
    const chunks = createMockChunks([]);
    const client = (backend as any).client;
    client.chat.completions.create.mockResolvedValue(chunks);

    await collectEvents(backend.query("test", { maxTokens: 1024 }));

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 1024,
        stream: true,
      }),
    );
  });
});
