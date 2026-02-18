import { logger } from "./logger.js";

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
}

const TRANSIENT_STATUS_CODES = [429, 503, 502, 500];

function isTransientError(err: unknown): boolean {
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    if (
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("etimedout") ||
      message.includes("socket hang up") ||
      message.includes("network")
    ) {
      return true;
    }
    // Check for HTTP status codes in error
    const statusMatch = message.match(/(\d{3})/);
    if (statusMatch && TRANSIENT_STATUS_CODES.includes(Number(statusMatch[1]))) {
      return true;
    }
    // Check status property on error objects
    if ("status" in err && typeof (err as Record<string, unknown>).status === "number") {
      return TRANSIENT_STATUS_CODES.includes((err as Record<string, unknown>).status as number);
    }
  }
  return false;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelay = options.baseDelay ?? 1000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt >= maxRetries || !isTransientError(err)) {
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn(
        `Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${err instanceof Error ? err.message : String(err)}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export { isTransientError };
