import { describe, it, expect, vi } from "vitest";
import { BrowserSession } from "../skills/browser-control/browser-session.js";
import { SkillManifestSchema } from "../src/core/skill/types.js";

// We can't import the skill directly since it uses dynamic import of playwright,
// but we can test the manifest schema and the BrowserSession class structure.

describe("BrowserSession", () => {
  it("should initialize as inactive", () => {
    const session = new BrowserSession();
    expect(session.isActive()).toBe(false);
  });

  it("should accept headless and timeout params", () => {
    const session = new BrowserSession(false, 60000);
    expect(session.isActive()).toBe(false);
  });

  it("should handle close when not active", async () => {
    const session = new BrowserSession();
    // Should not throw
    await session.close();
    expect(session.isActive()).toBe(false);
  });
});

describe("Browser control manifest", () => {
  it("should accept browser permission in schema", () => {
    const manifest = SkillManifestSchema.parse({
      name: "browser-control",
      version: "0.1.0",
      description: "Browser automation",
      permissions: ["network", "browser"],
    });
    expect(manifest.permissions).toContain("browser");
  });

  it("should validate browser-control skill manifest fields", () => {
    const manifest = SkillManifestSchema.parse({
      name: "browser-control",
      version: "0.1.0",
      description: "Browser automation — navigate, screenshot, click, type, extract text, evaluate JS",
      permissions: ["network", "browser"],
      systemPromptFragment: "You have browser control tools.",
    });
    expect(manifest.name).toBe("browser-control");
    expect(manifest.systemPromptFragment).toContain("browser");
  });
});
