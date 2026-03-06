// ── Class State Tool ──
// Reads and writes class state via database.

import type { Tool, ToolResult } from './types.js';
import type { SessionManager } from '../session/manager.js';

export function createClassStateTool(sessionManager: SessionManager): Tool {
    return {
        name: 'get_class_state',
        description: `Get the current state of a learning class. Returns the class details including:
- Class title, description, and status (clarifying/negotiating/locked/in_progress/completed)
- The full roadmap with modules and subtopics
- Current module being studied
- Module completion statuses and mastery scores
Use this to understand where the student is in their learning journey.`,
        parameters: {
            type: 'object',
            properties: {
                class_id: { type: 'string', description: 'The ID of the class to get state for' },
            },
            required: ['class_id'],
        },
        async execute(args): Promise<ToolResult> {
            const classId = args.class_id as string;
            const classData = await sessionManager.getClass(classId);
            if (!classData) return { content: '', error: `Class ${classId} not found` };
            return { content: JSON.stringify(classData, null, 2) };
        },
    };
}

export function createUpdateClassStateTool(sessionManager: SessionManager): Tool {
    return {
        name: 'update_class_state',
        description: `Update the state of a learning class. You can update:
- roadmap: Set or update the learning roadmap with modules and subtopics
- status: Change the class status (clarifying/negotiating/locked/in_progress/completed)
- current_module_id: Set which module is currently being studied
- current_subtopic_index: Set which subtopic within the current module
Use this after generating a roadmap, locking it, or advancing through modules.`,
        parameters: {
            type: 'object',
            properties: {
                class_id: { type: 'string', description: 'The ID of the class to update' },
                roadmap: { type: 'string', description: 'JSON string of the roadmap object with modules array' },
                status: { type: 'string', description: 'New status for the class', enum: ['clarifying', 'negotiating', 'locked', 'in_progress', 'completed'] },
                current_module_id: { type: 'string', description: 'ID of the module currently being studied' },
                current_subtopic_index: { type: 'string', description: 'Index of current subtopic (as string number)' },
            },
            required: ['class_id'],
        },
        async execute(args): Promise<ToolResult> {
            const classId = args.class_id as string;
            const classData = await sessionManager.getClass(classId);
            if (!classData) return { content: '', error: `Class ${classId} not found` };

            if (args.roadmap) {
                try {
                    classData.roadmap = JSON.parse(args.roadmap as string);
                    if (classData.status === 'clarifying') classData.status = 'negotiating';
                } catch {
                    return { content: '', error: 'Invalid roadmap JSON' };
                }
            }
            if (args.status) classData.status = args.status as typeof classData.status;
            if (args.current_module_id) classData.current_module_id = args.current_module_id as string;
            if (args.current_subtopic_index !== undefined) classData.current_subtopic_index = parseInt(args.current_subtopic_index as string, 10);

            await sessionManager.saveClass(classData);
            return { content: JSON.stringify(classData, null, 2) };
        },
    };
}
