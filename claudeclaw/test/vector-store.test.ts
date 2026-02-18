import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { VectorStore, cosineSimilarity } from "../src/core/memory/vector-store.js";
import { MemoryManager } from "../src/core/memory/memory-manager.js";
import { SqliteStore } from "../src/core/memory/sqlite-store.js";
import type { Embedder } from "../src/core/memory/embedder.js";

describe("cosineSimilarity", () => {
  it("should return 1.0 for identical vectors", () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([1, 0, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1.0);
  });

  it("should return 0.0 for orthogonal vectors", () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([0, 1, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(0.0);
  });

  it("should return -1.0 for opposite vectors", () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([-1, 0, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0);
  });

  it("should handle zero vectors", () => {
    const a = new Float32Array([0, 0, 0]);
    const b = new Float32Array([1, 0, 0]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });
});

describe("VectorStore", () => {
  let dir: string;
  let store: VectorStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "claw-vec-"));
    store = new VectorStore(dir);
  });

  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("should insert and count records", () => {
    store.insert("hello", [1, 0, 0], { role: "user" });
    store.insert("world", [0, 1, 0], { role: "assistant" });
    expect(store.count()).toBe(2);
  });

  it("should search and return results sorted by similarity", () => {
    store.insert("cats are great", [1, 0, 0]);
    store.insert("dogs are cool", [0.9, 0.1, 0]);
    store.insert("math is hard", [0, 0, 1]);

    const results = store.search([1, 0, 0], 2);
    expect(results).toHaveLength(2);
    expect(results[0].content).toBe("cats are great");
    expect(results[0].score).toBeCloseTo(1.0);
    expect(results[1].content).toBe("dogs are cool");
  });

  it("should respect topK limit", () => {
    store.insert("a", [1, 0, 0]);
    store.insert("b", [0, 1, 0]);
    store.insert("c", [0, 0, 1]);

    const results = store.search([1, 0, 0], 1);
    expect(results).toHaveLength(1);
  });

  it("should return empty for empty store", () => {
    const results = store.search([1, 0, 0], 5);
    expect(results).toHaveLength(0);
  });
});

describe("MemoryManager with vector search", () => {
  let dir: string;
  let sqliteStore: SqliteStore;
  let vectorStore: VectorStore;

  const mockEmbedder: Embedder = {
    async embed(text: string): Promise<number[]> {
      // Simple deterministic "embedding" based on text length
      return [text.length / 100, text.includes("hello") ? 1 : 0, 0];
    },
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "claw-mm-vec-"));
    sqliteStore = new SqliteStore(dir);
    vectorStore = new VectorStore(dir);
  });

  afterEach(() => {
    sqliteStore.close();
    vectorStore.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("should embed messages when vector store is present", async () => {
    const mm = new MemoryManager(sqliteStore, vectorStore, mockEmbedder);
    await mm.addMessage("s1", "user", "hello world");
    expect(vectorStore.count()).toBe(1);
  });

  it("should search for relevant content", async () => {
    const mm = new MemoryManager(sqliteStore, vectorStore, mockEmbedder);
    await mm.addMessage("s1", "user", "hello world");
    await mm.addMessage("s1", "assistant", "hi there");

    const results = await mm.search("hello", 5);
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return empty when no vector store", async () => {
    const mm = new MemoryManager(sqliteStore);
    const results = await mm.search("hello");
    expect(results).toEqual([]);
  });
});
