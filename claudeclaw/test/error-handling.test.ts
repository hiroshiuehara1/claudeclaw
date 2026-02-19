import { describe, it, expect } from "vitest";
import {
  ClawError,
  BackendError,
  ConfigError,
  SkillError,
  MemoryError,
  ValidationError,
  RateLimitError,
  TimeoutError,
  errorToHttpStatus,
} from "../src/utils/errors.js";

describe("Error Categorization", () => {
  it("ValidationError should have correct code", () => {
    const err = new ValidationError("bad input");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.name).toBe("ValidationError");
    expect(err).toBeInstanceOf(ClawError);
    expect(err).toBeInstanceOf(Error);
  });

  it("RateLimitError should have correct code", () => {
    const err = new RateLimitError("too many requests");
    expect(err.code).toBe("RATE_LIMIT_ERROR");
    expect(err.name).toBe("RateLimitError");
    expect(err).toBeInstanceOf(ClawError);
  });

  it("TimeoutError should have correct code", () => {
    const cause = new Error("ETIMEDOUT");
    const err = new TimeoutError("request timed out", cause);
    expect(err.code).toBe("TIMEOUT_ERROR");
    expect(err.name).toBe("TimeoutError");
    expect(err.cause).toBe(cause);
  });

  it("errorToHttpStatus should map ValidationError to 400", () => {
    expect(errorToHttpStatus(new ValidationError("bad"))).toBe(400);
  });

  it("errorToHttpStatus should map RateLimitError to 429", () => {
    expect(errorToHttpStatus(new RateLimitError("slow down"))).toBe(429);
  });

  it("errorToHttpStatus should map TimeoutError to 504", () => {
    expect(errorToHttpStatus(new TimeoutError("timed out"))).toBe(504);
  });

  it("errorToHttpStatus should map BackendError to 502", () => {
    expect(errorToHttpStatus(new BackendError("api fail"))).toBe(502);
  });

  it("errorToHttpStatus should map ConfigError to 500", () => {
    expect(errorToHttpStatus(new ConfigError("bad config"))).toBe(500);
  });

  it("errorToHttpStatus should map SkillError to 500", () => {
    expect(errorToHttpStatus(new SkillError("load fail"))).toBe(500);
  });

  it("errorToHttpStatus should map MemoryError to 500", () => {
    expect(errorToHttpStatus(new MemoryError("db fail"))).toBe(500);
  });

  it("errorToHttpStatus should map unknown errors to 500", () => {
    expect(errorToHttpStatus(new Error("generic"))).toBe(500);
    expect(errorToHttpStatus("string error")).toBe(500);
    expect(errorToHttpStatus(null)).toBe(500);
  });
});
