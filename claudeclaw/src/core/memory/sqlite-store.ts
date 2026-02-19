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

  listSessions(limit = 50, offset = 0): { id: string; backend: string | null; model: string | null; created_at: string; updated_at: string; message_count: number }[] {
    return this.db
      .prepare(
        `SELECT s.id, s.backend, s.model, s.created_at, s.updated_at,
                (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) as message_count
         FROM sessions s
         ORDER BY s.updated_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(limit, offset) as { id: string; backend: string | null; model: string | null; created_at: string; updated_at: string; message_count: number }[];
  }

  getSession(sessionId: string): { id: string; backend: string | null; model: string | null; created_at: string; updated_at: string; message_count: number } | undefined {
    return this.db
      .prepare(
        `SELECT s.id, s.backend, s.model, s.created_at, s.updated_at,
                (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) as message_count
         FROM sessions s WHERE s.id = ?`,
      )
      .get(sessionId) as { id: string; backend: string | null; model: string | null; created_at: string; updated_at: string; message_count: number } | undefined;
  }

  deleteSession(sessionId: string): void {
    const deleteMessages = this.db.prepare("DELETE FROM messages WHERE session_id = ?");
    const deleteSession = this.db.prepare("DELETE FROM sessions WHERE id = ?");
    const transaction = this.db.transaction(() => {
      deleteMessages.run(sessionId);
      deleteSession.run(sessionId);
    });
    transaction();
  }

  getAllMessages(sessionId: string): ConversationMessage[] {
    return this.db
      .prepare(
        `SELECT role, content FROM messages
         WHERE session_id = ?
         ORDER BY id ASC`,
      )
      .all(sessionId) as ConversationMessage[];
  }

  cleanExpiredSessions(ttlHours: number): number {
    const result = this.db.transaction(() => {
      const expired = this.db
        .prepare(
          `SELECT id FROM sessions WHERE updated_at < datetime('now', '-' || ? || ' hours')`,
        )
        .all(ttlHours) as { id: string }[];

      for (const { id } of expired) {
        this.db.prepare("DELETE FROM messages WHERE session_id = ?").run(id);
        this.db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
      }

      return expired.length;
    })();

    if (result > 0) {
      logger.info(`Cleaned ${result} expired sessions (TTL: ${ttlHours}h)`);
    }
    return result;
  }

  close(): void {
    this.db.close();
  }
}
