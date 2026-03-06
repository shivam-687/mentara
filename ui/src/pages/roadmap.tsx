// ── Roadmap Page ──
// Standalone read-only view of the class roadmap.
// Accessible from dashboard, session top bar, and nav.

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { RoadmapTimeline } from '@/components/roadmap/roadmap-timeline';
import { api } from '@/lib/api';
import type { ClassData, ProgressData } from '@/lib/api';

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'accent' | 'success' }> = {
    clarifying: { label: 'Setting Up', variant: 'default' },
    negotiating: { label: 'Reviewing Roadmap', variant: 'warning' },
    locked: { label: 'Ready', variant: 'accent' },
    in_progress: { label: 'Learning', variant: 'success' },
    completed: { label: 'Completed', variant: 'success' },
};

export default function RoadmapPage() {
    const { classId } = useParams<{ classId: string }>();
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!classId) return;
        const load = async () => {
            try {
                const [classRes, progressRes] = await Promise.all([
                    api.getClass(classId),
                    api.getProgress(classId).catch(() => ({ progress: null as ProgressData | null })),
                ]);
                setClassData(classRes.class);
                setProgress(progressRes.progress);
            } catch (err) {
                console.error('Failed to load roadmap data:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [classId]);

    if (loading || !classData) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
        );
    }

    if (!classData.roadmap) {
        return (
            <div className="mx-auto max-w-2xl py-20 text-center">
                <p className="text-[var(--color-text-secondary)]">No roadmap generated yet.</p>
                <Link to={`/session/${classId}`}>
                    <Button variant="accent" className="mt-4">
                        Go to Session
                    </Button>
                </Link>
            </div>
        );
    }

    const status = statusConfig[classData.status];
    const totalSubtopics = classData.roadmap.modules.reduce((sum, m) => sum + m.subtopics.length, 0);
    const completedModules = classData.roadmap.modules.filter(m => m.status === 'completed').length;

    return (
        <div className="animate-fade-in mx-auto max-w-3xl py-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 flex items-start gap-3"
            >
                <Link to={classData.status === 'in_progress' || classData.status === 'locked' ? `/session/${classId}` : '/'}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {status && <Badge variant={status.variant}>{status.label}</Badge>}
                    </div>
                    <h1 className="text-2xl font-medium tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                        {classData.title}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {classData.roadmap.modules.length} modules &middot; {totalSubtopics} topics
                        {progress && progress.overall_mastery > 0 && (
                            <> &middot; {progress.overall_mastery}% mastery</>
                        )}
                    </p>
                </div>
                {/* Quick actions */}
                <div className="flex items-center gap-2 mt-1">
                    {(classData.status === 'in_progress' || classData.status === 'locked') && (
                        <Link to={`/progress/${classId}`}>
                            <Button variant="ghost" size="sm" className="gap-1.5">
                                <BarChart3 className="h-3.5 w-3.5" />
                                Progress
                            </Button>
                        </Link>
                    )}
                </div>
            </motion.div>

            {/* Summary stats */}
            {progress && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-3 gap-3 mb-8"
                >
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-center">
                        <p className="text-2xl font-bold">{completedModules}/{classData.roadmap.modules.length}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Modules</p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-center">
                        <p className="text-2xl font-bold text-[var(--color-accent)]">{progress.overall_mastery}%</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Mastery</p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-center">
                        <p className="text-2xl font-bold">{progress.total_questions}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Questions</p>
                    </div>
                </motion.div>
            )}

            {/* Roadmap Timeline */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-surface)]"
            >
                <RoadmapTimeline
                    modules={classData.roadmap.modules}
                    currentModuleId={classData.current_module_id}
                    currentSubtopicIndex={classData.current_subtopic_index}
                />
            </motion.div>

            {/* Continue Learning CTA */}
            {(classData.status === 'in_progress' || classData.status === 'locked') && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 text-center"
                >
                    <Link to={`/session/${classId}`}>
                        <Button variant="accent" size="lg" className="gap-2">
                            <BookOpen className="h-4 w-4" />
                            Continue Learning
                        </Button>
                    </Link>
                </motion.div>
            )}
        </div>
    );
}
