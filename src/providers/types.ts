// ── LLM Provider Types ──
// Provider-agnostic interfaces for LLM communication.
// Inspired by PicoClaw's providers package.

export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string; // JSON string
    };
}

export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}

export interface LLMResponse {
    content: string;
    tool_calls: ToolCall[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface LLMStreamDelta {
    type: 'text_delta' | 'tool_call_delta' | 'done';
    content?: string;
    tool_call?: Partial<ToolCall> & { index?: number };
}

export interface LLMProvider {
    chat(
        messages: Message[],
        tools: ToolDefinition[],
        model: string,
        options?: Record<string, unknown>
    ): Promise<LLMResponse>;

    chatStream(
        messages: Message[],
        tools: ToolDefinition[],
        model: string,
        options?: Record<string, unknown>
    ): AsyncGenerator<LLMStreamDelta, LLMResponse>;
}
