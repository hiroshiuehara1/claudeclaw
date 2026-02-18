import { describe, it, expect } from "vitest";
import { createChildLogger, logger, setLogLevel } from "../src/utils/logger.js";

describe("Logger", () => {
  it("should create a child logger with context", () => {
    const child = createChildLogger({ sessionId: "test-123", requestId: "req-456" });
    expect(child).toHaveProperty("debug");
    expect(child).toHaveProperty("info");
    expect(child).toHaveProperty("warn");
    expect(child).toHaveProperty("error");
  });

  it("should not throw when logging", () => {
    expect(() => logger.info("test message")).not.toThrow();
    expect(() => logger.debug("debug message")).not.toThrow();
    expect(() => logger.warn("warn message")).not.toThrow();
    expect(() => logger.error("error message")).not.toThrow();
  });

  it("should accept setLogLevel without error", () => {
    expect(() => setLogLevel("debug")).not.toThrow();
    expect(() => setLogLevel("info")).not.toThrow();
    expect(() => setLogLevel("warn")).not.toThrow();
    expect(() => setLogLevel("error")).not.toThrow();
  });

  it("child logger should not throw when logging", () => {
    const child = createChildLogger({ component: "test" });
    expect(() => child.info("child info")).not.toThrow();
    expect(() => child.error("child error")).not.toThrow();
  });
});
