export type BackendName = "codex" | "claude";
export type BackendMode = BackendName | "auto";

export type ChatRole = "user" | "assistant";

export interface ChatRequest {
  prompt: string;
  sessionId?: string;
  backend?: BackendMode;
  strict?: boolean;
}

export interface ChatResponse {
  sessionId: string;
  backend: BackendName;
  text: string;
}

export interface ChatEventStart {
  type: "response.start";
  sessionId: string;
  backend: BackendName;
  requestId: string;
}

export interface ChatEventDelta {
  type: "response.delta";
  sessionId: string;
  backend: BackendName;
  requestId: string;
  text: string;
}

export interface ChatEventEnd {
  type: "response.end";
  sessionId: string;
  backend: BackendName;
  requestId: string;
  text: string;
}

export interface ChatEventError {
  type: "response.error";
  sessionId: string;
  backend: BackendName;
  requestId: string;
  code: string;
  message: string;
}

export type ChatEvent = ChatEventStart | ChatEventDelta | ChatEventEnd | ChatEventError;

export interface SessionRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRecord {
  id: number;
  sessionId: string;
  role: ChatRole;
  backend: BackendName | null;
  content: string;
  createdAt: string;
}
