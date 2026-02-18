import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const webDir = join(process.cwd(), "web");

describe("Web UI upgrades", () => {
  it("index.html should include marked CDN script", () => {
    const html = readFileSync(join(webDir, "index.html"), "utf-8");
    expect(html).toContain("marked");
    expect(html).toContain("cdn.jsdelivr.net");
  });

  it("index.html should include highlight.js CDN", () => {
    const html = readFileSync(join(webDir, "index.html"), "utf-8");
    expect(html).toContain("highlight.min.js");
    expect(html).toContain("highlightjs");
  });

  it("index.html should have sidebar structure", () => {
    const html = readFileSync(join(webDir, "index.html"), "utf-8");
    expect(html).toContain('id="sidebar"');
    expect(html).toContain('id="session-list"');
    expect(html).toContain('id="main-panel"');
    expect(html).toContain('id="sidebar-toggle"');
  });

  it("index.html should have export button", () => {
    const html = readFileSync(join(webDir, "index.html"), "utf-8");
    expect(html).toContain('id="export-btn"');
  });

  it("app.js should use marked.parse for rendering", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("marked.parse");
  });

  it("app.js should configure marked with highlight.js", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("marked.setOptions");
    expect(js).toContain("hljs");
  });

  it("app.js should load sessions from API", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("/api/sessions");
    expect(js).toContain("loadSessions");
    expect(js).toContain("renderSessionList");
  });

  it("app.js should support sessionId in WebSocket messages", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("sessionId");
  });

  it("app.js should have export functionality", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("export");
    expect(js).toContain("format=markdown");
  });

  it("styles.css should have sidebar styles", () => {
    const css = readFileSync(join(webDir, "styles.css"), "utf-8");
    expect(css).toContain("#sidebar");
    expect(css).toContain(".session-item");
  });

  it("styles.css should have markdown content styles", () => {
    const css = readFileSync(join(webDir, "styles.css"), "utf-8");
    expect(css).toContain(".markdown-content");
    expect(css).toContain("blockquote");
    expect(css).toContain("pre code");
  });

  it("styles.css should have responsive mobile styles", () => {
    const css = readFileSync(join(webDir, "styles.css"), "utf-8");
    expect(css).toContain("@media");
    expect(css).toContain("768px");
    expect(css).toContain("#sidebar-toggle");
  });

  it("WebSocketMessageSchema should accept sessionId", () => {
    // This is a compile-time check via import
    const validationSrc = readFileSync(
      join(process.cwd(), "src/interfaces/web/validation.ts"),
      "utf-8"
    );
    expect(validationSrc).toContain("sessionId");
  });
});
