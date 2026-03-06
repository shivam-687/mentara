// ── Module Header ──
// Shows the current module and subtopic at the top of the learning view.

import { BookOpen } from 'lucide-react';
import type { ClassData } from '@/lib/api';

interface ModuleHeaderProps {
    classData: ClassData;
}

export function ModuleHeader({ classData }: ModuleHeaderProps) {
    if (!classData.roadmap || !classData.current_module_id) return null;

    const currentModule = classData.roadmap.modules.find(m => m.id === classData.current_module_id);
    if (!currentModule) return null;

    const currentSubtopic = currentModule.subtopics[classData.current_subtopic_index];
    const subtopicProgress = Math.round(
        (classData.current_subtopic_index / Math.max(currentModule.subtopics.length, 1)) * 100
    );
    // Use mastery score if available, otherwise fall back to subtopic position
    const progress = currentModule.mastery_score > 0 ? currentModule.mastery_score : subtopicProgress;

    return (
        <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] px-6 py-3">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="font-medium text-[var(--color-text-primary)]">{currentModule.title}</span>
                {currentSubtopic && (
                    <>
                        <span className="text-[var(--color-border)]">/</span>
                        <span>{currentSubtopic}</span>
                    </>
                )}
            </div>
            <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div
                        className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="text-[10px] font-medium text-[var(--color-text-muted)] tabular-nums w-8 text-right">
                    {progress}%
                </span>
            </div>
        </div>
    );
}
