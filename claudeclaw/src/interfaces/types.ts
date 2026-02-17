import type { Engine } from "../core/engine.js";

export interface InterfaceMessage {
  text: string;
  sessionId: string;
  userId?: string;
}

export interface InterfaceAdapter {
  start(engine: Engine): Promise<void>;
  stop(): Promise<void>;
}
