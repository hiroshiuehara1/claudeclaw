import { describe, it, expect } from "vitest";
import { loadSkill, loadAllSkills } from "../src/core/skill/loader.js";
import { SkillError } from "../src/utils/errors.js";

describe("loadSkill", () => {
  it("should throw on unknown source type", async () => {
    await expect(
      loadSkill({ type: "unknown" as any, enabled: true }),
    ).rejects.toThrow("Unknown skill source type");
  });

  it("should throw when bundled skill path does not exist", async () => {
    await expect(
      loadSkill({ type: "bundled", path: "nonexistent-skill", enabled: true }),
    ).rejects.toThrow();
  });

  it("should throw when local skill path does not exist", async () => {
    await expect(
      loadSkill({ type: "local", path: "/nonexistent/skill/path", enabled: true }),
    ).rejects.toThrow();
  });

  it("should throw when npm skill does not exist", async () => {
    await expect(
      loadSkill({ type: "npm", package: "nonexistent-claudeclaw-skill-xyz", enabled: true }),
    ).rejects.toThrow();
  });
});

describe("loadAllSkills", () => {
  it("should return empty array for empty sources", async () => {
    const skills = await loadAllSkills([]);
    expect(skills).toEqual([]);
  });

  it("should skip disabled skills", async () => {
    const skills = await loadAllSkills([
      { type: "bundled", path: "nonexistent", enabled: false },
    ]);
    expect(skills).toEqual([]);
  });

  it("should skip and log failed skills", async () => {
    const skills = await loadAllSkills([
      { type: "bundled", path: "nonexistent-skill", enabled: true },
    ]);
    expect(skills).toEqual([]);
  });
});
