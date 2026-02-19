import { createHash } from "node:crypto";
import type { Config } from "../config/schema.js";

export interface Embedder {
  embed(text: string): Promise<number[]>;
}

export class OpenAIEmbedder implements Embedder {
  private clientPromise: Promise<any>;
  private model: string;

  constructor(apiKey: string, model = "text-embedding-3-small") {
    this.model = model;
    this.clientPromise = import("openai").then(
      ({ default: OpenAI }) => new OpenAI({ apiKey }),
    );
  }

  async embed(text: string): Promise<number[]> {
    const client = await this.clientPromise;
    const response = await client.embeddings.create({
      model: this.model,
      input: text,
    });
    return response.data[0].embedding;
  }
}

export class NoOpEmbedder implements Embedder {
  private dimension: number;

  constructor(dimension = 1536) {
    this.dimension = dimension;
  }

  async embed(_text: string): Promise<number[]> {
    return new Array(this.dimension).fill(0);
  }
}

export class CachedEmbedder implements Embedder {
  private cache = new Map<string, number[]>();

  constructor(private inner: Embedder) {}

  async embed(text: string): Promise<number[]> {
    const hash = createHash("sha256").update(text).digest("hex");
    const cached = this.cache.get(hash);
    if (cached) return cached;

    const embedding = await this.inner.embed(text);
    this.cache.set(hash, embedding);
    return embedding;
  }
}

export function createEmbedder(config: Config): Embedder | null {
  const model = config.vectorMemory?.embeddingModel;
  if (config.openaiApiKey) {
    return new CachedEmbedder(
      new OpenAIEmbedder(
        config.openaiApiKey,
        model || "text-embedding-3-small",
      ),
    );
  }
  return null;
}
