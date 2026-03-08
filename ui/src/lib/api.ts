import { getOpenRouterApiKey, getOpenRouterModel } from '@/lib/byok';
const API_BASE = '/api';

export interface ToolCallData {
    id: string;
    type?: string;
    function: {
        name: string;
        arguments: string;
    };
}

export interface HistoryMessage {
    role: string;
    content: string;
    tool_calls?: ToolCallData[];
    tool_call_id?: string;
    timestamp: string;
}

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

export interface ClassNotesData {
    id: string;
    class_id: string;
    mode: 'auto' | 'manual';
    auto_generate: boolean;
    status: 'idle' | 'generating' | 'ready' | 'error';
    title: string | null;
    summary: string | null;
    markdown: string | null;
    key_takeaways: string[];
    glossary: Array<{ term: string; meaning: string }>;
    action_items: string[];
    timeline: Array<{ title: string; detail: string }>;
    generated_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ChatResponse {
    response: string;
    tool_calls?: ToolCallData[];
    class: ClassData;
    progress: ProgressData;
}

export interface LockRoadmapResponse {
    class: ClassData;
    progress?: ProgressData | null;
    response?: string;
    tool_calls?: ToolCallData[];
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

export type SessionEvent =
    | { type: 'text_delta'; content: string }
    | { type: 'tool_call'; id: string; name: string; args: Record<string, unknown> }
    | { type: 'status'; class: ClassData; progress: ProgressData }
    | { type: 'error'; message: string }
    | { type: 'done' };


function buildHeaders(includeJson = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (includeJson) headers['Content-Type'] = 'application/json';

    const openRouterApiKey = getOpenRouterApiKey();
    if (openRouterApiKey) {
        headers['X-OpenRouter-API-Key'] = openRouterApiKey;
        headers['X-OpenRouter-Model'] = getOpenRouterModel();
    }

    return headers;
}

export const api = {
    async createClass(goal: string, preferences?: {
        experience?: string;
        depth?: string;
        interests?: string;
    }): Promise<{ class: ClassData; tutor_response: string }> {
        const res = await fetch(`${API_BASE}/classes`, {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify({ goal, preferences }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async deleteClass(classId: string): Promise<{ success: boolean }> {
        const res = await fetch(`${API_BASE}/classes/${classId}`, { method: 'DELETE', headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async listClasses(): Promise<{ classes: ClassData[] }> {
        const res = await fetch(`${API_BASE}/classes`, { headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getClass(id: string): Promise<{ class: ClassData }> {
        const res = await fetch(`${API_BASE}/classes/${id}`, { headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async sendMessage(classId: string, message: string): Promise<ChatResponse> {
        const res = await fetch(`${API_BASE}/classes/${classId}/message`, {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify({ message }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async lockRoadmap(classId: string): Promise<LockRoadmapResponse> {
        const res = await fetch(`${API_BASE}/classes/${classId}/lock`, { method: 'POST', headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getProgress(classId: string): Promise<{ progress: ProgressData }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/progress`, { headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getHistory(classId: string): Promise<{ history: HistoryMessage[] }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/history`, { headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getClassNotes(classId: string): Promise<{ notes: ClassNotesData | null }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/notes`, { headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async generateClassNotes(classId: string): Promise<{ notes: ClassNotesData }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/notes/generate`, { method: 'POST', headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async updateClassNotesSettings(classId: string, settings: { mode?: 'auto' | 'manual'; auto_generate?: boolean }): Promise<{ notes: ClassNotesData }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/notes/settings`, {
            method: 'PATCH',
            headers: buildHeaders(true),
            body: JSON.stringify(settings),
        });
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
        const res = await fetch(`${API_BASE}/classes/${classId}/questions${qs ? `?${qs}` : ''}`, { headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getTestResults(classId: string): Promise<{ tests: TestResultData[] }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/tests`, { headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getRevisionStats(classId: string): Promise<{ stats: RevisionStats }> {
        const res = await fetch(`${API_BASE}/classes/${classId}/revision-stats`, { headers: buildHeaders() });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async joinWaitlist(payload: { email: string; name?: string }): Promise<{ success: boolean; message: string }> {
        const res = await fetch(`${API_BASE}/waitlist`, {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async updateReviewSchedule(questionId: string, quality: number): Promise<void> {
        const res = await fetch(`${API_BASE}/questions/${questionId}/review`, {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify({ quality }),
        });
        if (!res.ok) throw new Error(await res.text());
    },

    async *sendMessageStream(classId: string, message: string): AsyncGenerator<SessionEvent> {
        const res = await fetch(`${API_BASE}/classes/${classId}/message/stream`, {
            method: 'POST',
            headers: buildHeaders(true),
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

