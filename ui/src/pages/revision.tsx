// ── Revision Page ──
// Browse all Q&A history, filter by topic/correctness, spaced repetition indicators.

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    Brain,
    BarChart3,
    Search,
} from 'lucide-react';
import { api, type QuestionAnswerData, type RevisionStats } from '@/lib/api';
import { cn } from '@/lib/utils';

type FilterMode = 'all' | 'correct' | 'incorrect' | 'due';

export default function RevisionPage() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<QuestionAnswerData[]>([]);
    const [stats, setStats] = useState<RevisionStats | null>(null);
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [topicFilter, setTopicFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!classId) return;
        const load = async () => {
            setLoading(true);
            try {
                const [qRes, sRes] = await Promise.all([
                    api.getQuestionAnswers(classId),
                    api.getRevisionStats(classId),
                ]);
                setQuestions(qRes.questions);
                setStats(sRes.stats);
            } catch (err) {
                console.error('Failed to load revision data:', err);
            }
            setLoading(false);
        };
        load();
    }, [classId]);

    // Unique topics for filter
    const topics = useMemo(() => {
        const set = new Set<string>();
        questions.forEach((q) => q.topic && set.add(q.topic));
        return Array.from(set).sort();
    }, [questions]);

    // Filtered questions
    const filtered = useMemo(() => {
        let result = questions;
        if (filterMode === 'correct') result = result.filter((q) => q.is_correct);
        if (filterMode === 'incorrect') result = result.filter((q) => !q.is_correct);
        if (filterMode === 'due') {
            const now = new Date().toISOString();
            result = result.filter((q) => q.next_review_at && q.next_review_at <= now);
        }
        if (topicFilter) result = result.filter((q) => q.topic === topicFilter);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (qa) =>
                    qa.question_text.toLowerCase().includes(q) ||
                    qa.user_answer.toLowerCase().includes(q),
            );
        }
        return result;
    }, [questions, filterMode, topicFilter, searchQuery]);

    const accuracy = stats
        ? stats.total_questions > 0
            ? Math.round((stats.total_correct / stats.total_questions) * 100)
            : 0
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[92rem] px-6 py-8 xl:px-10 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="h-8 w-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">Revision & Review</h1>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        Review your learning history and practice weak areas
                    </p>
                </div>
            </div>

            {/* Stats Bar */}
            {stats && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-center">
                        <p className="text-2xl font-bold">{stats.total_questions}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                            Questions
                        </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-center">
                        <p className={cn('text-2xl font-bold', accuracy >= 70 ? 'text-emerald-600' : 'text-[var(--color-accent)]')}>
                            {accuracy}%
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                            Accuracy
                        </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-3 text-center">
                        <p className="text-2xl font-bold text-[var(--color-accent)]">
                            {stats.due_for_review}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                            Due for Review
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions..."
                        className="w-full pl-9 pr-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-sm outline-none focus:border-[var(--color-accent)] min-h-[40px]"
                    />
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 flex-wrap">
                    <div className="flex items-center gap-1 mr-2">
                        <Filter className="h-3 w-3 text-[var(--color-text-muted)]" />
                    </div>
                    {(['all', 'correct', 'incorrect', 'due'] as FilterMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setFilterMode(mode)}
                            className={cn(
                                'px-3 py-1.5 rounded-full border text-xs capitalize transition-colors min-h-[36px]',
                                filterMode === mode
                                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/50',
                            )}
                        >
                            {mode === 'due' ? 'Due for Review' : mode}
                        </button>
                    ))}

                    {topics.length > 0 && (
                        <select
                            value={topicFilter}
                            onChange={(e) => setTopicFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-full border border-[var(--color-border)] text-xs bg-[var(--color-bg-surface)] outline-none min-h-[36px]"
                        >
                            <option value="">All Topics</option>
                            {topics.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Topic Mastery Breakdown */}
            {stats && stats.topic_breakdown.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <BarChart3 className="h-3 w-3" />
                        Topic Mastery
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {stats.topic_breakdown.map((t) => {
                            const pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
                            return (
                                <button
                                    key={t.topic}
                                    onClick={() =>
                                        setTopicFilter(topicFilter === t.topic ? '' : t.topic)
                                    }
                                    className={cn(
                                        'rounded-[var(--radius-md)] border p-2.5 text-left transition-colors min-h-[44px]',
                                        topicFilter === t.topic
                                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                                            : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/30',
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium truncate">{t.topic}</span>
                                        <span className="text-[10px] text-[var(--color-text-muted)]">
                                            {t.correct}/{t.total}
                                        </span>
                                    </div>
                                    <div className="h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all',
                                                pct >= 70 ? 'bg-emerald-500' : 'bg-[var(--color-accent)]',
                                            )}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Question Cards */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <Brain className="h-3 w-3" />
                        Questions ({filtered.length})
                    </h3>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-sm text-[var(--color-text-muted)]">
                        {questions.length === 0
                            ? 'No questions answered yet. Start learning to build your revision history!'
                            : 'No questions match the current filters.'}
                    </div>
                ) : (
                    <AnimatePresence>
                        {filtered.map((qa, i) => {
                            const daysUntilReview = qa.next_review_at
                                ? Math.max(
                                      0,
                                      Math.ceil(
                                          (new Date(qa.next_review_at).getTime() - Date.now()) /
                                              (1000 * 60 * 60 * 24),
                                      ),
                                  )
                                : null;

                            return (
                                <motion.div
                                    key={qa.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                    className={cn(
                                        'rounded-[var(--radius-md)] border p-3.5 space-y-2',
                                        qa.is_correct
                                            ? 'border-emerald-500/15 bg-emerald-500/[0.02]'
                                            : 'border-red-500/15 bg-red-500/[0.02]',
                                    )}
                                >
                                    {/* Question */}
                                    <div className="flex items-start gap-2">
                                        {qa.is_correct ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        )}
                                        <p className="text-sm font-medium flex-1">
                                            {qa.question_text}
                                        </p>
                                    </div>

                                    {/* Answers */}
                                    <div className="pl-6 space-y-1">
                                        <p className="text-xs">
                                            <span className="text-[var(--color-text-muted)]">
                                                Your answer:{' '}
                                            </span>
                                            <span
                                                className={cn(
                                                    'font-medium',
                                                    qa.is_correct ? 'text-emerald-600' : 'text-red-600',
                                                )}
                                            >
                                                {qa.user_answer}
                                            </span>
                                        </p>
                                        {!qa.is_correct && (
                                            <p className="text-xs">
                                                <span className="text-[var(--color-text-muted)]">
                                                    Correct:{' '}
                                                </span>
                                                <span className="font-medium text-emerald-600">
                                                    {qa.correct_answer}
                                                </span>
                                            </p>
                                        )}
                                        {qa.explanation && (
                                            <p className="text-[11px] text-[var(--color-text-muted)] italic mt-1">
                                                {qa.explanation}
                                            </p>
                                        )}
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-2 pl-6 flex-wrap">
                                        {qa.topic && (
                                            <Badge variant="outline" className="text-[10px]">
                                                {qa.topic}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-[10px]">
                                            {qa.difficulty}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px]">
                                            {qa.question_type.replace('_', '/')}
                                        </Badge>
                                        {daysUntilReview !== null && (
                                            <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] ml-auto">
                                                <Clock className="h-3 w-3" />
                                                {daysUntilReview === 0
                                                    ? 'Due now'
                                                    : `Review in ${daysUntilReview}d`}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

