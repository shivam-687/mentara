export interface Module {
    id: string;
    title: string;
    subtopics: string[];
    status: 'not_started' | 'in_progress' | 'completed';
    mastery_score: number;
    questions_asked: number;
    questions_correct: number;
}

export interface Roadmap {
    modules: Module[];
}

export interface ClassData {
    id: string;
    title: string;
    description: string;
    status: 'clarifying' | 'negotiating' | 'locked' | 'in_progress' | 'completed';
    roadmap: Roadmap | null;
    current_module_id: string | null;
    current_subtopic_index: number;
    created_at: string;
    updated_at: string;
}

export interface SessionData {
    class_id: string;
    messages: Array<{
        role: string;
        content: string;
        tool_calls?: unknown[];
        tool_call_id?: string;
        timestamp: string;
    }>;
    summary: string;
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
