// ── Show Flashcards Artifact Tool ──
// UI artifact tool that presents an interactive flashcard deck.

import type { Tool, ToolResult } from './types.js';

export function createShowFlashcardsTool(): Tool {
    return {
        name: 'show_flashcards',
        description: `Present an interactive flashcard deck for active recall practice. Cards have a front (question/prompt) and back (answer/explanation). Students flip cards and mark them as "known" or "needs review". Use this when introducing key terminology, after completing a module, or when a student needs to memorize important concepts.`,
        parameters: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Unique ID for this flashcard deck' },
                title: { type: 'string', description: 'Deck title (e.g. "JavaScript Array Methods")' },
                cards: {
                    type: 'array',
                    description: 'Array of flashcards',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'Card ID' },
                            front: { type: 'string', description: 'Front of card (question/prompt/term)' },
                            back: { type: 'string', description: 'Back of card (answer/definition/explanation)' },
                            topic: { type: 'string', description: 'Topic tag for this card' },
                        },
                        required: ['id', 'front', 'back'],
                    },
                },
            },
            required: ['id', 'title', 'cards'],
        },
        async execute(_args: Record<string, unknown>): Promise<ToolResult> {
            return { content: 'Flashcard deck displayed to student.' };
        },
    };
}
