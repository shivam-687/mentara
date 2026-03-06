// ── Session Page ──
// Phase-aware router. Full-viewport layout during learning.
// clarifying → SetupWizard | negotiating → RoadmapPhase
// in_progress → LearningPhase | completed → CompletionPhase

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import type { ClassData, ProgressData } from '@/lib/api';

import SetupPhase from '@/pages/session/setup-phase';
import RoadmapPhase from '@/pages/session/roadmap-phase';
import LearningPhase from '@/pages/session/learning-phase';
import CompletionPhase from '@/pages/session/completion-phase';

export default function Session() {
    const { classId } = useParams<{ classId: string }>();
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        if (!classId) return;
        let active = true;

        const loadData = async () => {
            try {
                const [classRes, progressRes] = await Promise.all([
                    api.getClass(classId),
                    api.getProgress(classId).catch(() => ({ progress: null as ProgressData | null })),
                ]);

                if (active) {
                    setClassData(classRes.class);
                    setProgress(progressRes.progress);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Failed to load session data', error);
                setLoading(false);
            }
        };

        loadData();
        return () => { active = false; };
    }, [classId]);

    // Update handler passed to all phase components
    const handleUpdate = useCallback((updatedClass: ClassData, updatedProgress?: ProgressData) => {
        setClassData(updatedClass);
        if (updatedProgress) setProgress(updatedProgress);
    }, []);

    if (loading || !classData) {
        return (
            <div className="animate-fade-in -mx-6 -my-8 flex h-[calc(100vh-3.5rem)] items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 mx-auto mb-3 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                    <p className="text-sm text-[var(--color-text-secondary)]">Loading session...</p>
                </div>
            </div>
        );
    }

    // For learning phase, use full-viewport layout (no app shell padding)
    const isLearning = classData.status === 'in_progress' || classData.status === 'locked';

    return (
        <div className="animate-fade-in -mx-6 -my-8 flex h-[calc(100vh-3.5rem)] flex-col">
            {/* Compact Top Bar — only back button + title */}
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2 z-10 relative shadow-sm flex-shrink-0">
                <Link to="/">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                </Link>
                <h2 className="text-sm font-medium leading-tight truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                    {classData.title}
                </h2>
            </div>

            {/* Phase-Aware Body — uses all remaining space */}
            <div className="flex-1 overflow-hidden bg-[var(--color-bg-base)]">
                {classData.status === 'clarifying' && (
                    <SetupPhase classData={classData} onUpdate={handleUpdate} />
                )}
                {classData.status === 'negotiating' && (
                    <RoadmapPhase classData={classData} onUpdate={handleUpdate} />
                )}
                {isLearning && (
                    <LearningPhase classData={classData} progress={progress} onUpdate={handleUpdate} />
                )}
                {classData.status === 'completed' && (
                    <CompletionPhase classData={classData} progress={progress} />
                )}
            </div>
        </div>
    );
}
