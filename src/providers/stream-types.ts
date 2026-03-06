// ── SSE Event Types ──
// Shared between backend (emitter) and frontend (consumer).

import type { ToolCall } from './types.js';

export type SessionEvent =
    | { type: 'text_delta'; content: string }
    | { type: 'tool_call'; id: string; name: string; args: Record<string, unknown> }
    | { type: 'status'; class: unknown; progress: unknown }
    | { type: 'error'; message: string }
    | { type: 'done' };

// UI artifact tool names — only these get forwarded to the frontend as tool_call events
export const UI_ARTIFACT_TOOLS = new Set([
    'show_code', 'show_options', 'show_question_flow', 'show_html',
    'show_test', 'show_flashcards', 'show_interactive',
]);

export function isUIArtifactTool(toolCall: ToolCall): boolean {
    return UI_ARTIFACT_TOOLS.has(toolCall.function.name);
}
