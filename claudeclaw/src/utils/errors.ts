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
