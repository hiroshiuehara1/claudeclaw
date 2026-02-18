import { describe, it, expect } from "vitest";
import {
  ClawError,
  ConfigError,
  BackendError,
  SkillError,
  MemoryError,
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
});
