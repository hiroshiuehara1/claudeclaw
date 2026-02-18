import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import type { BackendName, ChatRole, MessageRecord, SessionRecord } from "../types.js";

export interface RequestLogInput {
  requestId: string;
  sessionId: string;
  backend: BackendName;
  status: "success" | "error";
  latencyMs: number;
  errorCode?: string;
  errorMessage?: string;
}

export class SqliteStore {
  private readonly db: InstanceType<typeof Database>;

  constructor(dbPath: string) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        backend TEXT,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        backend TEXT NOT NULL,
        status TEXT NOT NULL,
        latency_ms INTEGER NOT NULL,
        error_code TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, id);
      CREATE INDEX IF NOT EXISTS idx_requests_session ON requests(session_id, id);
    `);
  }

  close(): void {
    this.db.close();
  }

  createSession(): SessionRecord {
    const id = nanoid();
    const now = new Date().toISOString();
    this.db
      .prepare("INSERT INTO sessions (id, created_at, updated_at) VALUES (?, ?, ?)")
      .run(id, now, now);
    return { id, createdAt: now, updatedAt: now };
  }

  ensureSession(sessionId?: string): SessionRecord {
    if (!sessionId) {
      return this.createSession();
    }

    const existing = this.db
      .prepare("SELECT id, created_at as createdAt, updated_at as updatedAt FROM sessions WHERE id = ?")
      .get(sessionId) as SessionRecord | undefined;

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    this.db
      .prepare("INSERT INTO sessions (id, created_at, updated_at) VALUES (?, ?, ?)")
      .run(sessionId, now, now);
    return { id: sessionId, createdAt: now, updatedAt: now };
  }

  touchSession(sessionId: string): void {
    this.db
      .prepare("UPDATE sessions SET updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), sessionId);
  }

  appendMessage(sessionId: string, role: ChatRole, content: string, backend: BackendName | null): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        "INSERT INTO messages (session_id, role, backend, content, created_at) VALUES (?, ?, ?, ?, ?)"
      )
      .run(sessionId, role, backend, content, now);
    this.touchSession(sessionId);
  }

  listSessions(limit = 50): SessionRecord[] {
    return this.db
      .prepare(
        "SELECT id, created_at as createdAt, updated_at as updatedAt FROM sessions ORDER BY updated_at DESC LIMIT ?"
      )
      .all(limit) as SessionRecord[];
  }

  listMessages(sessionId: string): MessageRecord[] {
    return this.db
      .prepare(
        "SELECT id, session_id as sessionId, role, backend, content, created_at as createdAt FROM messages WHERE session_id = ? ORDER BY id ASC"
      )
      .all(sessionId) as MessageRecord[];
  }

  logRequest(input: RequestLogInput): void {
    this.db
      .prepare(
        `INSERT INTO requests (
          request_id,
          session_id,
          backend,
          status,
          latency_ms,
          error_code,
          error_message,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.requestId,
        input.sessionId,
        input.backend,
        input.status,
        input.latencyMs,
        input.errorCode || null,
        input.errorMessage || null,
        new Date().toISOString()
      );
  }

  listRequestFailures(limit = 100): Array<{
    requestId: string;
    sessionId: string;
    backend: BackendName;
    errorCode: string | null;
    errorMessage: string | null;
    createdAt: string;
  }> {
    return this.db
      .prepare(
        `SELECT request_id as requestId,
                session_id as sessionId,
                backend,
                error_code as errorCode,
                error_message as errorMessage,
                created_at as createdAt
         FROM requests
         WHERE status = 'error'
         ORDER BY id DESC
         LIMIT ?`
      )
      .all(limit) as Array<{
      requestId: string;
      sessionId: string;
      backend: BackendName;
      errorCode: string | null;
      errorMessage: string | null;
      createdAt: string;
    }>;
  }
}
