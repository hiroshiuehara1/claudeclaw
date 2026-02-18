import { describe, expect, it } from "vitest";
import { normalizeStrictOneShotText } from "../src/interfaces/cli/normalize-one-shot.js";

describe("normalizeStrictOneShotText", () => {
  it("strips codex preface wrappers", () => {
    expect(normalizeStrictOneShotText("**Preparing exact final reply**OK")).toBe("OK");
  });

  it("normalizes leaked default prefix and duplicate token", () => {
    expect(normalizeStrictOneShotText("defaultOKOK")).toBe("OK");
  });

  it("returns the last non-empty line", () => {
    const input = "Reasoning...\n\nFinal:\nOK";
    expect(normalizeStrictOneShotText(input)).toBe("OK");
  });

  it("keeps plain answers unchanged", () => {
    expect(normalizeStrictOneShotText("hello world")).toBe("hello world");
  });
});
