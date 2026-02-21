import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const webDir = join(process.cwd(), "web");

describe("Web UI static files", () => {
  it("should have index.html", () => {
    expect(existsSync(join(webDir, "index.html"))).toBe(true);
  });

  it("should have styles.css", () => {
    expect(existsSync(join(webDir, "styles.css"))).toBe(true);
  });

  it("should have app.js", () => {
    expect(existsSync(join(webDir, "app.js"))).toBe(true);
  });

  it("index.html should reference styles.css and app.js", () => {
    const html = readFileSync(join(webDir, "index.html"), "utf-8");
    expect(html).toContain('href="styles.css"');
    expect(html).toContain('src="app.js"');
  });

  it("app.js should connect to WebSocket", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("/api/chat/ws");
    expect(js).toContain("WebSocket");
  });

  it("index.html should have chat form", () => {
    const html = readFileSync(join(webDir, "index.html"), "utf-8");
    expect(html).toContain('id="chat-form"');
    expect(html).toContain('id="messages"');
    expect(html).toContain('id="backend-select"');
  });

  // Phase 7 tests
  it("index.html should have stop button", () => {
    const html = readFileSync(join(webDir, "index.html"), "utf-8");
    expect(html).toContain('id="stop-btn"');
  });

  it("index.html should have typing indicator", () => {
    const html = readFileSync(join(webDir, "index.html"), "utf-8");
    expect(html).toContain('id="typing-indicator"');
  });

  it("app.js should support cancel stream", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("/api/chat/cancel");
    expect(js).toContain("cancelStream");
  });

  it("app.js should pass backend to WebSocket message", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("backendSelect");
    expect(js).toContain("backend");
  });

  it("app.js should support session deletion", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("deleteSession");
    expect(js).toContain('method: "DELETE"');
  });

  it("styles.css should have stop button styles", () => {
    const css = readFileSync(join(webDir, "styles.css"), "utf-8");
    expect(css).toContain("#stop-btn");
    expect(css).toContain(".hidden");
  });

  it("styles.css should have typing indicator styles", () => {
    const css = readFileSync(join(webDir, "styles.css"), "utf-8");
    expect(css).toContain(".typing-indicator");
    expect(css).toContain("typing-bounce");
  });

  it("styles.css should have session delete button styles", () => {
    const css = readFileSync(join(webDir, "styles.css"), "utf-8");
    expect(css).toContain(".session-delete");
  });

  // Phase 9 tests
  it("index.html should have session search input", () => {
    const html = readFileSync(join(webDir, "index.html"), "utf-8");
    expect(html).toContain('id="session-search"');
  });

  it("index.html should have theme toggle button", () => {
    const html = readFileSync(join(webDir, "index.html"), "utf-8");
    expect(html).toContain('id="theme-toggle"');
  });

  it("app.js should support session search filtering", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("filterSessions");
    expect(js).toContain("sessionSearch");
  });

  it("app.js should support theme toggle with localStorage", () => {
    const js = readFileSync(join(webDir, "app.js"), "utf-8");
    expect(js).toContain("toggleTheme");
    expect(js).toContain("localStorage");
    expect(js).toContain("data-theme");
  });

  it("styles.css should use CSS custom properties", () => {
    const css = readFileSync(join(webDir, "styles.css"), "utf-8");
    expect(css).toContain(":root");
    expect(css).toContain("--bg-primary");
    expect(css).toContain("--text-primary");
    expect(css).toContain("--accent");
  });

  it("styles.css should have light theme variant", () => {
    const css = readFileSync(join(webDir, "styles.css"), "utf-8");
    expect(css).toContain('[data-theme="light"]');
  });

  it("styles.css should have session search styles", () => {
    const css = readFileSync(join(webDir, "styles.css"), "utf-8");
    expect(css).toContain("#session-search");
  });
});
