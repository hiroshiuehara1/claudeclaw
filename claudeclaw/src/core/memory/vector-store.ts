import Database from "better-sqlite3";
import { join } from "node:path";
import { logger } from "../../utils/logger.js";

export interface VectorSearchResult {
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export class VectorStore {
  private db: Database.Database;

  constructor(dataDir: string) {
    const dbPath = join(dataDir, "vectors.db");
    logger.debug(`Opening vector store at ${dbPath}`);
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        embedding BLOB NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  insert(
    content: string,
    embedding: number[],
    metadata: Record<string, unknown> = {},
  ): void {
    const blob = Buffer.from(new Float32Array(embedding).buffer);
    this.db
      .prepare(
        "INSERT INTO embeddings (content, embedding, metadata) VALUES (?, ?, ?)",
      )
      .run(content, blob, JSON.stringify(metadata));
  }

  search(queryEmbedding: number[], topK: number): VectorSearchResult[] {
    const rows = this.db
      .prepare("SELECT content, embedding, metadata FROM embeddings")
      .all() as Array<{
      content: string;
      embedding: Buffer;
      metadata: string;
    }>;

    const queryVec = new Float32Array(queryEmbedding);

    const scored = rows.map((row) => {
      const storedVec = new Float32Array(
        row.embedding.buffer,
        row.embedding.byteOffset,
        row.embedding.byteLength / 4,
      );
      const score = cosineSimilarity(queryVec, storedVec);
      return {
        content: row.content,
        score,
        metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  count(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) as cnt FROM embeddings")
      .get() as { cnt: number };
    return row.cnt;
  }

  close(): void {
    this.db.close();
  }
}
