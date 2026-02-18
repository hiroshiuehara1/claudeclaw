import { defineSkill } from "../../src/core/skill/types.js";
import type { ToolDefinition } from "../../src/core/backend/types.js";
import { BrowserSession } from "./browser-session.js";

const session = new BrowserSession();

const navigateTool: ToolDefinition = {
  name: "browser_navigate",
  description: "Navigate the browser to a URL and return the page title.",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "URL to navigate to" },
    },
    required: ["url"],
  },
  async execute(input: unknown) {
    const { url } = input as { url: string };
    const page = await session.getPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const title = await page.title();
    return `Navigated to ${url}. Title: ${title}`;
  },
};

const screenshotTool: ToolDefinition = {
  name: "browser_screenshot",
  description: "Take a screenshot of the current page and save to a file.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "File path to save the screenshot (default: screenshot.png)",
      },
    },
  },
  async execute(input: unknown) {
    const { path } = (input || {}) as { path?: string };
    const page = await session.getPage();
    const savePath = path || "screenshot.png";
    await page.screenshot({ path: savePath, fullPage: true });
    return `Screenshot saved to ${savePath}`;
  },
};

const clickTool: ToolDefinition = {
  name: "browser_click",
  description: "Click on an element matching the given CSS selector.",
  inputSchema: {
    type: "object",
    properties: {
      selector: { type: "string", description: "CSS selector of the element to click" },
    },
    required: ["selector"],
  },
  async execute(input: unknown) {
    const { selector } = input as { selector: string };
    const page = await session.getPage();
    await page.click(selector);
    return `Clicked: ${selector}`;
  },
};

const typeTool: ToolDefinition = {
  name: "browser_type",
  description: "Type text into an input element matching the given CSS selector.",
  inputSchema: {
    type: "object",
    properties: {
      selector: { type: "string", description: "CSS selector of the input element" },
      text: { type: "string", description: "Text to type" },
    },
    required: ["selector", "text"],
  },
  async execute(input: unknown) {
    const { selector, text } = input as { selector: string; text: string };
    const page = await session.getPage();
    await page.fill(selector, text);
    return `Typed "${text}" into ${selector}`;
  },
};

const extractTextTool: ToolDefinition = {
  name: "browser_extract_text",
  description:
    "Extract text content from the page or from elements matching a CSS selector.",
  inputSchema: {
    type: "object",
    properties: {
      selector: {
        type: "string",
        description: "CSS selector (extracts full page text if omitted)",
      },
    },
  },
  async execute(input: unknown) {
    const { selector } = (input || {}) as { selector?: string };
    const page = await session.getPage();
    if (selector) {
      const text = await page.textContent(selector);
      return text || "(empty)";
    }
    const text = await page.textContent("body");
    return (text || "(empty)").slice(0, 10000);
  },
};

const evaluateJsTool: ToolDefinition = {
  name: "browser_evaluate_js",
  description: "Evaluate JavaScript in the browser page context and return the result.",
  inputSchema: {
    type: "object",
    properties: {
      script: { type: "string", description: "JavaScript code to evaluate" },
    },
    required: ["script"],
  },
  async execute(input: unknown) {
    const { script } = input as { script: string };
    const page = await session.getPage();
    const result = await page.evaluate(script);
    return JSON.stringify(result, null, 2);
  },
};

export default defineSkill(
  {
    name: "browser-control",
    version: "0.1.0",
    description:
      "Browser automation — navigate, screenshot, click, type, extract text, evaluate JS",
    permissions: ["network", "browser"],
    systemPromptFragment:
      "You have browser control tools. Use them to automate web browsing tasks like navigating pages, clicking elements, filling forms, and extracting content.",
  },
  [
    navigateTool,
    screenshotTool,
    clickTool,
    typeTool,
    extractTextTool,
    evaluateJsTool,
  ],
);

export { session as browserSession };
