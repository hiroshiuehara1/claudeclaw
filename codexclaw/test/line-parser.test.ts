import { describe, expect, it } from "vitest";
import { parseModelOutputLine } from "../src/core/adapters/line-parser.js";

describe("parseModelOutputLine", () => {
  it("extracts fragments from JSON lines", () => {
    const line = JSON.stringify({ type: "delta", delta: "hello" });
    expect(parseModelOutputLine(line)).toEqual(["hello"]);
  });

  it("drops JSON metadata lines that do not contain content", () => {
    const line = JSON.stringify({ type: "thread.started", thread_id: "abc" });
    expect(parseModelOutputLine(line)).toEqual([]);
  });

  it("does not treat output_style metadata as assistant text", () => {
    const line = JSON.stringify({ type: "system", output_style: "default" });
    expect(parseModelOutputLine(line)).toEqual([]);
  });

  it("falls back to plain text", () => {
    expect(parseModelOutputLine("hello")).toEqual(["hello\n"]);
  });
});
