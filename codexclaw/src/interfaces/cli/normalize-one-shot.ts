function maybeUnwrapRepeated(value: string): string {
  if (!value || value.length % 2 !== 0) {
    return value;
  }
  const half = value.length / 2;
  if (value.slice(0, half) === value.slice(half)) {
    return value.slice(0, half);
  }
  return value;
}

function stripWrapperPrefix(value: string): string {
  let result = value.trim();
  result = result.replace(/^(?:\*\*[^*]+\*\*\s*)+/g, "");
  if (result.startsWith("default") && result.length > "default".length) {
    result = result.slice("default".length);
  }
  result = result.trim();
  return result;
}

function normalizeLine(value: string): string {
  let line = stripWrapperPrefix(value);
  line = line.replace(/^[-*>]\s+/, "").trim();
  if (line.startsWith("`") && line.endsWith("`") && line.length > 1) {
    line = line.slice(1, -1).trim();
  }
  if (line.startsWith('"') && line.endsWith('"') && line.length > 1) {
    line = line.slice(1, -1).trim();
  }
  return maybeUnwrapRepeated(line);
}

export function normalizeStrictOneShotText(raw: string): string {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return normalized;
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return "";
  }

  const candidate = normalizeLine(lines[lines.length - 1]);
  return candidate || normalizeLine(normalized) || normalized;
}
