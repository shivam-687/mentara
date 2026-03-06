// ── Record Question-Answer Tool ──
// Non-UI tool that records every Q&A pair for revision tracking.
// The LLM should call this after evaluating EVERY student answer.

import type { Tool, ToolResult } from './types.js';
import type { SessionManager } from '../session/manager.js';

export function createRecordQuestionAnswerTool(sessionManager: SessionManager): Tool {
    return {
        name: 'record_question_answer',
        description: `Record a question-answer pair after evaluating a student's response. Stores the question, student's answer, correctness, topic, and difficulty for revision and spaced repetition tracking. You MUST call this after evaluating EVERY answer — MCQ, open-ended, test results, etc.`,
        parameters: {
            type: 'object',
            properties: {
                class_id: { type: 'string', description: 'The class ID' },
                module_id: { type: 'string', description: 'Current module ID' },
                subtopic: { type: 'string', description: 'The subtopic being tested' },
                question_text: { type: 'string', description: 'The full question text' },
                question_type: {
                    type: 'string',
                    description: 'Type of question',
                    enum: ['mcq', 'true_false', 'fill_blank', 'open_ended', 'ordering'],
                },
                user_answer: { type: 'string', description: 'What the student answered' },
                correct_answer: { type: 'string', description: 'The correct answer' },
                is_correct: { type: 'string', description: '"true" or "false"' },
                difficulty: {
                    type: 'string',
                    description: 'Question difficulty level',
                    enum: ['easy', 'medium', 'hard'],
                },
                topic: { type: 'string', description: 'Specific topic tag for filtering during revision' },
                explanation: { type: 'string', description: 'Explanation of why the answer is correct or incorrect' },
            },
            required: ['class_id', 'question_text', 'question_type', 'user_answer', 'correct_answer', 'is_correct'],
        },
        async execute(args: Record<string, unknown>): Promise<ToolResult> {
            try {
                const id = await sessionManager.recordQuestionAnswer({
                    classId: args.class_id as string,
                    moduleId: args.module_id as string | undefined,
                    subtopic: args.subtopic as string | undefined,
                    questionText: args.question_text as string,
                    questionType: args.question_type as string,
                    userAnswer: args.user_answer as string,
                    correctAnswer: args.correct_answer as string,
                    isCorrect: (args.is_correct as string) === 'true',
                    difficulty: args.difficulty as string | undefined,
                    topic: args.topic as string | undefined,
                    explanation: args.explanation as string | undefined,
                });
                return { content: JSON.stringify({ recorded: true, id }) };
            } catch (err) {
                return { content: '', error: (err as Error).message };
            }
        },
    };
}
