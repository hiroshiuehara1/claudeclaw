import { createHash } from "node:crypto";
import type { BackendEvent } from "../backend/types.js";

export interface CacheEntry {
  events: BackendEvent[];
  cachedAt: number;
}

export interface ResponseCacheOptions {
  maxEntries?: number;
  ttlMs?: number;
}

export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(options: ResponseCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 100;
    this.ttlMs = options.ttlMs ?? 300_000;
  }

  static buildKey(backend: string, model: string, prompt: string): string {
    const hash = createHash("sha256");
    hash.update(`${backend}\0${model}\0${prompt}`);
    return hash.digest("hex");
  }

  get(key: string): BackendEvent[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Move to end for LRU ordering
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.events;
  }

  set(key: string, events: BackendEvent[]): void {
    // Delete first if exists (to update position)
    this.cache.delete(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(key, { events, cachedAt: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
