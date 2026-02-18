import type { Config } from "./config/schema.js";
import type { Backend, BackendEvent, BackendQueryOptions, ToolDefinition } from "./backend/types.js";
import type { MemoryManager } from "./memory/memory-manager.js";
import type { SkillRegistry } from "./skill/registry.js";
import { createBackend } from "./backend/backend-factory.js";
import { logger, createChildLogger } from "../utils/logger.js";
import { BackendError } from "../utils/errors.js";

export interface EngineOptions {
  config: Config;
  backend?: Backend;
  memoryManager?: MemoryManager;
  skillRegistry?: SkillRegistry;
}

export class Engine {
  readonly config: Config;
  private backend: Backend;
  private memoryManager?: MemoryManager;
  private skillRegistry?: SkillRegistry;

  constructor(options: EngineOptions) {
    this.config = options.config;
    this.backend = options.backend || createBackend(options.config);
    this.memoryManager = options.memoryManager;
    this.skillRegistry = options.skillRegistry;
  }

  get memory(): MemoryManager | undefined {
    return this.memoryManager;
  }

  async *chat(
    prompt: string,
    sessionId: string,
    options: Partial<BackendQueryOptions> = {},
  ): AsyncGenerator<BackendEvent> {
    const log = createChildLogger({ sessionId });
    log.debug(`Engine.chat: prompt=${prompt.slice(0, 80)}...`);

    // Build system prompt with memory context
    let systemPrompt = this.config.systemPrompt || "You are ClaudeClaw, a helpful personal AI assistant.";

    if (this.memoryManager) {
      const context = await this.memoryManager.loadContext(sessionId);
      if (context) {
        systemPrompt += `\n\n<memory>\n${context}\n</memory>`;
      }

      // Semantic search for relevant past context
      const topK = this.config.vectorMemory?.topK || 5;
      const semanticResults = await this.memoryManager.search(prompt, topK);
      if (semanticResults.length > 0) {
        const relevant = semanticResults.map((r) => `- ${r.content}`).join("\n");
        systemPrompt += `\n\n<relevant_context>\n${relevant}\n</relevant_context>`;
      }
    }

    // Gather tools from skill registry
    const tools: ToolDefinition[] = [];
    if (this.skillRegistry) {
      tools.push(...this.skillRegistry.getAllTools());
    }

    // Load conversation history
    const messages = this.memoryManager
      ? await this.memoryManager.getHistory(sessionId)
      : options.messages || [];

    // Set up timeout via AbortController
    const timeout = this.config.engine?.chatTimeout ?? 120_000;
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeout);

    const queryOptions: BackendQueryOptions = {
      ...options,
      systemPrompt,
      messages,
      tools: tools.length > 0 ? tools : options.tools,
      signal: abortController.signal,
    };

    // Persist user message
    if (this.memoryManager) {
      await this.memoryManager.addMessage(sessionId, "user", prompt);
    }

    let fullResponse = "";

    try {
      for await (const event of this.backend.query(prompt, queryOptions)) {
        if (abortController.signal.aborted) {
          yield { type: "error" as const, error: "Request timed out" };
          break;
        }
        if (event.type === "text" && event.text) {
          fullResponse += event.text;
        }
        yield event;
      }
    } catch (err) {
      if (abortController.signal.aborted) {
        log.warn("Chat request timed out");
        yield { type: "error" as const, error: "Request timed out" };
        return;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    // Persist assistant response
    if (this.memoryManager && fullResponse) {
      await this.memoryManager.addMessage(sessionId, "assistant", fullResponse);
    }

    // Handle "remember" commands
    if (this.memoryManager && /^remember\b/i.test(prompt)) {
      await this.memoryManager.remember(prompt.replace(/^remember\s+/i, ""));
    }
  }

  async interrupt(): Promise<void> {
    await this.backend.interrupt();
  }

  setBackend(backend: Backend): void {
    this.backend = backend;
  }

  setMemoryManager(mm: MemoryManager): void {
    this.memoryManager = mm;
  }

  setSkillRegistry(sr: SkillRegistry): void {
    this.skillRegistry = sr;
  }

  async shutdown(): Promise<void> {
    logger.info("Engine shutting down...");
    await this.skillRegistry?.shutdown();
    await this.memoryManager?.close();
  }
}
