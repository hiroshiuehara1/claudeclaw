import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sessionsPath = join(process.cwd(), "src", "interfaces", "web", "sessions.ts");

describe("Session summary endpoint", () => {
  const source = readFileSync(sessionsPath, "utf-8");

  it("should have summary route", () => {
    expect(source).toContain("/api/sessions/:id/summary");
  });

  it("should return message counts", () => {
    expect(source).toContain("messageCount");
    expect(source).toContain("userMessages");
    expect(source).toContain("assistantMessages");
  });

  it("should return character count", () => {
    expect(source).toContain("totalCharacters");
  });

  it("should return first and last message previews", () => {
    expect(source).toContain("firstMessage");
    expect(source).toContain("lastMessage");
  });

  it("should return session metadata", () => {
    expect(source).toContain("backend");
    expect(source).toContain("model");
    expect(source).toContain("createdAt");
    expect(source).toContain("updatedAt");
  });

  it("should handle missing memory manager", () => {
    expect(source).toContain("Memory not configured");
  });

  it("should handle session not found", () => {
    expect(source).toContain("Session not found");
  });
});
