import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, BookOpen, Trophy, ArrowRight, Sparkles, Trash2, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, type ClassData, type ProgressData } from '@/lib/api';

// ── Class Card ──
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
            <Card className="group cursor-pointer transition-all duration-300 hover:border-[var(--color-accent)]/30 hover:shadow-[var(--shadow-lg)]"
                onClick={() => navigate(`/session/${classData.id}`)}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <CardTitle className="mt-2.5 text-xl group-hover:text-[var(--color-accent)] transition-colors">
                                {classData.title}
                            </CardTitle>
                            <CardDescription className="mt-1 line-clamp-2">
                                {classData.description}
                            </CardDescription>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex flex-col items-center gap-2">
                            <div className="relative h-14 w-14">
                                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                                    <circle cx="28" cy="28" r="24" stroke="var(--color-bg-muted)" strokeWidth="4" fill="none" />
                                    <circle cx="28" cy="28" r="24" stroke="var(--color-accent)" strokeWidth="4" fill="none"
                                        strokeDasharray={`${mastery * 1.508} 150.8`}
                                        strokeLinecap="round" className="transition-all duration-700" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                                    {mastery}%
                                </span>
                            </div>
                            {/* Action buttons — visible on hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {classData.roadmap && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/roadmap/${classData.id}`); }}
                                        className="p-1.5 rounded-md hover:bg-[var(--color-bg-muted)] transition-colors"
                                        title="View Roadmap"
                                    >
                                        <Map className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                                    </button>
                                )}
                                <button
                                    onClick={handleDelete}
                                    className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                    title="Delete Class"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-[var(--color-text-muted)] hover:text-red-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {currentModule && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-secondary)]">Current: <span className="text-[var(--color-text-primary)] font-medium">{currentModule.title}</span></span>
                            </div>
                            <Progress value={mastery} size="sm" />
                        </div>
                    )}
                    {!currentModule && classData.status === 'clarifying' && (
                        <p className="text-sm text-[var(--color-text-muted)]">Continue setting up your learning plan...</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-muted)]">
                            {classData.roadmap ? `${classData.roadmap.modules.length} modules` : 'No roadmap yet'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-all group-hover:translate-x-1" />
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
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

// ── Empty State ──
function EmptyState() {
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
            <Button size="lg" className="mt-8 gap-2" onClick={() => navigate('/create')}>
                <Plus className="h-4 w-4" />
                Create Your First Class
            </Button>
        </motion.div>
    );
}

// ── Dashboard Page ──
export default function Dashboard() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const { classes: fetchedClasses } = await api.listClasses();
                setClasses(fetchedClasses);

                // Fetch progress for each class
                const progressPromises = fetchedClasses.map(c => api.getProgress(c.id));
                const progressResults = await Promise.all(progressPromises);

                const newProgressMap: Record<string, ProgressData> = {};
                progressResults.forEach(res => {
                    newProgressMap[res.progress.class_id] = res.progress;
                });
                setProgressMap(newProgressMap);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(true);
                // Wait a bit for the animation to feel smooth
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
            {/* Hero */}
            <div className="mb-8">
                <h1 className="text-3xl font-medium tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                    Welcome back
                </h1>
                <p className="mt-1 text-[var(--color-text-secondary)]">
                    Continue your learning journey or start something new.
                </p>
            </div>

            {classes.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-8">
                    {/* Active Classes */}
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

                    {/* Completed */}
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
