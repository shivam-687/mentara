// ── Roadmap Timeline ──
// Vertical timeline showing modules as nodes with subtopics branching off.
// Used in both the negotiating phase (full) and learning phase sidebar (compact).

import React from 'react';
import { CheckCircle2, Circle, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Module {
    id: string;
    title: string;
    subtopics: string[];
    status: 'not_started' | 'in_progress' | 'completed';
    mastery_score: number;
    questions_asked: number;
    questions_correct: number;
}

interface RoadmapTimelineProps {
    modules: Module[];
    currentModuleId: string | null;
    currentSubtopicIndex: number;
    compact?: boolean;
}

export function RoadmapTimeline({ modules, currentModuleId, currentSubtopicIndex, compact = false }: RoadmapTimelineProps) {
    const [expandedModule, setExpandedModule] = useState<string | null>(currentModuleId);

    // Auto-expand current module when it changes
    React.useEffect(() => {
        if (currentModuleId) setExpandedModule(currentModuleId);
    }, [currentModuleId]);

    return (
        <div className={cn('relative', compact ? 'px-3 py-2' : 'px-6 py-4')}>
            {/* Vertical line */}
            <div className="absolute left-[1.65rem] top-0 bottom-0 w-px bg-[var(--color-border)]" style={compact ? { left: '1.15rem' } : {}} />

            <div className="space-y-0">
                {modules.map((mod, idx) => {
                    const isCurrent = mod.id === currentModuleId;
                    const isExpanded = expandedModule === mod.id;
                    const isCompleted = mod.status === 'completed';

                    return (
                        <div key={mod.id} className={cn(
                            'relative',
                            isCurrent && 'bg-[var(--color-accent-light)]/30 rounded-lg -mx-1 px-1'
                        )}>
                            {/* Node */}
                            <button
                                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                                className={cn(
                                    'relative flex w-full items-start gap-3 py-3 text-left transition-all cursor-pointer',
                                    compact ? 'py-2' : 'py-3',
                                )}
                            >
                                {/* Circle node on the timeline */}
                                <div className={cn(
                                    'relative z-10 flex-shrink-0 flex items-center justify-center rounded-full border-2 bg-[var(--color-bg-surface)]',
                                    compact ? 'h-6 w-6' : 'h-8 w-8',
                                    isCompleted
                                        ? 'border-[var(--color-success)] bg-[var(--color-success)]'
                                        : isCurrent
                                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                                            : 'border-[var(--color-border)]'
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle2 className={cn('text-white', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
                                    ) : isCurrent ? (
                                        <BookOpen className={cn('text-[var(--color-accent)]', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                                    ) : (
                                        <span className={cn(
                                            'font-medium text-[var(--color-text-muted)]',
                                            compact ? 'text-[10px]' : 'text-xs'
                                        )}>
                                            {idx + 1}
                                        </span>
                                    )}
                                </div>

                                {/* Module info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            'font-medium truncate',
                                            compact ? 'text-xs' : 'text-sm',
                                            isCurrent
                                                ? 'text-[var(--color-accent)]'
                                                : isCompleted
                                                    ? 'text-[var(--color-success)]'
                                                    : 'text-[var(--color-text-primary)]'
                                        )}>
                                            {mod.title}
                                        </span>
                                        {!compact && (
                                            isExpanded
                                                ? <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)] flex-shrink-0" />
                                                : <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)] flex-shrink-0" />
                                        )}
                                    </div>
                                    {!compact && (
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-[var(--color-text-muted)]">
                                                {mod.subtopics.length} topics
                                            </span>
                                            {mod.mastery_score > 0 && (
                                                <span className={cn(
                                                    'text-[10px] font-medium',
                                                    mod.mastery_score >= 70 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'
                                                )}>
                                                    {mod.mastery_score}%
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {compact && mod.mastery_score > 0 && (
                                        <div className="mt-1 h-1 w-full rounded-full bg-[var(--color-border)]">
                                            <div
                                                className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                                                style={{ width: `${mod.mastery_score}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Subtopics (expandable) */}
                            <AnimatePresence>
                                {isExpanded && (compact ? isCurrent : true) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="ml-10 mb-3 space-y-1 border-l border-[var(--color-border)] pl-4">
                                            {mod.subtopics.map((st, i) => {
                                                const isCurrentSubtopic = isCurrent && i === currentSubtopicIndex;
                                                const isCompletedSubtopic = isCurrent && i < currentSubtopicIndex;

                                                return (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            'flex items-center gap-2 rounded px-2 py-1 text-xs',
                                                            isCurrentSubtopic
                                                                ? 'text-[var(--color-accent)] font-medium bg-[var(--color-accent-light)]/50'
                                                                : isCompletedSubtopic || isCompleted
                                                                    ? 'text-[var(--color-success)]'
                                                                    : 'text-[var(--color-text-muted)]'
                                                        )}
                                                    >
                                                        {(isCompletedSubtopic || isCompleted) && (
                                                            <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                                                        )}
                                                        {isCurrentSubtopic && (
                                                            <Circle className="h-3 w-3 flex-shrink-0 fill-current" />
                                                        )}
                                                        <span>{st}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
