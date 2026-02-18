import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  scaffoldSkill,
  _updateConfigSkills,
} from "../src/core/skill/marketplace.js";

describe("Skill Marketplace", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "claw-market-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe("scaffoldSkill", () => {
    it("should create skill directory with package.json and index.ts", () => {
      const originalCwd = process.cwd();
      process.chdir(dir);
      try {
        scaffoldSkill("test-skill");
        const skillDir = join(dir, "claudeclaw-skill-test-skill");
        expect(existsSync(join(skillDir, "package.json"))).toBe(true);
        expect(existsSync(join(skillDir, "index.ts"))).toBe(true);

        const pkg = JSON.parse(
          readFileSync(join(skillDir, "package.json"), "utf-8"),
        );
        expect(pkg.name).toBe("claudeclaw-skill-test-skill");
        expect(pkg.keywords).toContain("claudeclaw-skill");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("should generate valid skill template", () => {
      const originalCwd = process.cwd();
      process.chdir(dir);
      try {
        scaffoldSkill("my-tool");
        const indexContent = readFileSync(
          join(dir, "claudeclaw-skill-my-tool", "index.ts"),
          "utf-8",
        );
        expect(indexContent).toContain("defineSkill");
        expect(indexContent).toContain("my-tool");
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("updateConfigSkills", () => {
    it("should create config.json if it does not exist", () => {
      _updateConfigSkills(dir, (skills) => {
        skills.push({ type: "npm", package: "test-pkg", enabled: true });
        return skills;
      });
      const configPath = join(dir, "config.json");
      expect(existsSync(configPath)).toBe(true);
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      expect(config.skills).toHaveLength(1);
      expect(config.skills[0].package).toBe("test-pkg");
    });

    it("should update existing config.json skills array", () => {
      // Create initial config
      _updateConfigSkills(dir, (skills) => {
        skills.push({ type: "npm", package: "pkg-a", enabled: true });
        return skills;
      });
      // Add another
      _updateConfigSkills(dir, (skills) => {
        skills.push({ type: "npm", package: "pkg-b", enabled: true });
        return skills;
      });
      const config = JSON.parse(
        readFileSync(join(dir, "config.json"), "utf-8"),
      );
      expect(config.skills).toHaveLength(2);
    });

    it("should support removing skills via filter", () => {
      _updateConfigSkills(dir, () => [
        { type: "npm", package: "pkg-a", enabled: true },
        { type: "npm", package: "pkg-b", enabled: true },
      ]);
      _updateConfigSkills(dir, (skills) =>
        skills.filter((s) => s.package !== "pkg-a"),
      );
      const config = JSON.parse(
        readFileSync(join(dir, "config.json"), "utf-8"),
      );
      expect(config.skills).toHaveLength(1);
      expect(config.skills[0].package).toBe("pkg-b");
    });
  });
});
