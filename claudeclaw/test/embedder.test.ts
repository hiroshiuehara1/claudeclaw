import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock openai module
const mockCreate = vi.fn().mockResolvedValue({
  data: [{ embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }],
});

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: { create: mockCreate },
  })),
}));

import {
  OpenAIEmbedder,
  NoOpEmbedder,
  CachedEmbedder,
  createEmbedder,
} from "../src/core/memory/embedder.js";

describe("OpenAIEmbedder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return number array from embed()", async () => {
    const embedder = new OpenAIEmbedder("test-key");
    const result = await embedder.embed("hello world");

    expect(result).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(mockCreate).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "hello world",
    });
  });

  it("should use custom model when specified", async () => {
    const embedder = new OpenAIEmbedder("test-key", "text-embedding-ada-002");
    await embedder.embed("test");

    expect(mockCreate).toHaveBeenCalledWith({
      model: "text-embedding-ada-002",
      input: "test",
    });
  });

  it("should use default model text-embedding-3-small", async () => {
    const embedder = new OpenAIEmbedder("test-key");
    await embedder.embed("test");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "text-embedding-3-small" }),
    );
  });
});

describe("createEmbedder", () => {
  it("should return CachedEmbedder wrapping OpenAIEmbedder when openaiApiKey is set", () => {
    const config = {
      openaiApiKey: "sk-test",
      vectorMemory: { enabled: true, topK: 5 },
    } as any;

    const embedder = createEmbedder(config);
    expect(embedder).toBeInstanceOf(CachedEmbedder);
  });

  it("should return null when no API key", () => {
    const config = {
      vectorMemory: { enabled: true, topK: 5 },
    } as any;

    const embedder = createEmbedder(config);
    expect(embedder).toBeNull();
  });

  it("should use custom embedding model from config", () => {
    const config = {
      openaiApiKey: "sk-test",
      vectorMemory: {
        enabled: true,
        topK: 5,
        embeddingModel: "text-embedding-ada-002",
      },
    } as any;

    const embedder = createEmbedder(config);
    expect(embedder).toBeInstanceOf(CachedEmbedder);
    // The inner embedder has the custom model
    expect((embedder as any).inner.model).toBe("text-embedding-ada-002");
  });
});

describe("NoOpEmbedder", () => {
  it("should return zero vector of default dimension (1536)", async () => {
    const embedder = new NoOpEmbedder();
    const result = await embedder.embed("anything");

    expect(result).toHaveLength(1536);
    expect(result.every((v) => v === 0)).toBe(true);
  });

  it("should return zero vector of custom dimension", async () => {
    const embedder = new NoOpEmbedder(768);
    const result = await embedder.embed("test");

    expect(result).toHaveLength(768);
    expect(result.every((v) => v === 0)).toBe(true);
  });
});

describe("CachedEmbedder", () => {
  it("should return cached result on second call with same text", async () => {
    const inner = {
      embed: vi.fn().mockResolvedValue([1, 2, 3]),
    };
    const cached = new CachedEmbedder(inner);

    const first = await cached.embed("hello");
    const second = await cached.embed("hello");

    expect(first).toEqual([1, 2, 3]);
    expect(second).toEqual([1, 2, 3]);
    // Inner should only be called once
    expect(inner.embed).toHaveBeenCalledTimes(1);
  });

  it("should call inner for different texts", async () => {
    const inner = {
      embed: vi.fn()
        .mockResolvedValueOnce([1, 0, 0])
        .mockResolvedValueOnce([0, 1, 0]),
    };
    const cached = new CachedEmbedder(inner);

    const r1 = await cached.embed("hello");
    const r2 = await cached.embed("world");

    expect(r1).toEqual([1, 0, 0]);
    expect(r2).toEqual([0, 1, 0]);
    expect(inner.embed).toHaveBeenCalledTimes(2);
  });
});
