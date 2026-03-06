// ── OpenRouter LLM Provider ──
// Implements the LLMProvider interface using OpenRouter's OpenAI-compatible API.
// Supports tool calling and streaming.

import type { LLMProvider, LLMResponse, LLMStreamDelta, Message, ToolCall, ToolDefinition } from './types.js';

export class OpenRouterProvider implements LLMProvider {
    private apiKey: string;
    private baseUrl = 'https://openrouter.ai/api/v1';

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('OpenRouter API key is required. Set OPENROUTER_API_KEY in your .env file.');
        }
        this.apiKey = apiKey;
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
            max_tokens: (options?.max_tokens as number) || 4096,
            temperature: (options?.temperature as number) ?? 0.7,
            stream,
        };

        if (tools.length > 0) {
            body.tools = tools;
            body.tool_choice = 'auto';
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

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': 'https://mentara.dev',
                'X-Title': 'Mentara AI Tutor',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const data = await response.json() as {
            choices: Array<{
                message: {
                    content?: string | null;
                    tool_calls?: Array<{
                        id: string;
                        type: string;
                        function: { name: string; arguments: string };
                    }>;
                };
            }>;
            usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        };

        const choice = data.choices?.[0];
        if (!choice) {
            throw new Error('OpenRouter returned no choices');
        }

        const toolCalls: ToolCall[] = (choice.message.tool_calls || []).map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
                name: tc.function.name,
                arguments: tc.function.arguments,
            },
        }));

        return {
            content: choice.message.content || '',
            tool_calls: toolCalls,
            usage: data.usage,
        };
    }

    async *chatStream(
        messages: Message[],
        tools: ToolDefinition[],
        model: string,
        options?: Record<string, unknown>
    ): AsyncGenerator<LLMStreamDelta, LLMResponse> {
        const body = this.buildRequestBody(messages, tools, model, options, true);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': 'https://mentara.dev',
                'X-Title': 'Mentara AI Tutor',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body for streaming');

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        const toolCallAccumulators: Map<number, { id: string; name: string; arguments: string }> = new Map();
        let usage: LLMResponse['usage'] | undefined;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;

                const data = trimmed.slice(6);
                if (data === '[DONE]') continue;

                let parsed: any;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    continue;
                }

                const delta = parsed.choices?.[0]?.delta;
                if (!delta) {
                    if (parsed.usage) usage = parsed.usage;
                    continue;
                }

                // Text content delta
                if (delta.content) {
                    fullContent += delta.content;
                    yield { type: 'text_delta', content: delta.content };
                }

                // Tool call deltas
                if (delta.tool_calls) {
                    for (const tc of delta.tool_calls) {
                        const idx = tc.index ?? 0;
                        if (!toolCallAccumulators.has(idx)) {
                            toolCallAccumulators.set(idx, {
                                id: tc.id || '',
                                name: tc.function?.name || '',
                                arguments: '',
                            });
                        }
                        const acc = toolCallAccumulators.get(idx)!;
                        if (tc.id) acc.id = tc.id;
                        if (tc.function?.name) acc.name = tc.function.name;
                        if (tc.function?.arguments) acc.arguments += tc.function.arguments;

                        yield {
                            type: 'tool_call_delta',
                            tool_call: {
                                index: idx,
                                id: acc.id,
                                type: 'function',
                                function: { name: acc.name, arguments: tc.function?.arguments || '' },
                            },
                        };
                    }
                }
            }
        }

        // Build final tool calls from accumulators
        const toolCalls: ToolCall[] = [];
        for (const [, acc] of [...toolCallAccumulators.entries()].sort((a, b) => a[0] - b[0])) {
            toolCalls.push({
                id: acc.id,
                type: 'function',
                function: { name: acc.name, arguments: acc.arguments },
            });
        }

        return {
            content: fullContent,
            tool_calls: toolCalls,
            usage,
        };
    }
}
