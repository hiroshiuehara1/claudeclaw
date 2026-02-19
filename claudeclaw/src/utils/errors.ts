export class ClawError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ClawError";
  }
}

export class ConfigError extends ClawError {
  constructor(message: string, cause?: unknown) {
    super(message, "CONFIG_ERROR", cause);
    this.name = "ConfigError";
  }
}

export class BackendError extends ClawError {
  constructor(message: string, cause?: unknown) {
    super(message, "BACKEND_ERROR", cause);
    this.name = "BackendError";
  }
}

export class SkillError extends ClawError {
  constructor(message: string, cause?: unknown) {
    super(message, "SKILL_ERROR", cause);
    this.name = "SkillError";
  }
}

export class MemoryError extends ClawError {
  constructor(message: string, cause?: unknown) {
    super(message, "MEMORY_ERROR", cause);
    this.name = "MemoryError";
  }
}

export class ValidationError extends ClawError {
  constructor(message: string, cause?: unknown) {
    super(message, "VALIDATION_ERROR", cause);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends ClawError {
  constructor(message: string, cause?: unknown) {
    super(message, "RATE_LIMIT_ERROR", cause);
    this.name = "RateLimitError";
  }
}

export class TimeoutError extends ClawError {
  constructor(message: string, cause?: unknown) {
    super(message, "TIMEOUT_ERROR", cause);
    this.name = "TimeoutError";
  }
}

export function errorToHttpStatus(err: unknown): number {
  if (err instanceof ValidationError) return 400;
  if (err instanceof RateLimitError) return 429;
  if (err instanceof TimeoutError) return 504;
  if (err instanceof ConfigError) return 500;
  if (err instanceof BackendError) return 502;
  if (err instanceof SkillError) return 500;
  if (err instanceof MemoryError) return 500;
  return 500;
}
