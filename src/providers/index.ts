// ── Provider Factory ──

import type { LLMProvider } from './types.js';
import { OpenRouterProvider } from './openrouter.js';
import { OllamaProvider } from './ollama.js';

export type ProviderType = 'openrouter' | 'ollama';

export function createProvider(type: ProviderType, options: { apiKey?: string; baseUrl?: string }): LLMProvider {
    switch (type) {
        case 'ollama':
            return new OllamaProvider(options.baseUrl);
        case 'openrouter':
        default:
            return new OpenRouterProvider(options.apiKey || '');
    }
}

export type { LLMProvider, LLMResponse, LLMStreamDelta, Message, ToolCall, ToolDefinition } from './types.js';
export { OpenRouterProvider } from './openrouter.js';
export { OllamaProvider } from './ollama.js';
