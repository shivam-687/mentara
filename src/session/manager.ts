// ── Database-backed Session Manager ──
// Replaces JSON file storage with PostgreSQL via Drizzle ORM.

import { eq, desc, and, lte, sql } from 'drizzle-orm';
import type { Database } from '../db/index.js';
import { classes, messages, progress, questionAnswers, testResults, flashcardDecks } from '../db/schema.js';
import type { ClassData, SessionData, ProgressData, QuestionAnswerData, TestResultData, RevisionStats, Roadmap } from './types.js';

export class SessionManager {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    // ── User Operations ──

    async ensureUser(clerkId: string, email?: string, name?: string): Promise<string> {
        const { users } = await import('../db/schema.js');
        const existing = await this.db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
        if (existing.length > 0) {
            return existing[0].id;
        }
        const [newUser] = await this.db.insert(users).values({
            clerkId,
            email: email || null,
            name: name || null,
        }).returning();
        return newUser.id;
    }

    // ── Class Operations ──

    async createClass(userId: string, title: string, description: string): Promise<ClassData> {
        const [cls] = await this.db.insert(classes).values({
            userId,
            title,
            description,
            status: 'clarifying',
        }).returning();

        // Initialize progress
        await this.db.insert(progress).values({
            classId: cls.id,
        });

        return this.toClassData(cls);
    }

    async getClass(classId: string): Promise<ClassData | null> {
        const rows = await this.db.select().from(classes).where(eq(classes.id, classId)).limit(1);
        if (rows.length === 0) return null;
        return this.toClassData(rows[0]);
    }

    async saveClass(classData: ClassData): Promise<void> {
        await this.db.update(classes).set({
            title: classData.title,
            description: classData.description,
            status: classData.status,
            roadmap: classData.roadmap,
            currentModuleId: classData.current_module_id,
            currentSubtopicIndex: classData.current_subtopic_index,
            updatedAt: new Date(),
        }).where(eq(classes.id, classData.id));
    }

    async listClasses(userId?: string): Promise<ClassData[]> {
        let query = this.db.select().from(classes);
        if (userId) {
            query = query.where(eq(classes.userId, userId)) as typeof query;
        }
        const rows = await query.orderBy(desc(classes.updatedAt));
        return rows.map(r => this.toClassData(r));
    }

    async deleteClass(classId: string): Promise<boolean> {
        const result = await this.db.delete(classes).where(eq(classes.id, classId)).returning();
        return result.length > 0;
    }

    async updateClassStatus(classId: string, status: ClassData['status']): Promise<void> {
        await this.db.update(classes).set({ status, updatedAt: new Date() }).where(eq(classes.id, classId));
    }

    async setRoadmap(classId: string, roadmap: Roadmap): Promise<void> {
        await this.db.update(classes).set({
            roadmap,
            status: 'negotiating',
            updatedAt: new Date(),
        }).where(eq(classes.id, classId));
    }

    async lockRoadmap(classId: string): Promise<void> {
        const classData = await this.getClass(classId);
        if (!classData) throw new Error(`Class ${classId} not found`);
        if (!classData.roadmap) throw new Error(`Class ${classId} has no roadmap to lock`);

        // Set first module as current
        if (classData.roadmap.modules.length > 0) {
            classData.roadmap.modules[0].status = 'in_progress';
            await this.db.update(classes).set({
                status: 'in_progress',
                roadmap: classData.roadmap,
                currentModuleId: classData.roadmap.modules[0].id,
                currentSubtopicIndex: 0,
                updatedAt: new Date(),
            }).where(eq(classes.id, classId));
        }

        // Update progress total
        await this.db.update(progress).set({
            modulesTotal: classData.roadmap.modules.length,
            lastActivity: new Date(),
        }).where(eq(progress.classId, classId));
    }

    // ── Message Operations ──

    async addMessage(classId: string, role: string, content: string, toolCalls?: unknown[], toolCallId?: string): Promise<void> {
        await this.db.insert(messages).values({
            classId,
            role,
            content,
            toolCalls: toolCalls || null,
            toolCallId: toolCallId || null,
        });
    }

    async getHistory(classId: string): Promise<SessionData['messages']> {
        const rows = await this.db.select().from(messages)
            .where(eq(messages.classId, classId))
            .orderBy(messages.createdAt);

        return rows.map(r => ({
            role: r.role,
            content: r.content,
            tool_calls: r.toolCalls as unknown[] | undefined,
            tool_call_id: r.toolCallId || undefined,
            timestamp: r.createdAt.toISOString(),
        }));
    }

    async getSession(classId: string): Promise<SessionData | null> {
        const history = await this.getHistory(classId);
        return {
            class_id: classId,
            messages: history,
            summary: '',
            created_at: '',
            updated_at: '',
        };
    }

    async setSummary(_classId: string, _summary: string): Promise<void> {
        // Summary can be stored in class metadata in future
    }

    async truncateHistory(classId: string, keepLast: number): Promise<void> {
        const allMsgs = await this.db.select({ id: messages.id }).from(messages)
            .where(eq(messages.classId, classId))
            .orderBy(messages.createdAt);

        if (allMsgs.length > keepLast) {
            const toDelete = allMsgs.slice(0, allMsgs.length - keepLast);
            for (const msg of toDelete) {
                await this.db.delete(messages).where(eq(messages.id, msg.id));
            }
        }
    }

    // ── Progress Operations ──

    async getProgress(classId: string): Promise<ProgressData | null> {
        const rows = await this.db.select().from(progress).where(eq(progress.classId, classId)).limit(1);
        if (rows.length === 0) return null;
        const r = rows[0];
        return {
            class_id: r.classId,
            overall_mastery: r.overallMastery,
            modules_completed: r.modulesCompleted,
            modules_total: r.modulesTotal,
            total_questions: r.totalQuestions,
            total_correct: r.totalCorrect,
            weak_concepts: (r.weakConcepts || []) as string[],
            learning_time_minutes: r.learningTimeMinutes,
            last_activity: r.lastActivity.toISOString(),
        };
    }

    async saveProgress(progressData: ProgressData): Promise<void> {
        await this.db.update(progress).set({
            overallMastery: progressData.overall_mastery,
            modulesCompleted: progressData.modules_completed,
            modulesTotal: progressData.modules_total,
            totalQuestions: progressData.total_questions,
            totalCorrect: progressData.total_correct,
            weakConcepts: progressData.weak_concepts,
            learningTimeMinutes: progressData.learning_time_minutes,
            lastActivity: new Date(),
        }).where(eq(progress.classId, progressData.class_id));
    }

    async updateProgress(classId: string, updates: Partial<ProgressData>): Promise<void> {
        const current = await this.getProgress(classId);
        if (!current) return;
        Object.assign(current, updates);
        await this.saveProgress(current);
    }

    // ── Question-Answer Operations ──

    async recordQuestionAnswer(data: {
        classId: string;
        moduleId?: string;
        subtopic?: string;
        questionText: string;
        questionType: string;
        options?: unknown;
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        difficulty?: string;
        topic?: string;
        explanation?: string;
    }): Promise<string> {
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + (data.isCorrect ? 3 : 1));

        const [record] = await this.db.insert(questionAnswers).values({
            classId: data.classId,
            moduleId: data.moduleId || null,
            subtopic: data.subtopic || null,
            questionText: data.questionText,
            questionType: data.questionType,
            options: data.options || null,
            userAnswer: data.userAnswer,
            correctAnswer: data.correctAnswer,
            isCorrect: data.isCorrect,
            difficulty: data.difficulty || 'medium',
            topic: data.topic || null,
            explanation: data.explanation || null,
            nextReviewAt,
        }).returning();
        return record.id;
    }

    async getQuestionAnswers(classId: string, filters?: {
        moduleId?: string;
        topic?: string;
        isCorrect?: boolean;
        dueForReview?: boolean;
    }): Promise<QuestionAnswerData[]> {
        const conditions = [eq(questionAnswers.classId, classId)];

        if (filters?.moduleId) {
            conditions.push(eq(questionAnswers.moduleId, filters.moduleId));
        }
        if (filters?.topic) {
            conditions.push(eq(questionAnswers.topic, filters.topic));
        }
        if (filters?.isCorrect !== undefined) {
            conditions.push(eq(questionAnswers.isCorrect, filters.isCorrect));
        }
        if (filters?.dueForReview) {
            conditions.push(lte(questionAnswers.nextReviewAt, new Date()));
        }

        const rows = await this.db.select().from(questionAnswers)
            .where(and(...conditions))
            .orderBy(desc(questionAnswers.createdAt));

        return rows.map(r => this.toQuestionAnswerData(r));
    }

    async updateReviewSchedule(questionId: string, quality: number): Promise<void> {
        const rows = await this.db.select().from(questionAnswers)
            .where(eq(questionAnswers.id, questionId)).limit(1);
        if (rows.length === 0) return;
        const qa = rows[0];

        let easeFactor = qa.easeFactor;
        let interval = qa.intervalDays;

        if (quality >= 3) {
            if (qa.reviewCount === 0) interval = 1;
            else if (qa.reviewCount === 1) interval = 6;
            else interval = Math.round(interval * (easeFactor / 100));
        } else {
            interval = 1;
        }

        easeFactor = Math.max(130, easeFactor + (8 - 5 * (5 - quality)));

        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + interval);

        await this.db.update(questionAnswers).set({
            reviewCount: qa.reviewCount + 1,
            easeFactor,
            intervalDays: interval,
            nextReviewAt,
        }).where(eq(questionAnswers.id, questionId));
    }

    // ── Test Result Operations ──

    async saveTestResult(data: {
        classId: string;
        moduleId?: string;
        title: string;
        totalQuestions: number;
        correctAnswers: number;
        score: number;
        timeTakenSeconds?: number;
        questionIds: string[];
    }): Promise<string> {
        const [result] = await this.db.insert(testResults).values({
            classId: data.classId,
            moduleId: data.moduleId || null,
            title: data.title,
            totalQuestions: data.totalQuestions,
            correctAnswers: data.correctAnswers,
            score: data.score,
            timeTakenSeconds: data.timeTakenSeconds || null,
            questionIds: data.questionIds,
        }).returning();
        return result.id;
    }

    async getTestResults(classId: string): Promise<TestResultData[]> {
        const rows = await this.db.select().from(testResults)
            .where(eq(testResults.classId, classId))
            .orderBy(desc(testResults.createdAt));

        return rows.map(r => ({
            id: r.id,
            class_id: r.classId,
            module_id: r.moduleId,
            title: r.title,
            total_questions: r.totalQuestions,
            correct_answers: r.correctAnswers,
            score: r.score,
            time_taken_seconds: r.timeTakenSeconds,
            question_ids: (r.questionIds || []) as string[],
            created_at: r.createdAt.toISOString(),
        }));
    }

    // ── Flashcard Operations ──

    async saveFlashcardDeck(data: {
        classId: string;
        title: string;
        cards: unknown;
    }): Promise<string> {
        const [deck] = await this.db.insert(flashcardDecks).values({
            classId: data.classId,
            title: data.title,
            cards: data.cards,
        }).returning();
        return deck.id;
    }

    // ── Revision Stats ──

    async getRevisionStats(classId: string): Promise<RevisionStats> {
        const allQA = await this.db.select().from(questionAnswers)
            .where(eq(questionAnswers.classId, classId));

        const now = new Date();
        const dueForReview = allQA.filter(q => q.nextReviewAt && q.nextReviewAt <= now).length;
        const totalCorrect = allQA.filter(q => q.isCorrect).length;

        // Topic breakdown
        const topicMap = new Map<string, { correct: number; total: number }>();
        for (const qa of allQA) {
            const topic = qa.topic || 'General';
            const entry = topicMap.get(topic) || { correct: 0, total: 0 };
            entry.total++;
            if (qa.isCorrect) entry.correct++;
            topicMap.set(topic, entry);
        }

        // Recent history (last 14 days)
        const recentHistory: Array<{ date: string; correct: number; incorrect: number }> = [];
        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayQA = allQA.filter(q => q.createdAt.toISOString().split('T')[0] === dateStr);
            recentHistory.push({
                date: dateStr,
                correct: dayQA.filter(q => q.isCorrect).length,
                incorrect: dayQA.filter(q => !q.isCorrect).length,
            });
        }

        return {
            due_for_review: dueForReview,
            total_questions: allQA.length,
            total_correct: totalCorrect,
            topic_breakdown: Array.from(topicMap.entries()).map(([topic, data]) => ({
                topic,
                correct: data.correct,
                total: data.total,
            })),
            recent_history: recentHistory,
        };
    }

    // ── Helpers ──

    private toQuestionAnswerData(row: typeof questionAnswers.$inferSelect): QuestionAnswerData {
        return {
            id: row.id,
            class_id: row.classId,
            module_id: row.moduleId,
            subtopic: row.subtopic,
            question_text: row.questionText,
            question_type: row.questionType,
            options: row.options,
            user_answer: row.userAnswer,
            correct_answer: row.correctAnswer,
            is_correct: row.isCorrect,
            difficulty: row.difficulty,
            topic: row.topic,
            explanation: row.explanation,
            next_review_at: row.nextReviewAt?.toISOString() || null,
            review_count: row.reviewCount,
            ease_factor: row.easeFactor,
            interval_days: row.intervalDays,
            created_at: row.createdAt.toISOString(),
        };
    }

    private toClassData(row: typeof classes.$inferSelect): ClassData {
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            status: row.status as ClassData['status'],
            roadmap: row.roadmap as ClassData['roadmap'],
            current_module_id: row.currentModuleId,
            current_subtopic_index: row.currentSubtopicIndex,
            created_at: row.createdAt.toISOString(),
            updated_at: row.updatedAt.toISOString(),
        };
    }
}
