import { describe, it, expect } from "vitest";
import {
  ClawError,
  ConfigError,
  BackendError,
  SkillError,
  MemoryError,
  ValidationError,
  RateLimitError,
  TimeoutError,
  errorToHttpStatus,
} from "../src/utils/errors.js";

describe("Error classes", () => {
  it("ClawError should set name, code, and cause", () => {
    const cause = new Error("root");
    const err = new ClawError("test", "TEST_ERROR", cause);
    expect(err.message).toBe("test");
    expect(err.code).toBe("TEST_ERROR");
    expect(err.cause).toBe(cause);
    expect(err.name).toBe("ClawError");
    expect(err).toBeInstanceOf(Error);
  });

  it("ConfigError should have correct code", () => {
    const err = new ConfigError("bad config");
    expect(err.code).toBe("CONFIG_ERROR");
    expect(err.name).toBe("ConfigError");
    expect(err).toBeInstanceOf(ClawError);
  });

  it("BackendError should have correct code", () => {
    const err = new BackendError("api fail", new Error("timeout"));
    expect(err.code).toBe("BACKEND_ERROR");
    expect(err.name).toBe("BackendError");
    expect(err.cause).toBeInstanceOf(Error);
  });

  it("SkillError should have correct code", () => {
    const err = new SkillError("load fail");
    expect(err.code).toBe("SKILL_ERROR");
    expect(err.name).toBe("SkillError");
  });

  it("MemoryError should have correct code", () => {
    const err = new MemoryError("db fail");
    expect(err.code).toBe("MEMORY_ERROR");
    expect(err.name).toBe("MemoryError");
  });

  it("ValidationError should have correct code and extend ClawError", () => {
    const err = new ValidationError("invalid input");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.name).toBe("ValidationError");
    expect(err).toBeInstanceOf(ClawError);
  });

  it("RateLimitError should have correct code", () => {
    const err = new RateLimitError("429 too many");
    expect(err.code).toBe("RATE_LIMIT_ERROR");
    expect(err.name).toBe("RateLimitError");
  });

  it("TimeoutError should have correct code and cause", () => {
    const cause = new Error("ETIMEDOUT");
    const err = new TimeoutError("timed out", cause);
    expect(err.code).toBe("TIMEOUT_ERROR");
    expect(err.name).toBe("TimeoutError");
    expect(err.cause).toBe(cause);
  });

  it("errorToHttpStatus should map error types correctly", () => {
    expect(errorToHttpStatus(new ValidationError("x"))).toBe(400);
    expect(errorToHttpStatus(new RateLimitError("x"))).toBe(429);
    expect(errorToHttpStatus(new TimeoutError("x"))).toBe(504);
    expect(errorToHttpStatus(new BackendError("x"))).toBe(502);
    expect(errorToHttpStatus(new Error("x"))).toBe(500);
  });
});
