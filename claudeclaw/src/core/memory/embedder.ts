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

export function createEmbedder(config: Config): Embedder | null {
  const model = config.vectorMemory?.embeddingModel;
  if (config.openaiApiKey) {
    return new OpenAIEmbedder(
      config.openaiApiKey,
      model || "text-embedding-3-small",
    );
  }
  return null;
}
