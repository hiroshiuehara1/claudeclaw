import { describe, it, expect, beforeEach } from "vitest";
import { PromptTemplateManager } from "../src/core/templates/prompt-templates.js";

describe("CLI Template Commands (unit)", () => {
  let manager: PromptTemplateManager;

  beforeEach(() => {
    manager = new PromptTemplateManager();
  });

  it("should list builtin templates", () => {
    const templates = manager.list();
    expect(templates.length).toBe(5);
    const names = templates.map((t) => t.name);
    expect(names).toContain("code-review");
    expect(names).toContain("explain");
    expect(names).toContain("refactor");
    expect(names).toContain("test");
    expect(names).toContain("summarize");
  });

  it("should show template details", () => {
    const template = manager.get("code-review");
    expect(template).toBeDefined();
    expect(template!.name).toBe("code-review");
    expect(template!.description).toContain("Review");
    expect(template!.template).toContain("{{input}}");
  });

  it("should return undefined for unknown template", () => {
    expect(manager.get("nonexistent")).toBeUndefined();
  });

  it("should apply template with input", () => {
    const result = manager.apply("explain", "async/await in JS");
    expect(result).toContain("async/await in JS");
    expect(result).toContain("Explain");
  });

  it("should return null when applying unknown template", () => {
    expect(manager.apply("nonexistent", "input")).toBeNull();
  });

  it("should add a custom template", () => {
    manager.add({
      name: "debug",
      description: "Debug help",
      template: "Help debug this: {{input}}",
    });
    const template = manager.get("debug");
    expect(template).toBeDefined();
    expect(template!.name).toBe("debug");
    expect(manager.list().length).toBe(6);
  });

  it("should apply custom template", () => {
    manager.add({
      name: "debug",
      description: "Debug help",
      template: "Help debug this: {{input}}",
    });
    const result = manager.apply("debug", "segfault");
    expect(result).toBe("Help debug this: segfault");
  });

  it("should identify builtin templates", () => {
    const builtinNames = ["code-review", "explain", "refactor", "test", "summarize"];
    for (const name of builtinNames) {
      expect(manager.get(name)).toBeDefined();
    }
  });
});
