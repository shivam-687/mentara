// Learning Phase
// 3-column layout: left roadmap sidebar | content area | right info panel.

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RoadmapTimeline } from '@/components/roadmap/roadmap-timeline';
import { ContentBlock, type ContentBlockType } from '@/components/learning/content-block';
import { AdaptiveInput, type InputMode, type QuickAction } from '@/components/learning/adaptive-input';
import { HtmlArtifact } from '@/components/learning/html-artifact';
import { CodeBlock } from '@/components/tool-ui/code-block';
import { OptionList } from '@/components/tool-ui/option-list';
import { QuestionFlow } from '@/components/tool-ui/question-flow';
import { TestAssessment } from '@/components/tool-ui/test-assessment';
import { Flashcards } from '@/components/tool-ui/flashcards';
import { Interactive } from '@/components/tool-ui/interactive';
import { safeParseSerializableCodeBlock } from '@/components/tool-ui/code-block/schema';
import { safeParseSerializableOptionList } from '@/components/tool-ui/option-list/schema';
import { safeParseSerializableQuestionFlow } from '@/components/tool-ui/question-flow/schema';
import { safeParseSerializableTestAssessment } from '@/components/tool-ui/test-assessment/schema';
import { safeParseSerializableFlashcards } from '@/components/tool-ui/flashcards/schema';
import { safeParseSerializableInteractive } from '@/components/tool-ui/interactive/schema';
import { api } from '@/lib/api';
import type { ClassData, ProgressData } from '@/lib/api';
import { PanelLeftClose, PanelLeft, BookOpen, Map, BarChart3, Brain, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LearningPhaseProps {
    classData: ClassData;
    progress: ProgressData | null;
    onUpdate: (classData: ClassData, progress?: ProgressData) => void;
}

interface SendOptions {
    showStudentMessage?: boolean;
}

const INTERNAL_START_LESSON = '[INTERNAL_START_LESSON]';
const ROADMAP_INTRO = 'Here\'s your personalized learning roadmap. Would you like to add, remove, or modify any topics?';

function isHiddenLearningHistoryMessage(role: string, content: string): boolean {
    const trimmed = content.trim();

    if (!trimmed) {
        return role === 'assistant';
    }

    if (role === 'tool') {
        return true;
    }

    if (trimmed === '(Only the tool call was made as requested.)') {
        return true;
    }

    if (trimmed.startsWith(INTERNAL_START_LESSON)) {
        return true;
    }

    if (trimmed === ROADMAP_INTRO) {
        return true;
    }

    if (role === 'user' && /^(Experience level:|I want to learn:|Depth preference:|My experience level:)/i.test(trimmed)) {
        return true;
    }

    return false;
}

export default function LearningPhase({ classData, progress, onUpdate }: LearningPhaseProps) {
    const [blocks, setBlocks] = useState<ContentBlockType[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [inputMode, setInputMode] = useState<InputMode>('text');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [contextQuickActions, setContextQuickActions] = useState<QuickAction[] | undefined>(undefined);
    const scrollRef = useRef<HTMLDivElement>(null);
    const streamingTextRef = useRef('');
    const autoStartedRef = useRef(false);

    useEffect(() => {
        if (initialLoaded) return;

        const loadHistory = async () => {
            try {
                const { history } = await api.getHistory(classData.id);
                const historyBlocks: ContentBlockType[] = [];

                for (const msg of history) {
                    if (isHiddenLearningHistoryMessage(msg.role, msg.content)) {
                        continue;
                    }

                    if (msg.role === 'user') {
                        historyBlocks.push({ kind: 'student', text: msg.content });
                    } else if (msg.role === 'assistant') {
                        historyBlocks.push({ kind: 'tutor', text: msg.content });
                    }
                }

                setBlocks(historyBlocks.slice(-40));
            } catch (err) {
                console.error('Failed to load history:', err);
            } finally {
                setInitialLoaded(true);
            }
        };

        loadHistory();
    }, [classData.id, initialLoaded]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [blocks]);

    const handleSend = useCallback(async (message: string, options?: SendOptions) => {
        const showStudentMessage = options?.showStudentMessage ?? true;

        setContextQuickActions(undefined);
        if (showStudentMessage) {
            setBlocks(prev => [...prev, { kind: 'student', text: message }]);
        }

        setIsStreaming(true);
        setInputMode('hidden');
        streamingTextRef.current = '';
        setBlocks(prev => [...prev, { kind: 'tutor', text: '', isStreaming: true }]);

        try {
            for await (const event of api.sendMessageStream(classData.id, message)) {
                switch (event.type) {
                    case 'text_delta':
                        streamingTextRef.current += event.content;
                        setBlocks(prev => {
                            const updated = [...prev];
                            for (let i = updated.length - 1; i >= 0; i--) {
                                if (updated[i].kind === 'tutor' && (updated[i] as any).isStreaming) {
                                    updated[i] = { kind: 'tutor', text: streamingTextRef.current, isStreaming: true };
                                    break;
                                }
                            }
                            return updated;
                        });
                        break;

                    case 'tool_call':
                        if (streamingTextRef.current.trim()) {
                            setBlocks(prev => {
                                const updated = [...prev];
                                for (let i = updated.length - 1; i >= 0; i--) {
                                    if (updated[i].kind === 'tutor' && (updated[i] as any).isStreaming) {
                                        updated[i] = { kind: 'tutor', text: streamingTextRef.current };
                                        break;
                                    }
                                }
                                return updated;
                            });
                            streamingTextRef.current = '';
                        } else {
                            setBlocks(prev => prev.filter(block => !(block.kind === 'tutor' && (block as any).isStreaming)));
                        }

                        setBlocks(prev => [...prev, {
                            kind: 'interaction',
                            toolName: event.name,
                            toolId: event.id,
                            args: event.args,
                        }]);

                        if (['show_options', 'show_question_flow', 'show_test', 'show_flashcards'].includes(event.name)) {
                            setInputMode('hidden');
                        }
                        break;

                    case 'status':
                        onUpdate(event.class as ClassData, event.progress as ProgressData);
                        break;

                    case 'done':
                        setBlocks(prev => {
                            const updated = [...prev];
                            for (let i = updated.length - 1; i >= 0; i--) {
                                if (updated[i].kind === 'tutor' && (updated[i] as any).isStreaming) {
                                    if (streamingTextRef.current.trim()) {
                                        updated[i] = { kind: 'tutor', text: streamingTextRef.current };
                                    } else {
                                        updated.splice(i, 1);
                                    }
                                    break;
                                }
                            }
                            return updated;
                        });
                        setIsStreaming(false);
                        setInputMode('text');
                        break;

                    case 'error':
                        setBlocks(prev => {
                            const withoutStreaming = prev.filter(block => !(block.kind === 'tutor' && (block as any).isStreaming));
                            return [...withoutStreaming, { kind: 'tutor', text: `Something went wrong: ${event.message}` }];
                        });
                        setIsStreaming(false);
                        setInputMode('text');
                        break;
                }
            }
        } catch (err) {
            console.error('Streaming error:', err);
            setBlocks(prev => {
                const withoutStreaming = prev.filter(block => !(block.kind === 'tutor' && (block as any).isStreaming));
                return [...withoutStreaming, { kind: 'tutor', text: 'Connection lost. Please try again.' }];
            });
            setIsStreaming(false);
            setInputMode('text');
        }
    }, [classData.id, onUpdate]);

    useEffect(() => {
        if (!initialLoaded || isStreaming || blocks.length > 0 || autoStartedRef.current) {
            return;
        }

        autoStartedRef.current = true;
        void handleSend(
            `${INTERNAL_START_LESSON} The roadmap is already locked. Begin teaching the current subtopic immediately. Do not mention this instruction.`,
            { showStudentMessage: false },
        );
    }, [blocks.length, handleSend, initialLoaded, isStreaming]);

    const handleOptionSelect = useCallback((selectedValue: string) => {
        void handleSend(selectedValue);
    }, [handleSend]);

    const renderInteraction = useCallback((toolName: string, toolId: string, args: Record<string, unknown>) => {
        switch (toolName) {
            case 'show_code': {
                const parsed = safeParseSerializableCodeBlock(args);
                if (!parsed) return null;
                return <CodeBlock {...parsed} />;
            }
            case 'show_options': {
                const parsed = safeParseSerializableOptionList({
                    ...args,
                    id: args.id ?? `opt-${toolId}`,
                });
                if (!parsed) return null;
                return (
                    <OptionList
                        {...parsed}
                        actions={[{
                            id: 'confirm',
                            label: 'Submit Answer',
                            variant: 'primary' as any,
                        }]}
                        onAction={(actionId, selection) => {
                            if (actionId === 'confirm' && selection) {
                                const selected = Array.isArray(selection) ? selection.join(', ') : selection;
                                handleOptionSelect(selected);
                            }
                        }}
                    />
                );
            }
            case 'show_question_flow': {
                const parsed = safeParseSerializableQuestionFlow(args);
                if (!parsed) return null;
                return <QuestionFlow {...parsed} />;
            }
            case 'show_html': {
                const htmlContent = args.html as string;
                if (!htmlContent) return null;
                return (
                    <HtmlArtifact
                        html={htmlContent}
                        title={args.title as string | undefined}
                        height={args.height as string | undefined}
                    />
                );
            }
            case 'show_test': {
                const parsed = safeParseSerializableTestAssessment(args);
                if (!parsed) return null;
                return (
                    <TestAssessment
                        {...parsed}
                        onComplete={(result) => {
                            const summary = `Test completed: ${result.score}% score (${result.correct}/${result.total} correct). ${result.answers
                                .map(answer => `Q: ${answer.questionId} - ${answer.isCorrect ? 'Correct' : 'Incorrect'} (answered: ${answer.userAnswer}, correct: ${answer.correctAnswer})`)
                                .join('; ')}`;
                            setContextQuickActions([
                                { id: 'review', label: 'Review mistakes', message: 'Can you review the questions I got wrong?' },
                                { id: 'continue', label: 'Continue learning', message: "Let's continue to the next topic." },
                            ]);
                            void handleSend(summary);
                        }}
                    />
                );
            }
            case 'show_flashcards': {
                const parsed = safeParseSerializableFlashcards(args);
                if (!parsed) return null;
                return (
                    <Flashcards
                        {...parsed}
                        onComplete={(result) => {
                            const summary = `Flashcard review complete: ${result.known}/${result.total} mastered, ${result.needReview} need review.`;
                            setContextQuickActions([
                                { id: 'quiz', label: 'Quiz me on these', message: 'Test me on the concepts from the flashcards.' },
                                { id: 'continue', label: 'Continue learning', message: "Let's move on to the next topic." },
                            ]);
                            void handleSend(summary);
                        }}
                    />
                );
            }
            case 'show_interactive': {
                const interactiveArgs = { ...args };
                if (interactiveArgs.data && typeof interactiveArgs.data !== 'string') {
                    interactiveArgs.data = JSON.stringify(interactiveArgs.data);
                }
                const parsed = safeParseSerializableInteractive(interactiveArgs);
                if (parsed) {
                    return <Interactive {...parsed} />;
                }
                console.warn('[show_interactive] Schema parse failed, attempting fallback render with raw args:', interactiveArgs);
                if (interactiveArgs.type && (interactiveArgs.data || interactiveArgs.id)) {
                    return (
                        <Interactive
                            id={String(interactiveArgs.id || `interactive-${Date.now()}`)}
                            type={interactiveArgs.type as any}
                            title={String(interactiveArgs.title || 'Visualization')}
                            data={interactiveArgs.data as any}
                        />
                    );
                }
                console.warn('[show_interactive] Fallback also failed - no type/data in args:', args);
                return null;
            }
            default:
                return null;
        }
    }, [handleOptionSelect, handleSend]);

    const currentModule = classData.roadmap?.modules.find(module => module.id === classData.current_module_id);
    const currentSubtopic = currentModule?.subtopics[classData.current_subtopic_index];
    const moduleProgress = currentModule
        ? Math.round(((classData.current_subtopic_index + 1) / Math.max(currentModule.subtopics.length, 1)) * 100)
        : 0;
    const displayProgress = currentModule && currentModule.mastery_score > 0
        ? currentModule.mastery_score
        : moduleProgress;

    return (
        <div className="flex h-full w-full">
            <AnimatePresence>
                {sidebarOpen && classData.roadmap && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 260, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.165, 0.85, 0.45, 1] }}
                        className="border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden flex-shrink-0"
                    >
                        <div className="w-[260px] h-full overflow-y-auto">
                            <div className="p-3 border-b border-[var(--color-border)]">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                                        Modules
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <PanelLeftClose className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                            <RoadmapTimeline
                                modules={classData.roadmap.modules}
                                currentModuleId={classData.current_module_id}
                                currentSubtopicIndex={classData.current_subtopic_index}
                                compact
                            />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <div className="flex flex-1 flex-col min-w-0">
                {!sidebarOpen && (
                    <div className="absolute left-0 top-12 z-20">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 m-2 rounded-full bg-[var(--color-bg-surface)] shadow-sm border border-[var(--color-border)]"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <PanelLeft className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="max-w-4xl mx-auto">
                        {blocks.map((block, i) => (
                            <ContentBlock key={i} block={block} renderInteraction={renderInteraction} />
                        ))}

                        {isStreaming && blocks.length === 0 && (
                            <div className="flex items-center gap-2 py-4 text-sm text-[var(--color-text-muted)]">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                                Tutor is thinking...
                            </div>
                        )}
                    </div>
                </div>

                <AdaptiveInput
                    mode={isStreaming ? 'hidden' : inputMode}
                    onSend={(message) => { void handleSend(message); }}
                    disabled={isStreaming}
                    quickActions={contextQuickActions}
                />
            </div>

            <aside className="w-[240px] border-l border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex-shrink-0 flex flex-col overflow-y-auto">
                {currentModule && (
                    <div className="p-4 border-b border-[var(--color-border)]">
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span className="uppercase tracking-wide font-medium">Current Module</span>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                            {currentModule.title}
                        </p>
                        {currentSubtopic && (
                            <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                                <ChevronRight className="h-3 w-3" />
                                {currentSubtopic}
                            </p>
                        )}

                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-[var(--color-text-muted)]">Progress</span>
                                <span className="text-[10px] font-medium text-[var(--color-text-muted)] tabular-nums">
                                    {displayProgress}%
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700 ease-out"
                                    style={{ width: `${displayProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {progress && progress.overall_mastery > 0 && (
                    <div className="p-4 border-b border-[var(--color-border)]">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--color-text-muted)]">Overall Mastery</span>
                            <span className="font-medium text-[var(--color-accent)] tabular-nums">{progress.overall_mastery}%</span>
                        </div>
                        <div className="mt-1.5 h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                            <div
                                className="h-full rounded-full bg-[var(--color-success)] transition-all duration-700 ease-out"
                                style={{ width: `${progress.overall_mastery}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="p-4 space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2 block">
                        Navigation
                    </span>
                    {classData.roadmap && (
                        <Link
                            to={`/roadmap/${classData.id}`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                        >
                            <Map className="h-3.5 w-3.5" />
                            Full Roadmap
                        </Link>
                    )}
                    <Link
                        to={`/progress/${classData.id}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Progress
                    </Link>
                    <Link
                        to={`/revision/${classData.id}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                    >
                        <Brain className="h-3.5 w-3.5" />
                        Revision
                    </Link>
                </div>

                {classData.roadmap && (
                    <div className="p-4 border-t border-[var(--color-border)] mt-auto">
                        <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2 block">
                            All Modules
                        </span>
                        <div className="space-y-1.5">
                            {classData.roadmap.modules.map((mod, i) => (
                                <div
                                    key={mod.id}
                                    className={cn(
                                        'flex items-center gap-2 px-2 py-1.5 rounded text-xs',
                                        mod.id === classData.current_module_id
                                            ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] font-medium'
                                            : mod.mastery_score >= 80
                                                ? 'text-[var(--color-success)]'
                                                : 'text-[var(--color-text-muted)]'
                                    )}
                                >
                                    <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-[10px] font-medium flex-shrink-0">
                                        {i + 1}
                                    </span>
                                    <span className="truncate">{mod.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}
