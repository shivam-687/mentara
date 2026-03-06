// ── Completion Phase ──
// Summary view when all modules are completed.
// Shows mastery ring, stats, module breakdown, and weak concepts.

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Trophy, Target, BookCheck, HelpCircle } from 'lucide-react';
import type { ClassData, ProgressData } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CompletionPhaseProps {
    classData: ClassData;
    progress: ProgressData | null;
}

export default function CompletionPhase({ classData, progress }: CompletionPhaseProps) {
    const mastery = progress?.overall_mastery ?? 0;
    const accuracy = progress && progress.total_questions > 0
        ? Math.round((progress.total_correct / progress.total_questions) * 100)
        : 0;

    // SVG mastery ring
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (mastery / 100) * circumference;

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto py-12 px-6">
                {/* Congratulations Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.165, 0.85, 0.45, 1] }}
                    className="text-center mb-10"
                >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-light)]">
                        <Trophy className="h-8 w-8 text-[var(--color-success)]" />
                    </div>
                    <h1
                        className="text-3xl font-medium"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Course Completed!
                    </h1>
                    <p className="mt-2 text-[var(--color-text-secondary)]">
                        You've finished all modules in <strong>{classData.title}</strong>
                    </p>
                </motion.div>

                {/* Mastery Ring */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-10"
                >
                    <div className="relative">
                        <svg width="160" height="160" className="-rotate-90">
                            <circle
                                cx="80" cy="80" r={radius}
                                fill="none"
                                stroke="var(--color-border)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="80" cy="80" r={radius}
                                fill="none"
                                stroke="var(--color-success)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-[var(--color-text-primary)]">{mastery}%</span>
                            <span className="text-xs text-[var(--color-text-muted)]">Mastery</span>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-3 gap-4 mb-8"
                >
                    <Card className="hover:shadow-[var(--shadow-sm)]">
                        <CardContent className="pt-6 text-center">
                            <BookCheck className="h-5 w-5 mx-auto mb-2 text-[var(--color-accent)]" />
                            <div className="text-2xl font-bold">{progress?.modules_completed ?? 0}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Modules Completed</div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-[var(--shadow-sm)]">
                        <CardContent className="pt-6 text-center">
                            <HelpCircle className="h-5 w-5 mx-auto mb-2 text-[var(--color-warning)]" />
                            <div className="text-2xl font-bold">{progress?.total_questions ?? 0}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Questions Answered</div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-[var(--shadow-sm)]">
                        <CardContent className="pt-6 text-center">
                            <Target className="h-5 w-5 mx-auto mb-2 text-[var(--color-success)]" />
                            <div className="text-2xl font-bold">{accuracy}%</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Accuracy</div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Module Breakdown */}
                {classData.roadmap && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h3 className="text-sm font-medium uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
                            Module Breakdown
                        </h3>
                        <div className="space-y-2">
                            {classData.roadmap.modules.map((mod) => (
                                <div
                                    key={mod.id}
                                    className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3"
                                >
                                    <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] flex-shrink-0" />
                                    <span className="flex-1 text-sm">{mod.title}</span>
                                    <span className={cn(
                                        'text-xs font-medium px-2 py-0.5 rounded-full',
                                        mod.mastery_score >= 70
                                            ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                                            : 'bg-[var(--color-warning-light)] text-[var(--color-warning)]'
                                    )}>
                                        {mod.mastery_score}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Weak Concepts */}
                {progress?.weak_concepts && progress.weak_concepts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6"
                    >
                        <h3 className="text-sm font-medium uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
                            Areas for Review
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {progress.weak_concepts.map((concept, i) => (
                                <span
                                    key={i}
                                    className="rounded-full border border-[var(--color-warning)]/30 bg-[var(--color-warning-light)] px-3 py-1 text-xs text-[var(--color-warning)]"
                                >
                                    {concept}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Back to Dashboard */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-10 text-center"
                >
                    <Link to="/">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
