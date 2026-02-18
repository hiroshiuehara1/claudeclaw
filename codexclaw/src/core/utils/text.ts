const ANSI_PATTERN = /\x1B\[[0-9;]*m/g;

export function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, "");
}

export function trimPrompt(value: string): string {
  return value.trim();
}
