import type { ConversationMessage } from "../backend/types.js";
import type { SqliteStore } from "./sqlite-store.js";
import { logger } from "../../utils/logger.js";

export class MemoryManager {
  constructor(private store: SqliteStore) {}

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
  }

  async remember(fact: string): Promise<void> {
    // Parse "category: key = value" or just store as general fact
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
}
