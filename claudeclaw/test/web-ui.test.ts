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
});
