import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type ClassData, type ClassNotesData, type HistoryMessage, type ProgressData, type RevisionStats, type TestResultData } from '@/lib/api';
import { ArrowLeft, BookCheck, Brain, CheckCircle2, Clock3, FileText, GraduationCap, Loader2, NotebookPen, Sparkles, Target, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletionPhaseProps {
    classData: ClassData;
    progress: ProgressData | null;
}

function formatTimestamp(value: string | null | undefined): string {
    if (!value) return 'Not generated yet';
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

function compactText(content: string, limit = 220): string {
    const normalized = content.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, ' ').trim();
    if (normalized.length <= limit) return normalized;
    return `${normalized.slice(0, limit).trim()}...`;
}

export default function CompletionPhase({ classData, progress }: CompletionPhaseProps) {
    const [notes, setNotes] = useState<ClassNotesData | null>(null);
    const [history, setHistory] = useState<HistoryMessage[]>([]);
    const [revisionStats, setRevisionStats] = useState<RevisionStats | null>(null);
    const [tests, setTests] = useState<TestResultData[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(true);
    const [generatingNotes, setGeneratingNotes] = useState(false);
    const [updatingSettings, setUpdatingSettings] = useState(false);

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                const [{ notes: notesData }, { history: historyData }, { stats }, { tests: testData }] = await Promise.all([
                    api.getClassNotes(classData.id),
                    api.getHistory(classData.id),
                    api.getRevisionStats(classData.id).catch(() => ({ stats: null })),
                    api.getTestResults(classData.id).catch(() => ({ tests: [] })),
                ]);

                if (!active) return;
                setNotes(notesData);
                setHistory(historyData);
                setRevisionStats(stats);
                setTests(testData);
            } catch (error) {
                console.error('Failed to load completion assets', error);
            } finally {
                if (active) setLoadingNotes(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, [classData.id]);

    useEffect(() => {
        if (loadingNotes || generatingNotes) return;
        if (!notes) return;
        if (!notes.auto_generate || notes.mode !== 'auto') return;
        if (notes.status === 'ready' && notes.generated_at) return;

        void handleGenerateNotes();
    }, [generatingNotes, loadingNotes, notes]);

    const handleGenerateNotes = async () => {
        setGeneratingNotes(true);
        try {
            const { notes: generated } = await api.generateClassNotes(classData.id);
            setNotes(generated);
        } catch (error) {
            console.error('Failed to generate notes', error);
        } finally {
            setGeneratingNotes(false);
        }
    };

    const handleToggleNotesMode = async () => {
        if (!notes) return;
        setUpdatingSettings(true);
        try {
            const nextMode = notes.mode === 'auto' ? 'manual' : 'auto';
            const { notes: updated } = await api.updateClassNotesSettings(classData.id, {
                mode: nextMode,
                auto_generate: nextMode === 'auto',
            });
            setNotes(updated);
        } catch (error) {
            console.error('Failed to update notes settings', error);
        } finally {
            setUpdatingSettings(false);
        }
    };

    const mastery = progress?.overall_mastery ?? 0;
    const accuracy = progress && progress.total_questions > 0
        ? Math.round((progress.total_correct / progress.total_questions) * 100)
        : 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (mastery / 100) * circumference;

    const classMemory = useMemo(() => {
        return history
            .filter(message => message.content.trim())
            .slice(-8)
            .map(message => ({
                role: message.role === 'assistant' ? 'Tutor' : message.role === 'user' ? 'You' : 'System',
                content: compactText(message.content),
                timestamp: formatTimestamp(message.timestamp),
            }));
    }, [history]);

    const strongestModules = useMemo(() => {
        return [...(classData.roadmap?.modules || [])]
            .sort((a, b) => b.mastery_score - a.mastery_score)
            .slice(0, 4);
    }, [classData.roadmap]);

    return (
        <div className="h-full overflow-y-auto">
            <div className="mx-auto w-full max-w-[92rem] px-6 py-8 pb-16 xl:px-10">
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]"
                >
                    <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,#1F1A17_0%,#2F2721_45%,#E36B39_160%)] text-[var(--color-text-inverse)] shadow-[var(--shadow-lg)]">
                        <CardContent className="p-8">
                            <div className="flex flex-wrap items-start justify-between gap-6">
                                <div className="max-w-3xl space-y-4">
                                    <Badge variant="outline" className="border-white/20 bg-white/10 text-white">Class Completed</Badge>
                                    <div>
                                        <h1 className="text-4xl font-medium tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                                            {classData.title}
                                        </h1>
                                        <p className="mt-3 max-w-2xl text-sm text-white/80">
                                            The class is finished, but the workspace should still help with recall, revision, and reuse. This view keeps the class memory, the strongest modules, and the NoteTaker study packet in one place.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Link to={`/revision/${classData.id}`}>
                                            <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                                                <Brain className="h-4 w-4" />
                                                Open Revision
                                            </Button>
                                        </Link>
                                        <Link to={`/progress/${classData.id}`}>
                                            <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                                                <Target className="h-4 w-4" />
                                                View Progress
                                            </Button>
                                        </Link>
                                        <Button onClick={handleGenerateNotes} disabled={generatingNotes} className="bg-white text-[#1F1A17] hover:bg-white/90">
                                            {generatingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
                                            Refresh Notes
                                        </Button>
                                    </div>
                                </div>

                                <div className="rounded-[2rem] border border-white/15 bg-black/10 p-4 backdrop-blur-sm">
                                    <div className="relative h-[170px] w-[170px]">
                                        <svg width="170" height="170" className="-rotate-90">
                                            <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="10" />
                                            <circle
                                                cx="85"
                                                cy="85"
                                                r={radius}
                                                fill="none"
                                                stroke="#F5D7C3"
                                                strokeWidth="10"
                                                strokeLinecap="round"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={offset}
                                                className="transition-all duration-1000"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <span className="text-4xl font-semibold">{mastery}%</span>
                                            <span className="text-xs uppercase tracking-[0.25em] text-white/70">Mastery</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <NotebookPen className="h-5 w-5 text-[var(--color-accent)]" />
                                        NoteTaker
                                    </CardTitle>
                                    <CardDescription>
                                        Separate study-companion output with auto or manual capture.
                                    </CardDescription>
                                </div>
                                {notes && (
                                    <Badge variant={notes.mode === 'auto' ? 'accent' : 'outline'}>
                                        {notes.mode === 'auto' ? 'Auto Mode' : 'Manual Mode'}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3">
                                    <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Status</p>
                                    <p className="mt-2 text-sm font-medium capitalize">{notes?.status || 'idle'}</p>
                                </div>
                                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3">
                                    <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Last Capture</p>
                                    <p className="mt-2 text-sm font-medium">{formatTimestamp(notes?.generated_at)}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" onClick={handleToggleNotesMode} disabled={!notes || updatingSettings}>
                                    {updatingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    Switch to {notes?.mode === 'auto' ? 'Manual' : 'Auto'}
                                </Button>
                                <Button variant="secondary" onClick={handleGenerateNotes} disabled={generatingNotes}>
                                    {generatingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                    Capture Current Notes
                                </Button>
                            </div>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Auto mode refreshes the study packet when you reach completion. Manual mode keeps notes stable until you explicitly capture a new version.
                            </p>
                        </CardContent>
                    </Card>
                </motion.section>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Study Packet</CardTitle>
                                <CardDescription>
                                    Durable notes from the class, generated by the NoteTaker companion.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingNotes ? (
                                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading notes...
                                    </div>
                                ) : notes?.markdown ? (
                                    <div className="prose prose-sm max-w-none text-[var(--color-text-primary)] prose-headings:font-[var(--font-heading)] prose-p:text-[var(--color-text-secondary)] prose-strong:text-[var(--color-text-primary)] prose-li:text-[var(--color-text-secondary)]">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes.markdown}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-muted)] p-6 text-sm text-[var(--color-text-secondary)]">
                                        No study packet yet. Generate notes to turn this class into a reusable study artifact.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Class Memory</CardTitle>
                                <CardDescription>
                                    The most recent visible moments from the class, preserved after completion.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {classMemory.length === 0 ? (
                                    <p className="text-sm text-[var(--color-text-secondary)]">No visible history found for this class.</p>
                                ) : classMemory.map((entry, index) => (
                                    <div key={`${entry.timestamp}-${index}`} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-4">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <span className={cn(
                                                'text-xs font-medium uppercase tracking-widest',
                                                entry.role === 'Tutor' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                                            )}>
                                                {entry.role}
                                            </span>
                                            <span className="text-[11px] text-[var(--color-text-muted)]">{entry.timestamp}</span>
                                        </div>
                                        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{entry.content}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                            {[
                                { label: 'Modules Completed', value: `${progress?.modules_completed ?? 0}/${progress?.modules_total ?? 0}`, icon: BookCheck, accent: 'var(--color-accent)' },
                                { label: 'Questions Answered', value: `${progress?.total_questions ?? 0}`, icon: GraduationCap, accent: 'var(--color-warning)' },
                                { label: 'Accuracy', value: `${accuracy}%`, icon: Target, accent: 'var(--color-success)' },
                                { label: 'Due For Review', value: `${revisionStats?.due_for_review ?? 0}`, icon: Clock3, accent: 'var(--color-text-primary)' },
                            ].map(stat => (
                                <Card key={stat.label}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">{stat.label}</p>
                                                <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">{stat.value}</p>
                                            </div>
                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-bg-muted)]">
                                                <stat.icon className="h-5 w-5" style={{ color: stat.accent }} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Journey</CardTitle>
                                <CardDescription>
                                    How this class unfolded across modules.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {(classData.roadmap?.modules || []).map(module => (
                                    <div key={module.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{module.title}</p>
                                                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{module.subtopics.length} subtopics</p>
                                            </div>
                                            <Badge variant={module.mastery_score >= 80 ? 'success' : module.mastery_score >= 60 ? 'accent' : 'warning'}>
                                                {module.mastery_score}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Best Signals</CardTitle>
                                <CardDescription>
                                    Strongest modules, focus concepts, and recent assessment data.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-text-muted)]">Strongest Modules</p>
                                    <div className="space-y-2">
                                        {strongestModules.map(module => (
                                            <div key={module.id} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] px-3 py-2">
                                                <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                                                <span className="flex-1 text-sm text-[var(--color-text-primary)]">{module.title}</span>
                                                <span className="text-xs font-medium text-[var(--color-text-secondary)]">{module.mastery_score}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {notes?.key_takeaways?.length ? (
                                    <div>
                                        <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-text-muted)]">Key Takeaways</p>
                                        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                                            {notes.key_takeaways.map(item => <li key={item} className="rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] px-3 py-2">{item}</li>)}
                                        </ul>
                                    </div>
                                ) : null}
                                {tests.length > 0 ? (
                                    <div>
                                        <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-text-muted)]">Assessments</p>
                                        <div className="space-y-2">
                                            {tests.slice(0, 4).map(test => (
                                                <div key={test.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-[var(--color-text-primary)]">{test.title}</span>
                                                        <Badge variant={test.score >= 80 ? 'success' : 'warning'}>{test.score}%</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>

                        <div className="flex flex-wrap gap-3">
                            <Link to="/">
                                <Button variant="outline">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                            <Link to={`/revision/${classData.id}`}>
                                <Button>
                                    <Trophy className="h-4 w-4" />
                                    Keep Practicing
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

