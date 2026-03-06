// ── Ollama LLM Provider ──
// Implements the LLMProvider interface using Ollama's OpenAI-compatible API.
// Runs locally — no API key required.

import type { LLMProvider, LLMResponse, LLMStreamDelta, Message, ToolCall, ToolDefinition } from './types.js';

export class OllamaProvider implements LLMProvider {
    private baseUrl: string;

    constructor(baseUrl = 'http://localhost:11434') {
        this.baseUrl = baseUrl.replace(/\/+$/, '');
    }

    private buildRequestBody(
        messages: Message[],
        tools: ToolDefinition[],
        model: string,
        options?: Record<string, unknown>,
        stream = false
    ): Record<string, unknown> {
        const body: Record<string, unknown> = {
            model,
            messages: messages.map(m => {
                const msg: Record<string, unknown> = { role: m.role, content: m.content };
                if (m.tool_calls && m.tool_calls.length > 0) {
                    msg.tool_calls = m.tool_calls;
                }
                if (m.tool_call_id) {
                    msg.tool_call_id = m.tool_call_id;
                }
                return msg;
            }),
            stream,
            options: {
                num_predict: (options?.max_tokens as number) || 4096,
                temperature: (options?.temperature as number) ?? 0.7,
            },
        };

        if (tools.length > 0) {
            body.tools = tools;
        }

        return body;
    }

    async chat(
        messages: Message[],
        tools: ToolDefinition[],
        model: string,
        options?: Record<string, unknown>
    ): Promise<LLMResponse> {
        const body = this.buildRequestBody(messages, tools, model, options, false);

        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error (${response.status}): ${errorText}`);
        }

        const data = await response.json() as {
            message: {
                content?: string;
                tool_calls?: Array<{
                    function: { name: string; arguments: Record<string, unknown> };
                }>;
            };
            prompt_eval_count?: number;
            eval_count?: number;
        };

        const toolCalls: ToolCall[] = (data.message.tool_calls || []).map((tc, i) => ({
            id: `call_${Date.now()}_${i}`,
            type: 'function' as const,
            function: {
                name: tc.function.name,
                arguments: typeof tc.function.arguments === 'string'
                    ? tc.function.arguments
                    : JSON.stringify(tc.function.arguments),
            },
        }));

        return {
            content: data.message.content || '',
            tool_calls: toolCalls,
            usage: data.prompt_eval_count != null ? {
                prompt_tokens: data.prompt_eval_count,
                completion_tokens: data.eval_count || 0,
                total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
            } : undefined,
        };
    }

    async *chatStream(
        messages: Message[],
        tools: ToolDefinition[],
        model: string,
        options?: Record<string, unknown>
    ): AsyncGenerator<LLMStreamDelta, LLMResponse> {
        const body = this.buildRequestBody(messages, tools, model, options, true);

        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error (${response.status}): ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body for streaming');

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let usage: LLMResponse['usage'] | undefined;
        const collectedToolCalls: ToolCall[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                let parsed: any;
                try {
                    parsed = JSON.parse(trimmed);
                } catch {
                    continue;
                }

                const msg = parsed.message;
                if (!msg) continue;

                // Text content delta
                if (msg.content) {
                    fullContent += msg.content;
                    yield { type: 'text_delta', content: msg.content };
                }

                // Tool calls (Ollama sends them in the final chunk)
                if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
                    for (let i = 0; i < msg.tool_calls.length; i++) {
                        const tc = msg.tool_calls[i];
                        const toolCall: ToolCall = {
                            id: `call_${Date.now()}_${i}`,
                            type: 'function',
                            function: {
                                name: tc.function.name,
                                arguments: typeof tc.function.arguments === 'string'
                                    ? tc.function.arguments
                                    : JSON.stringify(tc.function.arguments),
                            },
                        };
                        collectedToolCalls.push(toolCall);

                        yield {
                            type: 'tool_call_delta',
                            tool_call: {
                                index: i,
                                id: toolCall.id,
                                type: 'function',
                                function: toolCall.function,
                            },
                        };
                    }
                }

                // Final chunk contains usage stats
                if (parsed.done) {
                    if (parsed.prompt_eval_count != null) {
                        usage = {
                            prompt_tokens: parsed.prompt_eval_count,
                            completion_tokens: parsed.eval_count || 0,
                            total_tokens: (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0),
                        };
                    }
                }
            }
        }

        return {
            content: fullContent,
            tool_calls: collectedToolCalls,
            usage,
        };
    }
}
