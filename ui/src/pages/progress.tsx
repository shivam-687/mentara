import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Trophy, Target, AlertTriangle, BookOpen, CheckCircle2, Circle, Brain, Clock, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import type { ClassData, ProgressData, RevisionStats, TestResultData } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Mastery Ring ──
function MasteryRing({ value, size = 120 }: { value: number; size?: number }) {
    const r = (size - 12) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (value / 100) * circumference;

    const color = value >= 70 ? 'var(--color-success)' : value >= 40 ? 'var(--color-warning)' : 'var(--color-accent)';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="-rotate-90" width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-bg-muted)" strokeWidth="8" fill="none" />
                <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="8" fill="none"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold">{value}%</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">Mastery</span>
            </div>
        </div>
    );
}

// ── Progress Page ──
export default function ProgressPage() {
    const { classId } = useParams<{ classId: string }>();
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [revisionStats, setRevisionStats] = useState<RevisionStats | null>(null);
    const [testResults, setTestResults] = useState<TestResultData[]>([]);

    useEffect(() => {
        if (!classId) return;
        const load = async () => {
            try {
                const [classRes, progressRes] = await Promise.all([
                    api.getClass(classId),
                    api.getProgress(classId),
                ]);
                setClassData(classRes.class);
                setProgress(progressRes.progress);

                // Load revision stats and test results (non-blocking)
                const [statsRes, testsRes] = await Promise.all([
                    api.getRevisionStats(classId).catch(() => ({ stats: null })),
                    api.getTestResults(classId).catch(() => ({ tests: [] })),
                ]);
                if (statsRes.stats) setRevisionStats(statsRes.stats);
                setTestResults(testsRes.tests);
            } catch { }
        };
        load();
    }, [classId]);

    if (!classData || !progress) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <Link to={`/session/${classId}`}>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                        {classData.title}
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">Learning Progress Report</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                    <Card className="text-center py-6">
                        <MasteryRing value={progress.overall_mastery} size={100} />
                        <p className="mt-2 text-sm font-medium">Overall Mastery</p>
                    </Card>
                </motion.div>

                {[
                    { label: 'Modules', value: `${progress.modules_completed}/${progress.modules_total}`, icon: BookOpen, color: 'var(--color-accent)' },
                    { label: 'Questions', value: `${progress.total_correct}/${progress.total_questions}`, icon: Target, color: 'var(--color-success)' },
                    { label: 'Accuracy', value: progress.total_questions > 0 ? `${Math.round((progress.total_correct / progress.total_questions) * 100)}%` : 'N/A', icon: Trophy, color: 'var(--color-warning)' },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.08 }}>
                        <Card className="flex flex-col items-center justify-center py-6">
                            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}>
                                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                            </div>
                            <span className="text-2xl font-semibold">{stat.value}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{stat.label}</span>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Module Breakdown */}
            {classData.roadmap && (
                <section className="mb-8">
                    <h2 className="mb-4 text-lg font-medium" style={{ fontFamily: 'var(--font-heading)' }}>Module Breakdown</h2>
                    <div className="space-y-3 stagger-children">
                        {classData.roadmap.modules.map((mod) => {
                            const StatusIcon = mod.status === 'completed' ? CheckCircle2 : mod.status === 'in_progress' ? BookOpen : Circle;
                            return (
                                <Card key={mod.id} className="!shadow-none">
                                    <CardContent className="py-4 px-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <StatusIcon className={cn('h-4 w-4', mod.status === 'completed' ? 'text-[var(--color-success)]' : mod.status === 'in_progress' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]')} />
                                                <span className="font-medium text-sm">{mod.title}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                                                <span>{mod.questions_correct}/{mod.questions_asked} correct</span>
                                                <Badge variant={mod.status === 'completed' ? 'success' : mod.status === 'in_progress' ? 'accent' : 'default'}>
                                                    {mod.mastery_score}%
                                                </Badge>
                                            </div>
                                        </div>
                                        <Progress value={mod.mastery_score} size="sm" />
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Weak Concepts */}
            {progress.weak_concepts.length > 0 && (
                <section className="mb-8">
                    <div className="mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
                        <h2 className="text-lg font-medium" style={{ fontFamily: 'var(--font-heading)' }}>Areas to Improve</h2>
                    </div>
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex flex-wrap gap-2">
                                {progress.weak_concepts.map((concept, i) => (
                                    <Badge key={i} variant="warning">{concept}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Q&A Activity Chart (last 14 days) */}
            {revisionStats && revisionStats.recent_history.some(d => d.correct + d.incorrect > 0) && (
                <section className="mb-8">
                    <div className="mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-[var(--color-accent)]" />
                        <h2 className="text-lg font-medium" style={{ fontFamily: 'var(--font-heading)' }}>Q&A Activity</h2>
                    </div>
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-end gap-1 h-28">
                                {revisionStats.recent_history.map((day, i) => {
                                    const total = day.correct + day.incorrect;
                                    const maxTotal = Math.max(...revisionStats.recent_history.map(d => d.correct + d.incorrect), 1);
                                    const heightPct = total > 0 ? (total / maxTotal) * 100 : 0;
                                    const correctPct = total > 0 ? (day.correct / total) * 100 : 0;
                                    const dateLabel = new Date(day.date).toLocaleDateString('en', { weekday: 'short' });

                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${day.date}: ${day.correct} correct, ${day.incorrect} incorrect`}>
                                            <div className="w-full relative rounded-sm overflow-hidden" style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: total > 0 ? 4 : 2 }}>
                                                {total > 0 ? (
                                                    <>
                                                        <div className="absolute bottom-0 w-full bg-emerald-500 transition-all" style={{ height: `${correctPct}%` }} />
                                                        <div className="absolute top-0 w-full bg-[var(--color-accent)]" style={{ height: `${100 - correctPct}%` }} />
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full bg-[var(--color-border)]" />
                                                )}
                                            </div>
                                            {i % 2 === 0 && (
                                                <span className="text-[8px] text-[var(--color-text-muted)]">{dateLabel}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--color-text-muted)]">
                                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Correct</span>
                                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[var(--color-accent)]" /> Incorrect</span>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Test Score Trends */}
            {testResults.length > 0 && (
                <section className="mb-8">
                    <div className="mb-4 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-[var(--color-accent)]" />
                        <h2 className="text-lg font-medium" style={{ fontFamily: 'var(--font-heading)' }}>Test Scores</h2>
                    </div>
                    <Card>
                        <CardContent className="py-4">
                            {/* SVG line chart */}
                            <svg viewBox={`0 0 ${Math.max(testResults.length * 80, 200)} 120`} className="w-full h-28" role="img" aria-label="Test score trends">
                                {/* Grid lines */}
                                {[0, 25, 50, 75, 100].map(v => (
                                    <line key={v} x1="0" y1={100 - v} x2={testResults.length * 80} y2={100 - v} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4 4" />
                                ))}
                                {/* Line */}
                                {testResults.length > 1 && (
                                    <polyline
                                        fill="none"
                                        stroke="var(--color-accent)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={testResults.map((t, i) => `${i * 80 + 40},${100 - t.score}`).join(' ')}
                                    />
                                )}
                                {/* Points */}
                                {testResults.map((t, i) => (
                                    <g key={t.id}>
                                        <circle cx={i * 80 + 40} cy={100 - t.score} r="4" fill="var(--color-accent)" stroke="var(--color-bg-surface)" strokeWidth="2" />
                                        <title>{`${t.title}: ${t.score}% (${t.correct_answers}/${t.total_questions})`}</title>
                                        <text x={i * 80 + 40} y={115} fontSize="8" textAnchor="middle" fill="var(--color-text-muted)">
                                            {t.score}%
                                        </text>
                                    </g>
                                ))}
                            </svg>
                            {/* Test list */}
                            <div className="mt-3 space-y-1.5">
                                {testResults.slice(0, 5).map(t => (
                                    <div key={t.id} className="flex items-center justify-between text-xs">
                                        <span className="text-[var(--color-text-muted)] truncate flex-1">{t.title}</span>
                                        <Badge variant="outline" className="text-[10px] ml-2">
                                            {t.correct_answers}/{t.total_questions}
                                        </Badge>
                                        <span className={cn('ml-2 font-medium tabular-nums', t.score >= 70 ? 'text-emerald-600' : 'text-[var(--color-accent)]')}>
                                            {t.score}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Revision Status */}
            {revisionStats && revisionStats.total_questions > 0 && (
                <section className="mb-8">
                    <div className="mb-4 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-[var(--color-accent)]" />
                        <h2 className="text-lg font-medium" style={{ fontFamily: 'var(--font-heading)' }}>Revision</h2>
                    </div>
                    <Card className={cn(revisionStats.due_for_review > 0 && 'border-[var(--color-accent)]/30')}>
                        <CardContent className="py-5 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10">
                                <Clock className="h-6 w-6 text-[var(--color-accent)]" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">
                                    {revisionStats.due_for_review > 0
                                        ? `${revisionStats.due_for_review} questions due for review`
                                        : 'All caught up!'}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    {revisionStats.total_questions} total questions answered
                                </p>
                            </div>
                            <Link to={`/revision/${classId}`}>
                                <Button size="sm" className="min-h-[44px]">
                                    {revisionStats.due_for_review > 0 ? 'Practice Now' : 'View All'}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Topic breakdown */}
                    {revisionStats.topic_breakdown.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                            {revisionStats.topic_breakdown.map(t => {
                                const pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
                                return (
                                    <div key={t.topic} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium truncate">{t.topic}</span>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">{pct}%</span>
                                        </div>
                                        <div className="h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                                            <div className={cn('h-full rounded-full', pct >= 70 ? 'bg-emerald-500' : 'bg-[var(--color-accent)]')} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
