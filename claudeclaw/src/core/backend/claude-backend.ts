import Anthropic from "@anthropic-ai/sdk";
import type {
  Backend,
  BackendEvent,
  BackendQueryOptions,
  ConversationMessage,
} from "./types.js";
import { BackendError, RateLimitError, TimeoutError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";

export class ClaudeBackend implements Backend {
  readonly name = "claude";
  private client: Anthropic;
  private abortController: AbortController | null = null;

  constructor(private apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *query(
    prompt: string,
    options: BackendQueryOptions,
  ): AsyncGenerator<BackendEvent> {
    const model = options.model || "claude-sonnet-4-20250514";
    const messages = this.buildMessages(prompt, options.messages);
    const maxToolRounds = options.maxToolRounds ?? 10;

    this.abortController = new AbortController();

    const tools = options.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
    }));

    try {
      logger.debug(`Claude query: model=${model}, messages=${messages.length}`);

      let currentMessages = [...messages];
      let round = 0;

      while (round < maxToolRounds) {
        round++;
        const stream = this.client.messages.stream({
          model,
          max_tokens: options.maxTokens || 4096,
          system: options.systemPrompt || "",
          messages: currentMessages,
          tools: tools?.length ? tools : undefined,
        });

        let hasToolCalls = false;

        for await (const event of stream) {
          if (this.abortController?.signal.aborted) break;

          if (event.type === "content_block_delta") {
            const delta = event.delta;
            if ("text" in delta && delta.text) {
              yield { type: "text", text: delta.text };
            }
          } else if (event.type === "content_block_start") {
            const block = event.content_block;
            if (block.type === "tool_use") {
              yield {
                type: "tool_use",
                toolCall: { id: block.id, name: block.name, input: {} },
              };
            }
          }
        }

        if (this.abortController?.signal.aborted) break;

        // Check final message for tool calls
        const finalMessage = await stream.finalMessage();
        const toolUseBlocks = finalMessage.content.filter(
          (b): b is Anthropic.ContentBlock & { type: "tool_use" } => b.type === "tool_use",
        );

        if (toolUseBlocks.length === 0 || !options.tools) {
          break;
        }

        hasToolCalls = true;

        // Execute tool calls and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of toolUseBlocks) {
          const tool = options.tools.find((t) => t.name === block.name);
          if (tool) {
            try {
              const result = await tool.execute(block.input);
              yield {
                type: "tool_result",
                toolResult: { id: block.id, output: result },
              };
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
            } catch (err) {
              const errStr = String(err);
              yield {
                type: "tool_result",
                toolResult: { id: block.id, output: errStr, isError: true },
              };
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: errStr,
                is_error: true,
              });
            }
          }
        }

        if (!hasToolCalls) break;

        // Append assistant message and tool results for next round
        currentMessages = [
          ...currentMessages,
          { role: "assistant" as const, content: finalMessage.content },
          { role: "user" as const, content: toolResults },
        ];

        logger.debug(`Claude tool round ${round}: ${toolUseBlocks.length} tool calls, continuing...`);
      }

      yield { type: "done" };
    } catch (err) {
      if (this.abortController?.signal.aborted) {
        yield { type: "done" };
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Claude backend error: ${message}`);
      yield { type: "error", error: message };

      // Classify error by type
      const status = (err as any)?.status;
      if (status === 429) {
        throw new RateLimitError(`Claude rate limited: ${message}`, err);
      }
      if (message.toLowerCase().includes("timeout") || (err as any)?.code === "ETIMEDOUT") {
        throw new TimeoutError(`Claude request timed out: ${message}`, err);
      }
      throw new BackendError(`Claude query failed: ${message}`, err);
    } finally {
      this.abortController = null;
    }
  }

  async interrupt(): Promise<void> {
    this.abortController?.abort();
  }

  private buildMessages(
    prompt: string,
    history?: ConversationMessage[],
  ): Anthropic.MessageParam[] {
    const msgs: Anthropic.MessageParam[] = [];
    if (history) {
      for (const m of history) {
        msgs.push({ role: m.role, content: m.content });
      }
    }
    msgs.push({ role: "user", content: prompt });
    return msgs;
  }
}
