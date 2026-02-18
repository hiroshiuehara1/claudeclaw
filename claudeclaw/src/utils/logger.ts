import pino from "pino";
import type { LogLevel } from "../core/config/schema.js";

const PINO_LEVELS: Record<LogLevel, string> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

const isProduction = process.env.NODE_ENV === "production";

const pinoLogger = pino({
  level: "debug",
  transport: isProduction
    ? undefined
    : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss.l" } },
  redact: {
    paths: [
      "anthropicApiKey",
      "openaiApiKey",
      "*.botToken",
      "*.secret",
      "*.signingSecret",
      "*.appToken",
      "*.apiKey",
      "config.anthropicApiKey",
      "config.openaiApiKey",
    ],
    censor: "[REDACTED]",
  },
});

export function setLogLevel(level: LogLevel): void {
  pinoLogger.level = PINO_LEVELS[level] || "info";
}

export function createChildLogger(context: Record<string, unknown>): typeof logger {
  const child = pinoLogger.child(context);
  return {
    debug(msg: string, ...args: unknown[]) { child.debug(args.length ? args[0] : {}, msg); },
    info(msg: string, ...args: unknown[]) { child.info(args.length ? args[0] : {}, msg); },
    warn(msg: string, ...args: unknown[]) { child.warn(args.length ? args[0] : {}, msg); },
    error(msg: string, ...args: unknown[]) { child.error(args.length ? args[0] : {}, msg); },
  };
}

export const logger = {
  debug(msg: string, ...args: unknown[]): void {
    pinoLogger.debug(args.length ? args[0] : {}, msg);
  },
  info(msg: string, ...args: unknown[]): void {
    pinoLogger.info(args.length ? args[0] : {}, msg);
  },
  warn(msg: string, ...args: unknown[]): void {
    pinoLogger.warn(args.length ? args[0] : {}, msg);
  },
  error(msg: string, ...args: unknown[]): void {
    pinoLogger.error(args.length ? args[0] : {}, msg);
  },
};
