export type BackendEventType = "text" | "tool_use" | "tool_result" | "error" | "done";

export interface BackendEvent {
  type: BackendEventType;
  /** Incremental text chunk for "text" events */
  text?: string;
  /** Tool call info for "tool_use" events */
  toolCall?: {
    id: string;
    name: string;
    input: unknown;
  };
  /** Tool result for "tool_result" events */
  toolResult?: {
    id: string;
    output: string;
    isError?: boolean;
  };
  /** Error message for "error" events */
  error?: string;
}

export interface BackendQueryOptions {
  model?: string;
  systemPrompt?: string;
  messages?: ConversationMessage[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  signal?: AbortSignal;
  requestId?: string;
  maxToolRounds?: number;
  /** Override backend for this request (request-scoped, doesn't mutate engine state) */
  backend?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: unknown) => Promise<string>;
}

export interface Backend {
  readonly name: string;
  query(prompt: string, options: BackendQueryOptions): AsyncGenerator<BackendEvent>;
  interrupt(): Promise<void>;
}
