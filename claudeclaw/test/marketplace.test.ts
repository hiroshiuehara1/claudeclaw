import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  scaffoldSkill,
  searchSkills,
  installSkill,
  removeSkill,
  _updateConfigSkills,
} from "../src/core/skill/marketplace.js";

// Mock logger
vi.mock("../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock child_process for installSkill/removeSkill
vi.mock("node:child_process", async (importOriginal) => {
  const original = await importOriginal() as any;
  return {
    ...original,
    execSync: vi.fn(),
  };
});

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

  describe("searchSkills", () => {
    it("should parse search results from npm registry", async () => {
      const mockResponse = {
        objects: [
          {
            package: {
              name: "claudeclaw-skill-test",
              version: "1.0.0",
              description: "A test skill",
            },
          },
          {
            package: {
              name: "claudeclaw-skill-other",
              version: "2.0.0",
            },
          },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      } as any);

      const results = await searchSkills("test");
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        name: "claudeclaw-skill-test",
        version: "1.0.0",
        description: "A test skill",
      });
      expect(results[1].description).toBe("");
    });

    it("should return empty array for no results", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        json: () => Promise.resolve({ objects: [] }),
      } as any);

      const results = await searchSkills("nonexistent");
      expect(results).toEqual([]);
    });

    it("should handle missing objects field", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        json: () => Promise.resolve({}),
      } as any);

      const results = await searchSkills("test");
      expect(results).toEqual([]);
    });
  });

  describe("installSkill", () => {
    it("should create skills directory and run npm install", async () => {
      const { execSync } = await import("node:child_process");

      installSkill("test", dir);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("npm install claudeclaw-skill-test"),
        expect.objectContaining({ timeout: 60_000 }),
      );

      // Should update config
      const config = JSON.parse(readFileSync(join(dir, "config.json"), "utf-8"));
      expect(config.skills).toContainEqual(
        expect.objectContaining({ package: "claudeclaw-skill-test" }),
      );
    });

    it("should handle full package name with prefix", async () => {
      const { execSync } = await import("node:child_process");

      installSkill("claudeclaw-skill-existing", dir);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("claudeclaw-skill-existing"),
        expect.any(Object),
      );
    });

    it("should not duplicate skills in config", async () => {
      // Pre-populate config with the skill
      _updateConfigSkills(dir, () => [
        { type: "npm", package: "claudeclaw-skill-dup", enabled: true },
      ]);

      installSkill("dup", dir);

      const config = JSON.parse(readFileSync(join(dir, "config.json"), "utf-8"));
      const matches = config.skills.filter(
        (s: any) => s.package === "claudeclaw-skill-dup",
      );
      expect(matches).toHaveLength(1);
    });
  });

  describe("removeSkill", () => {
    it("should remove skill from config", () => {
      // Pre-populate config
      _updateConfigSkills(dir, () => [
        { type: "npm", package: "claudeclaw-skill-remove-me", enabled: true },
      ]);

      removeSkill("remove-me", dir);

      const config = JSON.parse(readFileSync(join(dir, "config.json"), "utf-8"));
      expect(config.skills).toHaveLength(0);
    });

    it("should handle full package name with prefix in config", () => {
      _updateConfigSkills(dir, () => [
        { type: "npm", package: "claudeclaw-skill-full", enabled: true },
      ]);

      removeSkill("claudeclaw-skill-full", dir);

      const config = JSON.parse(readFileSync(join(dir, "config.json"), "utf-8"));
      expect(config.skills).toHaveLength(0);
    });
  });
});
