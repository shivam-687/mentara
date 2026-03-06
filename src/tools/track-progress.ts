// ── Progress Tracking Tool ──
// Tracks and updates student progress via database.

import type { Tool, ToolResult } from './types.js';
import type { SessionManager } from '../session/manager.js';

export function createGetProgressTool(sessionManager: SessionManager): Tool {
    return {
        name: 'get_progress',
        description: `Get the learning progress for a class. Returns overall mastery, module scores, weak concepts, and question statistics.`,
        parameters: {
            type: 'object',
            properties: {
                class_id: { type: 'string', description: 'The ID of the class to get progress for' },
            },
            required: ['class_id'],
        },
        async execute(args): Promise<ToolResult> {
            const classId = args.class_id as string;
            const progressData = await sessionManager.getProgress(classId);
            if (!progressData) return { content: '', error: `Progress data for class ${classId} not found` };

            const classData = await sessionManager.getClass(classId);
            const moduleDetails = classData?.roadmap?.modules.map(m => ({
                id: m.id, title: m.title, status: m.status, mastery_score: m.mastery_score,
                questions_asked: m.questions_asked, questions_correct: m.questions_correct,
            })) || [];

            return { content: JSON.stringify({ ...progressData, module_details: moduleDetails }, null, 2) };
        },
    };
}

export function createUpdateProgressTool(sessionManager: SessionManager): Tool {
    return {
        name: 'update_progress',
        description: `Update learning progress after evaluating a student's answer. Record question attempts, correct answers, update mastery scores, add weak concepts, mark modules as completed, and advance to the next module. Call this after every answer evaluation.`,
        parameters: {
            type: 'object',
            properties: {
                class_id: { type: 'string', description: 'The ID of the class' },
                module_id: { type: 'string', description: 'The module ID to update mastery for' },
                question_asked: { type: 'string', description: 'Set to "true" to increment total questions' },
                answer_correct: { type: 'string', description: 'Set to "true" if answered correctly' },
                mastery_score: { type: 'string', description: 'New mastery score for the module (0-100)' },
                weak_concepts: { type: 'string', description: 'Comma-separated list of weak concepts to add' },
                module_completed: { type: 'string', description: 'Set to "true" to mark module as completed and advance' },
            },
            required: ['class_id'],
        },
        async execute(args): Promise<ToolResult> {
            const classId = args.class_id as string;
            const progressData = await sessionManager.getProgress(classId);
            if (!progressData) return { content: '', error: `Progress for class ${classId} not found` };

            const classData = await sessionManager.getClass(classId);
            if (!classData) return { content: '', error: `Class ${classId} not found` };

            if (args.question_asked === 'true') progressData.total_questions++;
            if (args.answer_correct === 'true') progressData.total_correct++;

            if (args.module_id && args.mastery_score && classData.roadmap) {
                const mod = classData.roadmap.modules.find(m => m.id === args.module_id);
                if (mod) {
                    mod.mastery_score = parseInt(args.mastery_score as string, 10);
                    if (args.question_asked === 'true') mod.questions_asked++;
                    if (args.answer_correct === 'true') mod.questions_correct++;
                }
            }

            if (args.weak_concepts) {
                const concepts = (args.weak_concepts as string).split(',').map(c => c.trim());
                for (const c of concepts) {
                    if (c && !progressData.weak_concepts.includes(c)) progressData.weak_concepts.push(c);
                }
            }

            if (args.module_completed === 'true' && args.module_id && classData.roadmap) {
                const mod = classData.roadmap.modules.find(m => m.id === args.module_id);
                if (mod) { mod.status = 'completed'; progressData.modules_completed++; }

                const idx = classData.roadmap.modules.findIndex(m => m.id === args.module_id);
                if (idx >= 0 && idx < classData.roadmap.modules.length - 1) {
                    const next = classData.roadmap.modules[idx + 1];
                    classData.current_module_id = next.id;
                    classData.current_subtopic_index = 0;
                    next.status = 'in_progress';
                } else {
                    classData.status = 'completed';
                }
                await sessionManager.saveClass(classData);
            }

            if (classData.roadmap && classData.roadmap.modules.length > 0) {
                const total = classData.roadmap.modules.reduce((s, m) => s + m.mastery_score, 0);
                progressData.overall_mastery = Math.round(total / classData.roadmap.modules.length);
                await sessionManager.saveClass(classData);
            }

            await sessionManager.saveProgress(progressData);
            return { content: JSON.stringify(progressData, null, 2) };
        },
    };
}
