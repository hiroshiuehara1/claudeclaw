import type { ConversationMessage } from "../backend/types.js";

/**
 * Truncate conversation history using a sliding window.
 * Keeps the first message (for context) and the last N messages.
 */
export function truncateHistory(
  messages: ConversationMessage[],
  maxMessages: number,
): ConversationMessage[] {
  if (messages.length <= maxMessages) {
    return messages;
  }

  if (maxMessages <= 1) {
    return messages.slice(-1);
  }

  // Keep first message + last (maxMessages - 1) messages
  const first = messages[0];
  const tail = messages.slice(-(maxMessages - 1));
  return [first, ...tail];
}
