import type { BackendName } from "../types.js";

export interface BackendInvokeRequest {
  prompt: string;
  sessionId: string;
  workspaceDir: string;
  timeoutMs: number;
  maxOutputBytes: number;
  abortSignal?: AbortSignal;
}

export interface BackendStreamEvent {
  type: "delta";
  text: string;
}

export interface BackendAdapter {
  readonly name: BackendName;
  invoke(request: BackendInvokeRequest): AsyncGenerator<BackendStreamEvent>;
}
