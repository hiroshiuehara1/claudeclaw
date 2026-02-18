import type { ConversationMessage } from "../backend/types.js";
import type { SqliteStore } from "./sqlite-store.js";
import type { VectorStore, VectorSearchResult } from "./vector-store.js";
import type { Embedder } from "./embedder.js";
import { logger } from "../../utils/logger.js";

export class MemoryManager {
  constructor(
    private store: SqliteStore,
    private vectorStore?: VectorStore,
    private embedder?: Embedder,
  ) {}

  async loadContext(sessionId: string): Promise<string | null> {
    const memories = this.store.getMemories();
    if (memories.length === 0) return null;

    const lines = memories.map((m) => `- [${m.category}] ${m.key}: ${m.value}`);
    return lines.join("\n");
  }

  async getHistory(sessionId: string): Promise<ConversationMessage[]> {
    return this.store.getMessages(sessionId);
  }

  async addMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
  ): Promise<void> {
    this.store.addMessage(sessionId, role, content);

    // Also embed for vector search (fire-and-forget)
    if (this.vectorStore && this.embedder) {
      try {
        const embedding = await this.embedder.embed(content);
        this.vectorStore.insert(content, embedding, { sessionId, role });
      } catch (err) {
        logger.warn(
          `Vector embedding failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  async search(
    query: string,
    topK = 5,
  ): Promise<VectorSearchResult[]> {
    if (!this.vectorStore || !this.embedder) return [];
    try {
      const queryEmbedding = await this.embedder.embed(query);
      return this.vectorStore.search(queryEmbedding, topK);
    } catch (err) {
      logger.warn(
        `Vector search failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
  }

  async remember(fact: string): Promise<void> {
    const match = fact.match(/^(\w+):\s*(.+?)\s*=\s*(.+)$/);
    if (match) {
      this.store.upsertMemory(match[1], match[2], match[3]);
      logger.info(`Remembered: [${match[1]}] ${match[2]} = ${match[3]}`);
    } else {
      this.store.upsertMemory("general", fact, "true");
      logger.info(`Remembered: ${fact}`);
    }
  }

  async clearSession(sessionId: string): Promise<void> {
    this.store.clearSession(sessionId);
  }

  async close(): Promise<void> {
    this.store.close();
    this.vectorStore?.close();
  }
}
