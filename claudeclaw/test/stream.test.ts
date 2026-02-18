import { describe, it, expect } from "vitest";
import { collectStream, mapStream } from "../src/utils/stream.js";

async function* generate<T>(...items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item;
  }
}

describe("collectStream", () => {
  it("should collect all items into an array", async () => {
    const items = await collectStream(generate(1, 2, 3));
    expect(items).toEqual([1, 2, 3]);
  });

  it("should return empty array for empty generator", async () => {
    const items = await collectStream(generate());
    expect(items).toEqual([]);
  });
});

describe("mapStream", () => {
  it("should transform each item", async () => {
    const doubled = mapStream(generate(1, 2, 3), (x) => x * 2);
    const items = await collectStream(doubled);
    expect(items).toEqual([2, 4, 6]);
  });

  it("should handle string mapping", async () => {
    const upper = mapStream(generate("a", "b"), (s) => s.toUpperCase());
    const items = await collectStream(upper);
    expect(items).toEqual(["A", "B"]);
  });
});
