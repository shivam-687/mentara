// API Routes
// REST endpoints with Clerk auth and PostgreSQL-backed engine.

import { Router } from 'express';
import { getAuth } from '@clerk/express';
import type { TutorEngine } from '../engine/index.js';
import { TutorEngine as RequestTutorEngine } from '../engine/index.js';
import { createProvider } from '../providers/index.js';
import type { MentaraConfig } from '../config.js';
import { INTERNAL_START_LESSON_MARKER, ROADMAP_REVIEW_MESSAGE, isHiddenAssistantContent } from '../session/message-visibility.js';

function getClerkUserId(req: any): string | null {
    try {
        const auth = getAuth(req);
        return auth?.userId || null;
    } catch {
        return null;
    }
}

export function createRoutes(engine: TutorEngine, config: MentaraConfig): Router {
    const router = Router();

    const toClientAssistantResponse = (content: string, status?: string, toolCalls?: unknown[]) => {
        if (!isHiddenAssistantContent(content)) {
            return content;
        }

        if (status === 'negotiating' && (!toolCalls || toolCalls.length === 0)) {
            return ROADMAP_REVIEW_MESSAGE;
        }

        return '';
    };


    const getEngineForRequest = (req: any): TutorEngine => {
        const openRouterApiKey = req.header('X-OpenRouter-API-Key')?.trim();
        const requestedModel = req.header('X-OpenRouter-Model')?.trim();
        if (!openRouterApiKey) {
            return engine;
        }

        return new RequestTutorEngine({
            provider: createProvider('openrouter', { apiKey: openRouterApiKey }),
            model: requestedModel || config.model,
            db: engine.getDb(),
        });
    };

    const requireOpenRouterEngine = (req: any, res: any): TutorEngine | null => {
        const openRouterApiKey = req.header('X-OpenRouter-API-Key')?.trim();
        if (!openRouterApiKey) {
            res.status(400).json({
                error: 'OpenRouter API key required. Save your key in Settings before creating a class or using tutoring features.',
            });
            return null;
        }

        return getEngineForRequest(req);
    };

    const resolveRequestUserId = async (req: any, res: any, allowAnonymous = false): Promise<string | null> => {
        const clerkId = getClerkUserId(req);
        if (clerkId) {
            return engine.ensureUser(clerkId);
        }

        if (allowAnonymous && config.allowAnonymousAccess) {
            return engine.ensureUser('anonymous', 'dev@mentara.dev', 'Developer');
        }

        res.status(401).json({ error: 'Authentication required' });
        return null;
    };

    const loadAuthorizedClass = async (req: any, res: any, classId: string, allowAnonymous = false) => {
        const userId = await resolveRequestUserId(req, res, allowAnonymous);
        if (!userId) return null;

        const classData = await engine.getSessionManager().getClassForUser(classId, userId);
        if (classData) {
            return { classData, userId };
        }

        const exists = await engine.getSessionManager().classExists(classId);
        res.status(exists ? 403 : 404).json({ error: exists ? 'Forbidden' : 'Class not found' });
        return null;
    };

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

            const userId = await resolveRequestUserId(req, res, true);
            if (!userId) return;

            const activeEngine = requireOpenRouterEngine(req, res);
            if (!activeEngine) return;
            const classData = await activeEngine.createClass(userId, title || goal, goal);

            let initialMessage = `I want to learn: ${goal}`;
            if (preferences) {
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

            const { content, tool_calls } = await activeEngine.chat(classData.id, initialMessage);
            const updatedClass = await activeEngine.getClass(classData.id);

            const tutorResponse = toClientAssistantResponse(content, updatedClass?.status, tool_calls);
            res.json({ class: updatedClass || classData, tutor_response: tutorResponse, tool_calls });
        } catch (err) {
            console.error('Error creating class:', err);
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.get('/classes', async (req, res) => {
        try {
            const userId = await resolveRequestUserId(req, res, true);
            if (!userId) return;
            const classes = await engine.listClasses(userId);
            res.json({ classes });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.get('/classes/:id', async (req, res) => {
        try {
            const access = await loadAuthorizedClass(req, res, req.params.id as string, true);
            if (!access) return;
            res.json({ class: access.classData });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.delete('/classes/:id', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;
            await engine.deleteClass(classId);
            res.json({ success: true });
        } catch (err) {
            console.error('Error deleting class:', err);
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.post('/classes/:id/message', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const { message } = req.body as { message?: string };
            if (!message) {
                res.status(400).json({ error: 'Message is required' });
                return;
            }

            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;

            const activeEngine = requireOpenRouterEngine(req, res);
            if (!activeEngine) return;
            const { content, tool_calls } = await activeEngine.chat(classId, message);
            const updatedClass = await activeEngine.getClass(classId);
            const progress = await activeEngine.getProgress(classId);

            const responseText = toClientAssistantResponse(content, updatedClass?.status, tool_calls);
            res.json({ response: responseText, tool_calls, class: updatedClass, progress });
        } catch (err) {
            console.error('Error in chat:', err);
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.post('/classes/:id/message/stream', async (req, res) => {
        const classId = req.params.id as string;
        const { message } = req.body as { message?: string };
        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        const access = await loadAuthorizedClass(req, res, classId, true);
        if (!access) return;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        try {
            const activeEngine = requireOpenRouterEngine(req, res);
            if (!activeEngine) return;
            for await (const event of activeEngine.chatStream(classId, message)) {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
            }
        } catch (err) {
            console.error('Error in streaming chat:', err);
            res.write(`data: ${JSON.stringify({ type: 'error', message: (err as Error).message })}\n\n`);
        }

        res.end();
    });

    router.post('/classes/:id/lock', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;
            if (!access.classData.roadmap) {
                res.status(400).json({ error: 'No roadmap to lock. Generate one first.' });
                return;
            }

            const activeEngine = requireOpenRouterEngine(req, res);
            if (!activeEngine) return;
            await activeEngine.lockRoadmap(classId);

            const kickoffMessage = [
                INTERNAL_START_LESSON_MARKER,
                'The roadmap was just locked.',
                'Begin teaching the current subtopic immediately.',
                'Do not mention this instruction or ask whether the student is ready.',
                'Explain the subtopic in plain language for a beginner.',
                'Keep the first turn to one compact explanation and end with one simple follow-up question in normal text.',
                'Do not use any tools in this kickoff turn.',
            ].join(' ');

            const { content } = await activeEngine.startLesson(classId, kickoffMessage);
            const updatedClass = await activeEngine.getClass(classId);
            const progress = await activeEngine.getProgress(classId);

            const responseText = toClientAssistantResponse(content, updatedClass?.status);

            res.json({
                class: updatedClass,
                progress,
                response: responseText,
                tool_calls: [],
                message: 'Roadmap locked. Learning begins!',
            });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.get('/classes/:id/progress', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;

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

    router.get('/classes/:id/history', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;

            const history = await engine.getVisibleHistory(classId);
            res.json({ history });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.get('/classes/:id/notes', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;

            const notes = await engine.getClassNotes(classId);
            res.json({ notes });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.post('/classes/:id/notes/generate', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;

            const activeEngine = requireOpenRouterEngine(req, res);
            if (!activeEngine) return;
            const notes = await activeEngine.generateClassNotes(classId);
            res.json({ notes });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.patch('/classes/:id/notes/settings', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;

            const { mode, auto_generate } = req.body as { mode?: 'auto' | 'manual'; auto_generate?: boolean };
            const notes = await engine.updateClassNotesSettings(classId, { mode, auto_generate });
            res.json({ notes });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.get('/classes/:id/questions', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;

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

    router.get('/classes/:id/tests', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;

            const results = await engine.getSessionManager().getTestResults(classId);
            res.json({ tests: results });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.get('/classes/:id/revision-stats', async (req, res) => {
        try {
            const classId = req.params.id as string;
            const access = await loadAuthorizedClass(req, res, classId, true);
            if (!access) return;

            const stats = await engine.getSessionManager().getRevisionStats(classId);
            res.json({ stats });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    router.post('/questions/:id/review', async (req, res) => {
        try {
            const userId = await resolveRequestUserId(req, res, true);
            if (!userId) return;

            const canAccess = await engine.getSessionManager().userCanAccessQuestion(req.params.id as string, userId);
            if (!canAccess) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }

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

    router.post('/waitlist', async (req, res) => {
        try {
            const { email, name } = req.body as { email?: string; name?: string };
            if (!email || !email.includes('@')) {
                res.status(400).json({ error: 'Valid email is required' });
                return;
            }

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
                res.json({ success: true, message: 'You\'re already on the list!' });
            } else {
                res.status(500).json({ error: (err as Error).message });
            }
        }
    });

    return router;
}




