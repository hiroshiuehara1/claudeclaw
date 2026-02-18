function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const INTERESTING_KEYS = new Set(["text", "delta"]);

function isInterestingKey(key: string): boolean {
  return INTERESTING_KEYS.has(key.toLowerCase());
}

function collectStrings(
  value: unknown,
  depth: number,
  output: string[],
  keyHint = ""
): void {
  if (depth > 5) {
    return;
  }

  if (typeof value === "string") {
    if (isInterestingKey(keyHint)) {
      output.push(value);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, depth + 1, output, keyHint);
    }
    return;
  }

  if (!isObject(value)) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (typeof child === "string") {
      if (isInterestingKey(key)) {
        output.push(child);
      }
      continue;
    }
    collectStrings(child, depth + 1, output, key);
  }
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(value);
  }
  return result;
}

export function parseModelOutputLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const fragments: string[] = [];
    collectStrings(parsed, 0, fragments);
    const cleaned = uniqueNonEmpty(fragments);
    if (cleaned.length > 0) {
      return cleaned;
    }
    // Structured event lines (for example codex/claude stream metadata) should not be emitted.
    return [];
  } catch {
    // Fall through to plain text behavior.
  }

  return [line + "\n"];
}
