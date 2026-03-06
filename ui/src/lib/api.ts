// API Client

const API_BASE = '/api';

export interface ClassData {
    id: string;
    title: string;
    description: string;
    status: 'clarifying' | 'negotiating' | 'locked' | 'in_progress' | 'completed';
    roadmap: {
        modules: Array<{
            id: string;
            title: string;
            subtopics: string[];
            status: 'not_started' | 'in_progress' | 'completed';
            mastery_score: number;
            questions_asked: number;
            questions_correct: number;
        }>;
    } | null;
    current_module_id: string | null;
    current_subtopic_index: number;
    created_at: string;
    updated_at: string;
}

export interface ProgressData {
    class_id: string;
    overall_mastery: number;
    modules_completed: number;
    modules_total: number;
    total_questions: number;
    total_correct: number;
    weak_concepts: string[];
    learning_time_minutes: number;
    last_activity: string;
}

export interface ChatResponse {
    response: string;
    tool_calls?: any[];
    class: ClassData;
    progress: ProgressData;
}

export interface LockRoadmapResponse {
    class: ClassData;
    progress?: ProgressData | null;
    response?: string;
    tool_calls?: any[];
    message: string;
}

export interface QuestionAnswerData {
    id: string;
    class_id: string;
    module_id: string | null;
    subtopic: string | null;
    question_text: string;
    question_type: string;
    options: unknown;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    difficulty: string;
    topic: string | null;
    explanation: string | null;
    next_review_at: string | null;
    review_count: number;
    ease_factor: number;
    interval_days: number;
    created_at: string;
}

export interface TestResultData {
    id: string;
    class_id: string;
    module_id: string | null;
    title: string;
    total_questions: number;
    correct_answers: number;
    score: number;
    time_taken_seconds: number | null;
    question_ids: string[];
    created_at: string;
}

export interface RevisionStats {
    due_for_review: number;
    total_questions: number;
    total_correct: number;
    topic_breakdown: Array<{ topic: string; correct: number; total: number }>;
    recent_history: Array<{ date: string; correct: number; incorrect: number }>;
}

// Streaming Event Types

export type SessionEvent =
    | { type: 'text_delta'; content: string }
    | { type: 'tool_call'; id: string; name: string; args: Record<string, unknown> }
    | { type: 'status'; class: ClassData; progress: ProgressData }
    | { type: 'error'; message: string }
    | { type: 'done' };

export const api = {
    async createClass(goal: string, preferences?: {
        experience?: string;
        depth?: string;
        interests?: string;
    }): Promise<{ class: ClassData; tutor_response: string }> {
        const res = await fetch(`${API_BASE}/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal, preferences }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async deleteClass(classId: string): Promise<{ success: boolean }> {
        const res = await fetch(`${API_BASE}/classes/${classId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async listClasses(): Promise<{ classes: ClassData[] }> {
        const res = await fetch(`${API_BASE}/classes`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getClass(id: string): Promise<{ class: ClassData }> {
        const res = await fetch(`${API_BASE}/classes/${id}`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async sendMessage(classId: string, message: string): Promise<ChatResponse> {
        const res = await fetch(`${API_BASE}/classes/${classId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async lockRoadmap(classId: string): Promise<LockRoadmapResponse> {
        const res = await fetch(`${API_BASE}/classes/${classId}/lock`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getProgress(classId: string): Promise<{ progress: ProgressData }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/progress`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getHistory(classId: string): Promise<{ history: Array<{ role: string; content: string; timestamp: string }> }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/history`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getQuestionAnswers(classId: string, filters?: {
        topic?: string;
        correct?: boolean;
        module_id?: string;
        due_for_review?: boolean;
    }): Promise<{ questions: QuestionAnswerData[] }> {
        const params = new URLSearchParams();
        if (filters?.topic) params.set('topic', filters.topic);
        if (filters?.correct !== undefined) params.set('correct', String(filters.correct));
        if (filters?.module_id) params.set('module_id', filters.module_id);
        if (filters?.due_for_review) params.set('due_for_review', 'true');
        const qs = params.toString();
        const res = await fetch(`${API_BASE}/classes/${classId}/questions${qs ? `?${qs}` : ''}`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getTestResults(classId: string): Promise<{ tests: TestResultData[] }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/tests`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getRevisionStats(classId: string): Promise<{ stats: RevisionStats }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/revision-stats`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async updateReviewSchedule(questionId: string, quality: number): Promise<void> {
        const res = await fetch(`${API_BASE}/questions/${questionId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quality }),
        });
        if (!res.ok) throw new Error(await res.text());
    },

    async *sendMessageStream(classId: string, message: string): AsyncGenerator<SessionEvent> {
        const res = await fetch(`${API_BASE}/classes/${classId}/message/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body for streaming');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;

                const data = trimmed.slice(6);
                try {
                    yield JSON.parse(data) as SessionEvent;
                } catch {
                    // Skip malformed SSE lines
                }
            }
        }
    },
};
