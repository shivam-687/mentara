import type { Tool, ToolResult } from './types.js';

/**
 * Tool to display syntaxt-highlighted code.
 */
export const createShowCodeTool = (): Tool => ({
    name: 'show_code',
    description: 'Display syntax-highlighted code snippets to the student. Use this for examples, solutions, or reference code.',
    parameters: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'Unique ID for this code block' },
            code: { type: 'string', description: 'The code to display' },
            language: { type: 'string', description: 'Programming language (e.g. javascript, python, css)' },
            filename: { type: 'string', description: 'Optional filename to show' },
            lineNumbers: { type: 'string', description: 'Whether to show line numbers ("visible" or "hidden")' }
        },
        required: ['id', 'code']
    },
    execute: async (args) => ({ content: 'Code artifact displayed to student. Results will be shown in the UI.', error: undefined })
});

/**
 * Tool to display a list of selectable options (quizzes).
 */
export const createShowOptionsTool = (): Tool => ({
    name: 'show_options',
    description: 'MANDATORY for Multiple Choice Questions. Present multiple choices or a quiz to the student for knowledge checks and active recall.',
    parameters: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'Unique ID for this option list (e.g. q1, q2)' },
            title: { type: 'string', description: 'Short question title shown above the options' },
            description: { type: 'string', description: 'Optional question prompt or hint shown above the options' },
            options: {
                type: 'array',
                description: 'List of options to choose from',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Unique ID for the option' },
                        label: { type: 'string', description: 'Visual label for the option' },
                        description: { type: 'string', description: 'Optional explanation of the option' }
                    },
                    required: ['id', 'label']
                }
            } as any,
            selectionMode: { type: 'string', enum: ['single', 'multi'], description: 'Allow single or multiple selections' }
            ,
            responseActions: {
                type: 'array',
                description: 'Optional footer actions for the option list, such as confirm/cancel',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        variant: { type: 'string', description: 'Visual style like default, outline, ghost' }
                    },
                    required: ['id', 'label']
                }
            } as any
        },
        required: ['id', 'options']
    },
    execute: async (args) => ({ content: 'Options artifact displayed to student. Waiting for selection.', error: undefined })
});

/**
 * Tool to display a multi-step question flow.
 */
export const createShowQuestionFlowTool = (): Tool => ({
    name: 'show_question_flow',
    description: 'MANDATORY for Module Intros. Present a structured learning path or a guided set of steps to the student.',
    parameters: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'Unique ID for this flow' },
            steps: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Step ID' },
                        title: { type: 'string', description: 'Title of the step' },
                        options: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', description: 'Option ID' },
                                    label: { type: 'string', description: 'Option label' }
                                }
                            }
                        }
                    }
                }
            } as any
        },
        required: ['id', 'steps']
    },
    execute: async (args) => ({ content: 'Question flow artifact displayed to student.', error: undefined })
});
