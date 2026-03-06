// ── Show Test Artifact Tool ──
// UI artifact tool that presents a multi-question timed assessment.

import type { Tool, ToolResult } from './types.js';

export function createShowTestTool(): Tool {
    return {
        name: 'show_test',
        description: `Present a timed test/assessment to the student with multiple questions. Supports MCQ, true/false, fill-in-blank, and ordering question types. Shows a score card at the end. Use this for mini-assessments after 2-3 subtopics (3-5 questions) or comprehensive module assessments (8-10 questions).`,
        parameters: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Unique ID for this test' },
                title: { type: 'string', description: 'Test title (e.g. "Module 1 Assessment")' },
                description: { type: 'string', description: 'Brief description of what this test covers' },
                timeLimit: { type: 'number', description: 'Time limit in seconds (e.g. 300 for 5 minutes). Omit for untimed.' },
                questions: {
                    type: 'array',
                    description: 'Array of test questions',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'Question ID' },
                            type: {
                                type: 'string',
                                enum: ['mcq', 'true_false', 'fill_blank', 'ordering'],
                                description: 'Question type',
                            },
                            text: { type: 'string', description: 'The question text' },
                            options: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        label: { type: 'string' },
                                    },
                                    required: ['id', 'label'],
                                },
                                description: 'Answer options (for MCQ, true_false, ordering)',
                            },
                            correctAnswer: { type: 'string', description: 'The correct answer ID or text' },
                            explanation: { type: 'string', description: 'Explanation shown after answering' },
                            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                            topic: { type: 'string', description: 'Topic tag for this question' },
                        },
                        required: ['id', 'type', 'text', 'correctAnswer'],
                    },
                },
            },
            required: ['id', 'title', 'questions'],
        },
        async execute(_args: Record<string, unknown>): Promise<ToolResult> {
            return { content: 'Test artifact displayed to student. Waiting for completion.' };
        },
    };
}
