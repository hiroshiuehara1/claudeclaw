import { z } from "zod";

export const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(100_000),
  sessionId: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  backend: z.string().max(50).optional(),
});

export const WebSocketMessageSchema = z.object({
  prompt: z.string().min(1).max(100_000),
  model: z.string().max(100).optional(),
  sessionId: z.string().max(100).optional(),
  backend: z.string().max(50).optional(),
});
