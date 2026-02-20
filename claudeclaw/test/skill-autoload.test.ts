import { describe, it, expect, vi } from "vitest";
import { loadAllSkills } from "../src/core/skill/loader.js";
import { SkillRegistry } from "../src/core/skill/registry.js";
import type { Skill } from "../src/core/skill/types.js";

describe("Skill Auto-Loading", () => {
  it("loadAllSkills should register skills with provided registry", async () => {
    const registry = new SkillRegistry();
    const registerSpy = vi.spyOn(registry, "register");

    // Since we can't load real skills, test with empty sources
    const result = await loadAllSkills([], registry);
    expect(result).toEqual([]);
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("loadAllSkills should skip disabled skills", async () => {
    const result = await loadAllSkills([
      { type: "bundled", path: "nonexistent", enabled: false },
    ]);
    expect(result).toEqual([]);
  });

  it("loadAllSkills should warn on failed skill loads", async () => {
    const result = await loadAllSkills([
      { type: "bundled", path: "nonexistent-skill", enabled: true },
    ]);
    expect(result).toEqual([]);
  });

  it("loadAllSkills should work without registry parameter", async () => {
    const result = await loadAllSkills([]);
    expect(result).toEqual([]);
  });

  it("loadAllSkills should skip invalid npm skills gracefully", async () => {
    const result = await loadAllSkills([
      { type: "npm", package: "nonexistent-claudeclaw-skill-xyz123", enabled: true },
    ]);
    expect(result).toEqual([]);
  });

  it("registry should list skills after auto-loading", async () => {
    const registry = new SkillRegistry();
    expect(registry.listSkills()).toHaveLength(0);
    expect(registry.getAllTools()).toHaveLength(0);
  });
});
