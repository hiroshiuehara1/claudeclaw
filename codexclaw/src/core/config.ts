import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import dotenv from "dotenv";
import { z } from "zod";
import type { BackendMode } from "./types.js";

dotenv.config({ quiet: true });

const configSchema = z.object({
  dataDir: z.string().min(1),
  dbPath: z.string().min(1),
  publicDir: z.string().min(1),
  webHost: z.string().min(1),
  webPort: z.number().int().positive(),
  defaultBackend: z.enum(["auto", "codex", "claude"]),
  requestTimeoutMs: z.number().int().positive(),
  maxOutputBytes: z.number().int().positive(),
  breakerFailureThreshold: z.number().int().positive(),
  breakerResetMs: z.number().int().positive(),
  retryAttempts: z.number().int().min(0).max(3),
  workspaceDir: z.string().min(1)
});

export type AppConfig = z.infer<typeof configSchema>;

function readInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBackend(name: string, fallback: BackendMode): BackendMode {
  const value = process.env[name];
  if (value === "codex" || value === "claude" || value === "auto") {
    return value;
  }
  return fallback;
}

export function loadConfig(): AppConfig {
  const dataDir = process.env.CODEXCLAW_DATA_DIR || path.join(os.homedir(), ".codexclaw");

  const config = configSchema.parse({
    dataDir,
    dbPath: process.env.CODEXCLAW_DB_PATH || path.join(dataDir, "memory.db"),
    publicDir: process.env.CODEXCLAW_PUBLIC_DIR || path.join(process.cwd(), "src/interfaces/web/public"),
    webHost: process.env.CODEXCLAW_WEB_HOST || "127.0.0.1",
    webPort: readInt("CODEXCLAW_WEB_PORT", 3180),
    defaultBackend: readBackend("CODEXCLAW_DEFAULT_BACKEND", "auto"),
    requestTimeoutMs: readInt("CODEXCLAW_REQUEST_TIMEOUT_MS", 90_000),
    maxOutputBytes: readInt("CODEXCLAW_MAX_OUTPUT_BYTES", 1_000_000),
    breakerFailureThreshold: readInt("CODEXCLAW_BREAKER_FAILURE_THRESHOLD", 3),
    breakerResetMs: readInt("CODEXCLAW_BREAKER_RESET_MS", 30_000),
    retryAttempts: readInt("CODEXCLAW_RETRY_ATTEMPTS", 1),
    workspaceDir: process.env.CODEXCLAW_WORKSPACE_DIR || process.cwd()
  });

  fs.mkdirSync(config.dataDir, { recursive: true });
  return config;
}
