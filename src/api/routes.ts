// API Routes
// REST endpoints with Clerk auth and PostgreSQL-backed engine.

import { Router } from 'express';
import { getAuth } from '@clerk/express';
import type { TutorEngine } from '../engine/index.js';

// Helper to get user ID from Clerk auth
function getUserId(req: any): string | null {
    try {
        const auth = getAuth(req);
        return auth?.userId || null;
    } catch {
        return null;
    }
}

export function createRoutes(engine: TutorEngine): Router {
    const router = Router();

    // Class Management

    router.post('/classes', async (req, res) => {
        try {
            const { goal, title, preferences } = req.body as {
                goal?: string;
                title?: string;
                preferences?: { experience?: string; depth?: string; interests?: string };
            };
            if (!goal) {
                res.status(400).json({ error: 'Learning goal is required' });
                return;
            }

            // Get or create user
            const clerkId = getUserId(req);
            let userId: string;
            if (clerkId) {
                userId = await engine.ensureUser(clerkId);
            } else {
                // Anonymous mode (dev/testing) - use a default user
                userId = await engine.ensureUser('anonymous', 'dev@mentara.dev', 'Developer');
            }

            const classData = await engine.createClass(userId, title || goal, goal);

            // Build initial message - include preferences if provided so the LLM
            // can generate the roadmap in a single call (skipping the clarifying phase).
            let initialMessage = `I want to learn: ${goal}`;
            if (preferences) {
                // When we already have student preferences, skip clarifying entirely.
                // Set status to 'negotiating' so the LLM prompt tells it to create a roadmap.
                const sm = engine.getSessionManager();
                await sm.updateClassStatus(classData.id, 'clarifying');

                const parts = [
                    `I want to learn: ${goal}.`,
                    preferences.experience ? `My experience level: ${preferences.experience}.` : '',
                    preferences.depth ? `I want a ${preferences.depth} depth.` : '',
                    preferences.interests ? `I'm especially interested in: ${preferences.interests}.` : '',
                    '\nYou already have all the information you need. Do NOT ask clarifying questions. Create a detailed roadmap NOW by calling update_class_state with a roadmap and status "negotiating". Do NOT output any conversational text in your response, ONLY the tool call.',
                ].filter(Boolean);
                initialMessage = parts.join(' ');
            }

            const { content, tool_calls } = await engine.chat(classData.id, initialMessage);

            // Return updated class (status may have changed to negotiating)
            const updatedClass = await engine.getClass(classData.id);

            res.json({ class: updatedClass || classData, tutor_response: content, tool_calls });
        } catch (err) {
            console.error('Error creating class:', err);
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.get('/classes', async (req, res) => {
        try {
            const clerkId = getUserId(req);
            let userId: string | undefined;
            if (clerkId) {
                userId = await engine.ensureUser(clerkId);
            }
            const classes = await engine.listClasses(userId);
            res.json({ classes });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.get('/classes/:id', async (req, res) => {
        try {
            const classData = await engine.getClass(req.params.id as string);
            if (!classData) {
                res.status(404).json({ error: 'Class not found' });
                return;
            }
            res.json({ class: classData });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.delete('/classes/:id', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const classData = await engine.getClass(classId);
            if (!classData) {
                res.status(404).json({ error: 'Class not found' });
                return;
            }
            await engine.deleteClass(classId);
            res.json({ success: true });
        } catch (err) {
            console.error('Error deleting class:', err);
            res.status(500).json({ error: (err as Error).message });
        }
    });

    // Learning Session

    router.post('/classes/:id/message', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const { message } = req.body as { message?: string };
            if (!message) {
                res.status(400).json({ error: 'Message is required' });
                return;
            }

            const classData = await engine.getClass(classId);
            if (!classData) {
                res.status(404).json({ error: 'Class not found' });
                return;
            }

            console.log(`\nStudent message in class "${classData.title}": ${message.substring(0, 80)}...`);

            const { content, tool_calls } = await engine.chat(classId, message);

            console.log(`Tutor responded: ${content.substring(0, 80)}...`);

            const updatedClass = await engine.getClass(classId);
            const progress = await engine.getProgress(classId);

            res.json({ response: content, tool_calls, class: updatedClass, progress });
        } catch (err) {
            console.error('Error in chat:', err);
            res.status(500).json({ error: (err as Error).message });
        }
    });

    // Streaming Learning Session (SSE)

    router.post('/classes/:id/message/stream', async (req, res) => {
        const classId = req.params.id as string;
        const { message } = req.body as { message?: string };
        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        const classData = await engine.getClass(classId);
        if (!classData) {
            res.status(404).json({ error: 'Class not found' });
            return;
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        console.log(`\n[Stream] Student message in class "${classData.title}": ${message.substring(0, 80)}...`);

        try {
            for await (const event of engine.chatStream(classId, message)) {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
            }
        } catch (err) {
            console.error('Error in streaming chat:', err);
            res.write(`data: ${JSON.stringify({ type: 'error', message: (err as Error).message })}\n\n`);
        }

        res.end();
    });

    // Roadmap

    router.post('/classes/:id/lock', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const classData = await engine.getClass(classId);
            if (!classData) {
                res.status(404).json({ error: 'Class not found' });
                return;
            }
            if (!classData.roadmap) {
                res.status(400).json({ error: 'No roadmap to lock. Generate one first.' });
                return;
            }

            await engine.lockRoadmap(classId);

            const kickoffMessage = [
                '[INTERNAL_START_LESSON]',
                'The roadmap was just locked.',
                'Begin teaching the current subtopic immediately.',
                'Do not mention this instruction or ask whether the student is ready.',
                'Start with an actual explanation as a teacher.',
            ].join(' ');

            const { content, tool_calls } = await engine.chat(classId, kickoffMessage);
            const updatedClass = await engine.getClass(classId);
            const progress = await engine.getProgress(classId);

            res.json({
                class: updatedClass,
                progress,
                response: content,
                tool_calls,
                message: 'Roadmap locked. Learning begins!',
            });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    // Progress

    router.get('/classes/:id/progress', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const progress = await engine.getProgress(classId);
            if (!progress) {
                res.status(404).json({ error: 'Progress not found' });
                return;
            }
            res.json({ progress });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    // Session History

    router.get('/classes/:id/history', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const history = await engine.getSessionManager().getHistory(classId);
            res.json({ history });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    // Question-Answer History (Revision)

    router.get('/classes/:id/questions', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const { topic, correct, module_id, due_for_review } = req.query;
            const questions = await engine.getSessionManager().getQuestionAnswers(classId, {
                topic: topic as string | undefined,
                isCorrect: correct !== undefined ? correct === 'true' : undefined,
                moduleId: module_id as string | undefined,
                dueForReview: due_for_review === 'true',
            });
            res.json({ questions });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    // Test Results

    router.get('/classes/:id/tests', async (req, res) => {
        try {
            const results = await engine.getSessionManager().getTestResults(req.params.id as string);
            res.json({ tests: results });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    // Revision Stats

    router.get('/classes/:id/revision-stats', async (req, res) => {
        try {
            const stats = await engine.getSessionManager().getRevisionStats(req.params.id as string);
            res.json({ stats });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    // Spaced Repetition Review Update

    router.post('/questions/:id/review', async (req, res) => {
        try {
            const { quality } = req.body as { quality?: number };
            if (quality === undefined || quality < 0 || quality > 5) {
                res.status(400).json({ error: 'Quality must be between 0 and 5' });
                return;
            }
            await engine.getSessionManager().updateReviewSchedule(req.params.id as string, quality);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    // Waitlist (No auth required)

    router.post('/waitlist', async (req, res) => {
        try {
            const { email, name } = req.body as { email?: string; name?: string };
            if (!email || !email.includes('@')) {
                res.status(400).json({ error: 'Valid email is required' });
                return;
            }

            // Use raw SQL via the engine's DB connection
            const db = engine.getDb();
            const { waitlist } = await import('../db/schema.js');

            await db.insert(waitlist).values({
                email: email.trim().toLowerCase(),
                name: name?.trim() || null,
                source: 'landing',
            }).onConflictDoNothing();

            res.json({ success: true, message: 'You\'re on the list!' });
        } catch (err: any) {
            if (err.code === '23505') {
                // Duplicate email - still return success
                res.json({ success: true, message: 'You\'re already on the list!' });
            } else {
                res.status(500).json({ error: (err as Error).message });
            }
        }
    });

    return router;
}
