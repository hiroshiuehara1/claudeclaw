import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock chalk
vi.mock("chalk", () => {
  const passthrough = (s: string) => s;
  const chainable = new Proxy(passthrough, {
    get: () => chainable,
    apply: (_target, _thisArg, args) => args[0],
  });
  return { default: chainable };
});

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "repl-session"),
}));

// We need to mock readline at the module level
const mockOn = vi.fn();
const mockQuestion = vi.fn();
const mockClose = vi.fn();
const mockRlInterface = {
  question: mockQuestion,
  close: mockClose,
  on: mockOn,
};

vi.mock("node:readline", () => ({
  createInterface: vi.fn(() => mockRlInterface),
}));

import { startRepl } from "../src/interfaces/cli/repl.js";

function createMockEngine(events: any[] = []) {
  return {
    chat: vi.fn(async function* () {
      for (const e of events) yield e;
    }),
  } as any;
}

describe("REPL", () => {
  let consoleSpy: any;
  let stdoutWriteSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    stdoutWriteSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it("should start with welcome message and session info", async () => {
    const engine = createMockEngine([]);

    // Don't await since prompt blocks — just start it
    startRepl(engine);

    // Welcome messages
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("ClaudeClaw Interactive Chat"),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("repl-session"),
    );
  });

  it("should call engine.chat when user enters input", async () => {
    const engine = createMockEngine([
      { type: "text", text: "response" },
      { type: "done" },
    ]);

    startRepl(engine);

    // Get the question callback
    const questionCallback = mockQuestion.mock.calls[0]?.[1];
    expect(questionCallback).toBeDefined();

    // Simulate user input
    await questionCallback("hello");

    expect(engine.chat).toHaveBeenCalledWith("hello", "repl-session");
  });

  it("should close on 'exit' input", async () => {
    const engine = createMockEngine([]);

    startRepl(engine);

    const questionCallback = mockQuestion.mock.calls[0]?.[1];
    await questionCallback("exit");

    expect(mockClose).toHaveBeenCalled();
  });

  it("should close on 'quit' input", async () => {
    const engine = createMockEngine([]);

    startRepl(engine);

    const questionCallback = mockQuestion.mock.calls[0]?.[1];
    await questionCallback("quit");

    expect(mockClose).toHaveBeenCalled();
  });

  it("should close on empty input", async () => {
    const engine = createMockEngine([]);

    startRepl(engine);

    const questionCallback = mockQuestion.mock.calls[0]?.[1];
    await questionCallback("");

    expect(mockClose).toHaveBeenCalled();
  });

  it("should handle text events by writing to stdout", async () => {
    const engine = createMockEngine([
      { type: "text", text: "Hello world" },
      { type: "done" },
    ]);

    startRepl(engine);

    const questionCallback = mockQuestion.mock.calls[0]?.[1];
    await questionCallback("test");

    expect(stdoutWriteSpy).toHaveBeenCalledWith("Hello world");
  });

  it("should handle tool_use events", async () => {
    const engine = createMockEngine([
      { type: "tool_use", toolCall: { name: "read_file" } },
      { type: "done" },
    ]);

    startRepl(engine);

    const questionCallback = mockQuestion.mock.calls[0]?.[1];
    await questionCallback("test");

    expect(stdoutWriteSpy).toHaveBeenCalledWith(
      expect.stringContaining("read_file"),
    );
  });

  it("should handle error events", async () => {
    const engine = createMockEngine([
      { type: "error", error: "something went wrong" },
      { type: "done" },
    ]);

    startRepl(engine);

    const questionCallback = mockQuestion.mock.calls[0]?.[1];
    await questionCallback("test");

    expect(stdoutWriteSpy).toHaveBeenCalledWith(
      expect.stringContaining("something went wrong"),
    );
  });

  it("should handle engine errors gracefully", async () => {
    const engine = {
      chat: vi.fn(async function* () {
        throw new Error("engine crash");
      }),
    } as any;

    startRepl(engine);

    const questionCallback = mockQuestion.mock.calls[0]?.[1];
    await questionCallback("test");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("engine crash"),
    );
  });

  it("should call process.exit on readline close", () => {
    const engine = createMockEngine([]);

    startRepl(engine);

    // Find the 'close' handler
    const closeHandler = mockOn.mock.calls.find(
      (c: any) => c[0] === "close",
    )?.[1];
    expect(closeHandler).toBeDefined();

    closeHandler();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });
});
