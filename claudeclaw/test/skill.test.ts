import { describe, it, expect } from "vitest";
import { SkillManifestSchema, defineSkill } from "../src/core/skill/types.js";
import { SkillRegistry } from "../src/core/skill/registry.js";
import type { ToolDefinition } from "../src/core/backend/types.js";

const mockTool: ToolDefinition = {
  name: "test_tool",
  description: "A test tool",
  inputSchema: { type: "object", properties: {} },
  async execute() {
    return "ok";
  },
};

describe("SkillManifest", () => {
  it("should parse a valid manifest", () => {
    const manifest = SkillManifestSchema.parse({
      name: "test-skill",
      version: "1.0.0",
      description: "A test skill",
    });
    expect(manifest.name).toBe("test-skill");
    expect(manifest.permissions).toEqual([]);
  });

  it("should reject invalid permissions", () => {
    expect(() =>
      SkillManifestSchema.parse({
        name: "test",
        version: "1.0.0",
        description: "test",
        permissions: ["invalid"],
      }),
    ).toThrow();
  });
});

describe("defineSkill", () => {
  it("should create a valid skill", () => {
    const skill = defineSkill(
      {
        name: "my-skill",
        version: "0.1.0",
        description: "Test",
        permissions: ["fs:read"],
      },
      [mockTool],
    );
    expect(skill.manifest.name).toBe("my-skill");
    expect(skill.tools).toHaveLength(1);
  });
});

describe("SkillRegistry", () => {
  it("should register and list skills", () => {
    const registry = new SkillRegistry();
    const skill = defineSkill(
      { name: "s1", version: "1.0.0", description: "Skill 1" },
      [mockTool],
    );
    registry.register(skill);

    expect(registry.listSkills()).toHaveLength(1);
    expect(registry.getSkill("s1")).toBeDefined();
  });

  it("should aggregate tools from all skills", () => {
    const registry = new SkillRegistry();
    registry.register(
      defineSkill(
        { name: "s1", version: "1.0.0", description: "Skill 1" },
        [mockTool],
      ),
    );
    registry.register(
      defineSkill(
        { name: "s2", version: "1.0.0", description: "Skill 2" },
        [{ ...mockTool, name: "tool2" }],
      ),
    );

    expect(registry.getAllTools()).toHaveLength(2);
  });

  it("should collect system prompt fragments", () => {
    const registry = new SkillRegistry();
    registry.register(
      defineSkill(
        {
          name: "s1",
          version: "1.0.0",
          description: "Skill 1",
          systemPromptFragment: "You have skill 1.",
        },
        [],
      ),
    );
    const frags = registry.getSystemPromptFragments();
    expect(frags).toContain("You have skill 1.");
  });

  it("should unregister skills", () => {
    const registry = new SkillRegistry();
    registry.register(
      defineSkill({ name: "s1", version: "1.0.0", description: "S1" }, []),
    );
    registry.unregister("s1");
    expect(registry.listSkills()).toHaveLength(0);
  });
});
