import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, BookOpen, Trophy, ArrowRight, Sparkles, Trash2, Map, Eye, Clock3, AlertTriangle, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, type ClassData, type ProgressData } from '@/lib/api';
import { hasOpenRouterConfiguration } from '@/lib/byok';

function ClassCard({ classData, progress, onDelete }: {
    classData: ClassData;
    progress?: ProgressData;
    onDelete?: (classId: string) => void;
}) {
    const navigate = useNavigate();
    const mastery = progress?.overall_mastery || 0;
    const currentModule = classData.roadmap?.modules.find(m => m.id === classData.current_module_id);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const statusConfig = {
        clarifying: { label: 'Setting Up', variant: 'default' as const },
        negotiating: { label: 'Reviewing Roadmap', variant: 'warning' as const },
        locked: { label: 'Ready', variant: 'accent' as const },
        in_progress: { label: 'Learning', variant: 'success' as const },
        completed: { label: 'Completed', variant: 'success' as const },
    };

    const status = statusConfig[classData.status];

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await api.deleteClass(classData.id);
            onDelete?.(classData.id);
        } catch (err) {
            console.error('Failed to delete class:', err);
        }
        setIsDeleting(false);
        setShowDeleteDialog(false);
    };

    return (
        <>
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
                <Card
                    className="group relative cursor-pointer overflow-hidden border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,253,249,0.96),rgba(247,240,233,0.92))] transition-all duration-300 hover:border-[var(--color-accent)]/30 hover:shadow-[0_18px_50px_rgba(43,29,22,0.12)]"
                    onClick={() => navigate(`/session/${classData.id}`)}
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(211,106,58,0.14),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <Badge variant={status.variant}>{status.label}</Badge>
                                <CardTitle className="mt-2.5 text-xl transition-colors group-hover:text-[var(--color-accent)]">
                                    {classData.title}
                                </CardTitle>
                                <CardDescription className="mt-1 line-clamp-2">
                                    {classData.description}
                                </CardDescription>
                            </div>
                            <div className="ml-4 flex flex-shrink-0 flex-col items-center gap-3">
                                <div className="relative h-14 w-14">
                                    <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                                        <circle cx="28" cy="28" r="24" stroke="var(--color-bg-muted)" strokeWidth="4" fill="none" />
                                        <circle
                                            cx="28"
                                            cy="28"
                                            r="24"
                                            stroke="var(--color-accent)"
                                            strokeWidth="4"
                                            fill="none"
                                            strokeDasharray={`${mastery * 1.508} 150.8`}
                                            strokeLinecap="round"
                                            className="transition-all duration-700"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                                        {mastery}%
                                    </span>
                                </div>
                                <div className="rounded-full border border-[var(--color-border)] bg-white/75 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] shadow-sm">
                                    {classData.status === 'completed' ? 'Archive' : 'Live'}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {currentModule && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[var(--color-text-secondary)]">
                                        Current: <span className="font-medium text-[var(--color-text-primary)]">{currentModule.title}</span>
                                    </span>
                                </div>
                                <Progress value={mastery} size="sm" />
                            </div>
                        )}
                        {!currentModule && classData.status === 'clarifying' && (
                            <p className="text-sm text-[var(--color-text-muted)]">Continue setting up your learning plan...</p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                            <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-white/70 px-2.5 py-1">
                                <BookOpen className="h-3 w-3" />
                                {classData.roadmap ? `${classData.roadmap.modules.length} modules` : 'No roadmap yet'}
                            </div>
                            <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-white/70 px-2.5 py-1">
                                <Clock3 className="h-3 w-3" />
                                Updated {new Date(classData.updated_at).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 rounded-full bg-white/80"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/session/${classData.id}`);
                                }}
                            >
                                <Eye className="h-3.5 w-3.5" />
                                View
                            </Button>
                            <div className="flex items-center gap-2">
                                {classData.roadmap && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1.5 rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/roadmap/${classData.id}`);
                                        }}
                                    >
                                        <Map className="h-3.5 w-3.5" />
                                        Roadmap
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600"
                                    onClick={handleDelete}
                                    title="Delete Class"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[var(--color-accent)]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Class</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{classData.title}"?
                            This will permanently remove the class and all associated data including
                            messages, progress, questions, test results, and flashcards.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.165, 0.85, 0.45, 1] }}
            className="flex flex-col items-center justify-center py-20 text-center"
        >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-accent-light)]">
                <Sparkles className="h-9 w-9 text-[var(--color-accent)]" />
            </div>
            <h2 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                Begin Your Learning Journey
            </h2>
            <p className="mt-2 max-w-md text-[var(--color-text-secondary)]">
                Create your first class and let your personal AI tutor guide you through structured, question-based learning.
            </p>
            <Button size="lg" className="mt-8 gap-2" onClick={() => navigate('/create')} disabled={!canCreate}>
                <Plus className="h-4 w-4" />
                Create Your First Class
            </Button>
            {!canCreate ? (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    Add your OpenRouter key in <Link to="/settings" className="text-[var(--color-accent)] underline underline-offset-2">Settings</Link> first.
                </p>
            ) : null}
        </motion.div>
    );
}

export default function Dashboard() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const hasByok = hasOpenRouterConfiguration();

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const { classes: fetchedClasses } = await api.listClasses();
                setClasses(fetchedClasses);

                const progressPromises = fetchedClasses.map(c => api.getProgress(c.id));
                const progressResults = await Promise.all(progressPromises);

                const newProgressMap: Record<string, ProgressData> = {};
                progressResults.forEach(res => {
                    newProgressMap[res.progress.class_id] = res.progress;
                });
                setProgressMap(newProgressMap);
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 300);
            }
        };

        loadDashboardData();
    }, []);

    const handleDeleteClass = (classId: string) => {
        setClasses(prev => prev.filter(c => c.id !== classId));
    };

    const activeClasses = classes.filter(c => c.status !== 'completed');
    const completedClasses = classes.filter(c => c.status === 'completed');

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-medium tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                        Welcome back
                    </h1>
                    <p className="mt-1 text-[var(--color-text-secondary)]">
                        Continue your learning journey or start something new.
                    </p>
                </div>
                <Button className="gap-2 self-start lg:self-auto" onClick={() => window.location.assign('/create')} disabled={!hasByok}>
                    <Plus className="h-4 w-4" />
                    New Class
                </Button>
            </div>

            {!hasByok ? (
                <div className="mb-6 rounded-[24px] border border-[var(--color-warning)]/30 bg-[linear-gradient(180deg,rgba(255,248,238,0.95),rgba(255,243,226,0.92))] p-5 shadow-[var(--shadow-sm)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full bg-[var(--color-warning-light)] p-2 text-[var(--color-warning)]">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-[var(--color-text-primary)]">OpenRouter key required for learning actions</p>
                                <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
                                    The dashboard still loads your classes, but Mentara no longer uses a server OpenRouter key. Add your own key and optional model in Settings before creating a class or continuing LLM-backed actions.
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" className="gap-2 self-start lg:self-auto" onClick={() => window.location.assign('/settings')}>
                            <KeyRound className="h-4 w-4" />
                            Open Settings
                        </Button>
                    </div>
                </div>
            ) : null}

            {classes.length === 0 ? (
                <EmptyState canCreate={hasByok} />
            ) : (
                <div className="space-y-8">
                    {activeClasses.length > 0 && (
                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <BookOpen className="h-4.5 w-4.5 text-[var(--color-accent)]" />
                                <h2 className="text-lg font-medium" style={{ fontFamily: 'var(--font-heading)' }}>Active Classes</h2>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                                {activeClasses.map(c => (
                                    <ClassCard key={c.id} classData={c} progress={progressMap[c.id]} onDelete={handleDeleteClass} />
                                ))}
                            </div>
                        </section>
                    )}

                    {completedClasses.length > 0 && (
                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <Trophy className="h-4.5 w-4.5 text-[var(--color-success)]" />
                                <h2 className="text-lg font-medium" style={{ fontFamily: 'var(--font-heading)' }}>Completed</h2>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                                {completedClasses.map(c => (
                                    <ClassCard key={c.id} classData={c} progress={progressMap[c.id]} onDelete={handleDeleteClass} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
