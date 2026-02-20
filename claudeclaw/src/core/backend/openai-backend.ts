import OpenAI from "openai";
import type {
  Backend,
  BackendEvent,
  BackendQueryOptions,
  ConversationMessage,
} from "./types.js";
import { BackendError, RateLimitError, TimeoutError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";

export class OpenAIBackend implements Backend {
  readonly name = "openai";
  private client: OpenAI;
  private abortController: AbortController | null = null;

  constructor(private apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async *query(
    prompt: string,
    options: BackendQueryOptions,
  ): AsyncGenerator<BackendEvent> {
    const model = options.model || "gpt-4o";
    const initialMessages = this.buildMessages(prompt, options);
    const maxToolRounds = options.maxToolRounds ?? 10;

    this.abortController = new AbortController();

    const tools = options.tools?.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      },
    }));

    try {
      logger.debug(`OpenAI query: model=${model}, messages=${initialMessages.length}`);

      let currentMessages: OpenAI.ChatCompletionMessageParam[] = [...initialMessages];
      let round = 0;

      while (round < maxToolRounds) {
        round++;

        const stream = await this.client.chat.completions.create({
          model,
          messages: currentMessages,
          max_tokens: options.maxTokens || 4096,
          stream: true,
          tools: tools?.length ? tools : undefined,
        });

        const toolCalls: Map<
          number,
          { id: string; name: string; args: string }
        > = new Map();

        for await (const chunk of stream) {
          if (this.abortController?.signal.aborted) break;

          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            yield { type: "text", text: delta.content };
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const existing = toolCalls.get(tc.index);
              if (existing) {
                if (tc.function?.arguments) existing.args += tc.function.arguments;
              } else {
                toolCalls.set(tc.index, {
                  id: tc.id || "",
                  name: tc.function?.name || "",
                  args: tc.function?.arguments || "",
                });
              }
            }
          }
        }

        if (this.abortController?.signal.aborted) break;

        // No tool calls — we're done
        if (toolCalls.size === 0 || !options.tools) {
          break;
        }

        // Execute tool calls and build messages for next round
        const assistantToolCalls: OpenAI.ChatCompletionMessageParam = {
          role: "assistant",
          tool_calls: Array.from(toolCalls.values()).map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.args },
          })),
        };

        const toolResultMessages: OpenAI.ChatCompletionToolMessageParam[] = [];

        for (const [, tc] of toolCalls) {
          yield {
            type: "tool_use",
            toolCall: { id: tc.id, name: tc.name, input: JSON.parse(tc.args || "{}") },
          };

          const tool = options.tools.find((t) => t.name === tc.name);
          if (tool) {
            try {
              const result = await tool.execute(JSON.parse(tc.args || "{}"));
              yield {
                type: "tool_result",
                toolResult: { id: tc.id, output: result },
              };
              toolResultMessages.push({
                role: "tool",
                tool_call_id: tc.id,
                content: result,
              });
            } catch (err) {
              const errStr = String(err);
              yield {
                type: "tool_result",
                toolResult: { id: tc.id, output: errStr, isError: true },
              };
              toolResultMessages.push({
                role: "tool",
                tool_call_id: tc.id,
                content: errStr,
              });
            }
          }
        }

        // Append assistant + tool results for next round
        currentMessages = [
          ...currentMessages,
          assistantToolCalls,
          ...toolResultMessages,
        ];

        logger.debug(`OpenAI tool round ${round}: ${toolCalls.size} tool calls, continuing...`);
      }

      yield { type: "done" };
    } catch (err) {
      if (this.abortController?.signal.aborted) {
        yield { type: "done" };
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`OpenAI backend error: ${message}`);
      yield { type: "error", error: message };

      // Classify error by type
      const status = (err as any)?.status;
      if (status === 429) {
        throw new RateLimitError(`OpenAI rate limited: ${message}`, err);
      }
      if (message.toLowerCase().includes("timeout") || (err as any)?.code === "ETIMEDOUT") {
        throw new TimeoutError(`OpenAI request timed out: ${message}`, err);
      }
      throw new BackendError(`OpenAI query failed: ${message}`, err);
    } finally {
      this.abortController = null;
    }
  }

  async interrupt(): Promise<void> {
    this.abortController?.abort();
  }

  private buildMessages(
    prompt: string,
    options: BackendQueryOptions,
  ): OpenAI.ChatCompletionMessageParam[] {
    const msgs: OpenAI.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      msgs.push({ role: "system", content: options.systemPrompt });
    }

    if (options.messages) {
      for (const m of options.messages) {
        msgs.push({ role: m.role, content: m.content });
      }
    }

    msgs.push({ role: "user", content: prompt });
    return msgs;
  }
}
