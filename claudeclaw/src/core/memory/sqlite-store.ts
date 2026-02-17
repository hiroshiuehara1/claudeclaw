import Database from "better-sqlite3";
import { join } from "node:path";
import type { ConversationMessage } from "../backend/types.js";
import { logger } from "../../utils/logger.js";

export interface MemoryRecord {
  category: string;
  key: string;
  value: string;
}

export class SqliteStore {
  private db: Database.Database;

  constructor(dataDir: string) {
    const dbPath = join(dataDir, "memory.db");
    logger.debug(`Opening SQLite store at ${dbPath}`);
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(category, key)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        backend TEXT,
        model TEXT,
        cwd TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
    `);
  }

  getMessages(sessionId: string, limit = 50): ConversationMessage[] {
    const rows = this.db
      .prepare(
        `SELECT role, content FROM messages
         WHERE session_id = ?
         ORDER BY id DESC LIMIT ?`,
      )
      .all(sessionId, limit) as { role: "user" | "assistant"; content: string }[];
    return rows.reverse();
  }

  addMessage(sessionId: string, role: string, content: string): void {
    this.db
      .prepare("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)")
      .run(sessionId, role, content);
  }

  getMemories(category?: string): MemoryRecord[] {
    if (category) {
      return this.db
        .prepare("SELECT category, key, value FROM memories WHERE category = ?")
        .all(category) as MemoryRecord[];
    }
    return this.db
      .prepare("SELECT category, key, value FROM memories")
      .all() as MemoryRecord[];
  }

  upsertMemory(category: string, key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO memories (category, key, value, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(category, key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at`,
      )
      .run(category, key, value);
  }

  clearSession(sessionId: string): void {
    this.db
      .prepare("DELETE FROM messages WHERE session_id = ?")
      .run(sessionId);
  }

  ensureSession(
    sessionId: string,
    backend?: string,
    model?: string,
    cwd?: string,
  ): void {
    this.db
      .prepare(
        `INSERT INTO sessions (id, backend, model, cwd)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           updated_at = datetime('now')`,
      )
      .run(sessionId, backend || null, model || null, cwd || null);
  }

  close(): void {
    this.db.close();
  }
}
