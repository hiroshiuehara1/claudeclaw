import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PromptTemplateManager } from "../src/core/templates/prompt-templates.js";
import { mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = "/tmp/claw-template-test";

beforeEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
});

describe("PromptTemplateManager", () => {
  it("should have builtin templates", () => {
    const mgr = new PromptTemplateManager();
    const templates = mgr.list();
    expect(templates.length).toBeGreaterThanOrEqual(5);
    const names = templates.map((t) => t.name);
    expect(names).toContain("code-review");
    expect(names).toContain("explain");
    expect(names).toContain("refactor");
    expect(names).toContain("test");
    expect(names).toContain("summarize");
  });

  it("should get a template by name", () => {
    const mgr = new PromptTemplateManager();
    const t = mgr.get("code-review");
    expect(t).toBeDefined();
    expect(t!.name).toBe("code-review");
    expect(t!.description).toBeTruthy();
    expect(t!.template).toContain("{{input}}");
  });

  it("should return undefined for unknown template", () => {
    const mgr = new PromptTemplateManager();
    expect(mgr.get("nonexistent")).toBeUndefined();
  });

  it("should apply a template with input", () => {
    const mgr = new PromptTemplateManager();
    const result = mgr.apply("explain", "What is a closure?");
    expect(result).toContain("What is a closure?");
    expect(result).not.toContain("{{input}}");
  });

  it("should return null when applying unknown template", () => {
    const mgr = new PromptTemplateManager();
    expect(mgr.apply("nonexistent", "input")).toBeNull();
  });

  it("should add a custom template", () => {
    const mgr = new PromptTemplateManager();
    mgr.add({ name: "custom", description: "A custom template", template: "Custom: {{input}}" });
    const t = mgr.get("custom");
    expect(t).toBeDefined();
    expect(t!.name).toBe("custom");
  });

  it("should save and load custom templates", () => {
    const mgr = new PromptTemplateManager(TEST_DIR);
    mgr.add({ name: "my-tmpl", description: "My template", template: "My: {{input}}" });
    mgr.save(TEST_DIR);

    // Load in a new manager
    const mgr2 = new PromptTemplateManager(TEST_DIR);
    const t = mgr2.get("my-tmpl");
    expect(t).toBeDefined();
    expect(t!.template).toBe("My: {{input}}");
  });

  it("should not save builtin templates", () => {
    const mgr = new PromptTemplateManager();
    mgr.save(TEST_DIR);

    const mgr2 = new PromptTemplateManager();
    // builtins are loaded from code, not from saved file
    expect(mgr2.list().length).toBeGreaterThanOrEqual(5);
  });

  it("should handle missing custom template file gracefully", () => {
    const mgr = new PromptTemplateManager("/tmp/nonexistent-dir-12345");
    expect(mgr.list().length).toBeGreaterThanOrEqual(5);
  });

  it("should handle corrupt custom template file", () => {
    const dir = join(TEST_DIR, "templates");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "custom.json"), "not valid json", "utf-8");

    const mgr = new PromptTemplateManager(TEST_DIR);
    // Should still have builtins
    expect(mgr.list().length).toBeGreaterThanOrEqual(5);
  });

  it("should replace multiple {{input}} occurrences", () => {
    const mgr = new PromptTemplateManager();
    mgr.add({ name: "double", description: "test", template: "A: {{input}} B: {{input}}" });
    const result = mgr.apply("double", "hello");
    expect(result).toBe("A: hello B: hello");
  });
});
