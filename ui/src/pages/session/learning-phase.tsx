// Learning Phase
// 3-column layout: left roadmap sidebar | content area | right info panel.

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { api, type ToolCallData } from '@/lib/api';
import type { ClassData, ProgressData, HistoryMessage, ClassNotesData } from '@/lib/api';
import { isHiddenAssistantContent, isSetupOrInternalUserMessage, isUiArtifactToolName } from '@/lib/message-visibility';
import { PanelLeftClose, PanelLeft, BookOpen, Map, BarChart3, Brain, ChevronRight, NotebookPen, Loader2, FileText, ListChecks, LibraryBig, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface LearningPhaseProps {
    classData: ClassData;
    progress: ProgressData | null;
    onUpdate: (classData: ClassData, progress?: ProgressData) => void;
}

interface SendOptions {
    showStudentMessage?: boolean;
}

type OptionSelectionReceipt = string | string[] | null;

function formatTimestamp(value: string | null | undefined): string {
    if (!value) return 'Not captured yet';
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

function parseToolArgs(toolCall: ToolCallData): Record<string, unknown> {
    try {
        return JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;
    } catch {
        return {};
    }
}

function extractEmbeddedInteraction(content: string): {
    text: string;
    interaction?: { toolName: 'show_options'; toolId: string; args: Record<string, unknown> };
} {
    const match = content.match(/```json\s*([\s\S]*?)\s*```/i);
    if (!match) {
        return { text: content };
    }

    try {
        const parsed = JSON.parse(match[1]) as Record<string, unknown>;
        const optionList = safeParseSerializableOptionList(parsed);
        if (!optionList) {
            return { text: content };
        }

        const textWithoutJson = content.replace(match[0], '').trim();
        return {
            text: textWithoutJson,
            interaction: {
                toolName: 'show_options',
                toolId: String(optionList.id || `opt-${Date.now()}`),
                args: optionList,
            },
        };
    } catch {
        return { text: content };
    }
}

function appendAssistantContent(blocks: ContentBlockType[], content: string): ContentBlockType[] {
    const nextBlocks = [...blocks];
    const extracted = extractEmbeddedInteraction(content);

    if (extracted.text.trim()) {
        nextBlocks.push({ kind: 'tutor', text: extracted.text });
    }

    if (extracted.interaction) {
        const alreadyExists = nextBlocks.some(
            block => block.kind === 'interaction' && (block as any).toolId === extracted.interaction!.toolId,
        );
        if (!alreadyExists) {
            nextBlocks.push({
                kind: 'interaction',
                toolName: extracted.interaction.toolName,
                toolId: extracted.interaction.toolId,
                args: extracted.interaction.args,
            });
        }
    }

    return nextBlocks;
}

function getOptionSelectionFromMessage(content: string, args: Record<string, unknown>): OptionSelectionReceipt | null {
    const parsed = safeParseSerializableOptionList(args);
    if (!parsed) return null;

    const normalized = content
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);

    if (normalized.length === 0) return null;

    const optionIds = new Set(parsed.options.map(option => option.id));
    if (!normalized.every(id => optionIds.has(id))) {
        return null;
    }

    if ((parsed.selectionMode ?? 'single') === 'multi') {
        return normalized;
    }

    return normalized[0] ?? null;
}

function attachOptionReceipt(
    blocks: ContentBlockType[],
    selection: OptionSelectionReceipt,
    explicitToolId?: string,
): ContentBlockType[] {
    const nextBlocks = [...blocks];

    for (let index = nextBlocks.length - 1; index >= 0; index--) {
        const block = nextBlocks[index];
        if (block.kind !== 'interaction' || block.toolName !== 'show_options') continue;
        if (explicitToolId && block.toolId !== explicitToolId) continue;

        const parsed = safeParseSerializableOptionList(block.args);
        if (!parsed) continue;
        if (parsed.confirmed !== undefined || parsed.choice !== undefined) continue;

        nextBlocks[index] = {
            ...block,
            args: {
                ...block.args,
                confirmed: selection,
                responseActions: [],
            },
        };
        return nextBlocks;
    }

    return blocks;
}

function migrateOptionListPayload(args: Record<string, unknown>): Record<string, unknown> {
    return {
        ...args,
        responseActions: args.responseActions ?? args.actions,
        confirmed: args.confirmed ?? args.choice,
    };
}

function appendHistoryMessage(blocks: ContentBlockType[], message: HistoryMessage): ContentBlockType[] {
    const nextBlocks = [...blocks];

    if (message.role === 'user') {
        const latestInteraction = [...nextBlocks].reverse().find(block => block.kind === 'interaction' && block.toolName === 'show_options') as Extract<ContentBlockType, { kind: 'interaction' }> | undefined;
        if (latestInteraction) {
            const selection = getOptionSelectionFromMessage(message.content, latestInteraction.args);
            if (selection !== null) {
                return attachOptionReceipt(nextBlocks, selection, latestInteraction.toolId);
            }
        }

        if (!isSetupOrInternalUserMessage(message.content)) {
            nextBlocks.push({ kind: 'student', text: message.content });
        }
        return nextBlocks;
    }

    if (message.role === 'assistant') {
        if (!isHiddenAssistantContent(message.content) && message.content.trim()) {
            const blocksWithText = appendAssistantContent(nextBlocks, message.content);
            for (const toolCall of message.tool_calls || []) {
                const toolName = toolCall.function?.name;
                if (!isUiArtifactToolName(toolName)) continue;
                const alreadyExists = blocksWithText.some(block => block.kind === 'interaction' && (block as any).toolId === toolCall.id);
                if (alreadyExists) continue;
                blocksWithText.push({
                    kind: 'interaction',
                    toolName,
                    toolId: toolCall.id,
                    args: parseToolArgs(toolCall),
                });
            }
            return blocksWithText;
        }

        for (const toolCall of message.tool_calls || []) {
            const toolName = toolCall.function?.name;
            if (!isUiArtifactToolName(toolName)) continue;
            const alreadyExists = nextBlocks.some(block => block.kind === 'interaction' && (block as any).toolId === toolCall.id);
            if (alreadyExists) continue;
            nextBlocks.push({
                kind: 'interaction',
                toolName,
                toolId: toolCall.id,
                args: parseToolArgs(toolCall),
            });
        }
    }

    return nextBlocks;
}

export default function LearningPhase({ classData, progress, onUpdate }: LearningPhaseProps) {
    const [blocks, setBlocks] = useState<ContentBlockType[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [inputMode, setInputMode] = useState<InputMode>('text');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [contextQuickActions, setContextQuickActions] = useState<QuickAction[] | undefined>(undefined);
    const [notes, setNotes] = useState<ClassNotesData | null>(null);
    const [notesBusy, setNotesBusy] = useState(false);
    const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const streamingTextRef = useRef('');
    const autoStartedRef = useRef(false);

    useEffect(() => {
        if (initialLoaded) return;

        const loadHistory = async () => {
            try {
                const { history } = await api.getHistory(classData.id);
                let historyBlocks: ContentBlockType[] = [];
                for (const message of history) {
                    historyBlocks = appendHistoryMessage(historyBlocks, message);
                }
                setBlocks(historyBlocks.slice(-40));
            } catch (err) {
                console.error('Failed to load history:', err);
            } finally {
                setInitialLoaded(true);
            }
        };

        void loadHistory();
    }, [classData.id, initialLoaded]);

    useEffect(() => {
        let active = true;

        const loadNotes = async () => {
            try {
                const { notes } = await api.getClassNotes(classData.id);
                if (active) setNotes(notes);
            } catch (err) {
                console.error('Failed to load notes:', err);
            }
        };

        void loadNotes();
        return () => {
            active = false;
        };
    }, [classData.id]);

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
                                    updated.splice(i, 1);
                                    break;
                                }
                            }

                            if (!streamingTextRef.current.trim()) {
                                return updated;
                            }

                            return appendAssistantContent(updated, streamingTextRef.current);
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
        setBlocks([{ kind: 'tutor', text: 'This lesson has no saved kickoff yet. Send a message and I will continue from the current subtopic.' }]);
    }, [blocks.length, initialLoaded, isStreaming]);

    const handleOptionSelect = useCallback((toolId: string, selectedValue: string | string[]) => {
        const normalizedSelection = Array.isArray(selectedValue) ? selectedValue : selectedValue;
        setBlocks(prev => attachOptionReceipt(prev, normalizedSelection, toolId));
        const serializedSelection = Array.isArray(selectedValue) ? selectedValue.join(', ') : selectedValue;
        void handleSend(serializedSelection, { showStudentMessage: false });
    }, [handleSend]);

    const handleGenerateNotes = useCallback(async () => {
        setNotesBusy(true);
        try {
            const { notes } = await api.generateClassNotes(classData.id);
            setNotes(notes);
        } catch (err) {
            console.error('Failed to generate notes:', err);
        } finally {
            setNotesBusy(false);
        }
    }, [classData.id]);

    const renderInteraction = useCallback((toolName: string, toolId: string, args: Record<string, unknown>) => {
        switch (toolName) {
            case 'show_code': {
                const parsed = safeParseSerializableCodeBlock(args);
                if (!parsed) return null;
                return <CodeBlock {...parsed} />;
            }
            case 'show_options': {
                const parsed = safeParseSerializableOptionList({
                    ...migrateOptionListPayload(args),
                    id: args.id ?? `opt-${toolId}`,
                });
                if (!parsed) return null;
                return (
                    <OptionList
                        {...parsed}
                        onAction={(actionId, selection) => {
                            if (actionId === 'confirm' && selection) {
                                handleOptionSelect(toolId, selection);
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
                return <HtmlArtifact html={htmlContent} title={args.title as string | undefined} height={args.height as string | undefined} />;
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
    const displayProgress = currentModule && currentModule.mastery_score > 0 ? currentModule.mastery_score : moduleProgress;
    const notesMode = notes?.mode ?? 'auto';
    const notesWorking = notesBusy || notes?.status === 'generating';
    const noteButtonTitle = notesWorking
        ? notesMode === 'auto'
            ? 'NoteTaker is capturing'
            : 'Building notes'
        : notesMode === 'auto'
            ? 'NoteTaker Auto'
            : 'Capture Notes';
    const noteButtonSubtitle = notesWorking
        ? 'Turning this lesson into a cleaner study packet.'
        : notesMode === 'auto'
            ? notes?.generated_at
                ? `Last capture ${new Date(notes.generated_at).toLocaleDateString()}`
                : 'Runs quietly while the class is unfolding.'
            : notes?.generated_at
                ? `Last capture ${new Date(notes.generated_at).toLocaleDateString()}`
                : 'Manual mode. Save the current lesson when you want.';

    return (
        <div className="flex h-full w-full">
            <AnimatePresence>
                {sidebarOpen && classData.roadmap && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.165, 0.85, 0.45, 1] }}
                        className="border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden flex-shrink-0 xl:w-[280px]"
                    >
                        <div className="w-[280px] h-full overflow-y-auto">
                            <div className="p-3 border-b border-[var(--color-border)]">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Modules</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSidebarOpen(false)}>
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

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 xl:px-10">
                    <div className="mx-auto w-full max-w-[72rem]">
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

            <aside className="w-[280px] border-l border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex-shrink-0 flex flex-col overflow-y-auto">
                {currentModule && (
                    <div className="p-4 border-b border-[var(--color-border)]">
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span className="uppercase tracking-wide font-medium">Current Module</span>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{currentModule.title}</p>
                        {currentSubtopic && (
                            <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                                <ChevronRight className="h-3 w-3" />
                                {currentSubtopic}
                            </p>
                        )}

                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-[var(--color-text-muted)]">Progress</span>
                                <span className="text-[10px] font-medium text-[var(--color-text-muted)] tabular-nums">{displayProgress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                                <div className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700 ease-out" style={{ width: `${displayProgress}%` }} />
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
                            <div className="h-full rounded-full bg-[var(--color-success)] transition-all duration-700 ease-out" style={{ width: `${progress.overall_mastery}%` }} />
                        </div>
                    </div>
                )}

                <div className="p-4 border-b border-[var(--color-border)]">
                    <motion.button
                        type="button"
                        onClick={() => setNotesDrawerOpen(true)}
                        animate={notesWorking ? {
                            scale: [1, 1.012, 1],
                            boxShadow: [
                                '0 10px 24px rgba(211,106,58,0.14)',
                                '0 16px 34px rgba(211,106,58,0.24)',
                                '0 10px 24px rgba(211,106,58,0.14)',
                            ],
                        } : {
                            scale: 1,
                            boxShadow: '0 10px 24px rgba(40,28,22,0.08)',
                        }}
                        transition={notesWorking ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.25 }}
                        className="w-full rounded-[20px] border border-[var(--color-border)] bg-[linear-gradient(160deg,#FFF9F3_0%,#F6ECE2_46%,#231915_180%)] p-4 text-left transition-transform hover:-translate-y-0.5"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#8D776B]">NoteTaker</p>
                                <p className="mt-2 text-sm font-semibold text-[#221A15]">{noteButtonTitle}</p>
                                <p className="mt-1 text-xs leading-5 text-[#6F5E54]">{noteButtonSubtitle}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75 text-[#D36A3A] shadow-[0_8px_20px_rgba(42,28,21,0.08)]">
                                {notesWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[11px]">
                            <span className="rounded-full border border-[#E4D6CB] bg-white/75 px-2.5 py-1 font-medium uppercase tracking-[0.18em] text-[#6B574C]">
                                {notesMode}
                            </span>
                            <span className="text-[#7A675D]">{notesWorking ? 'Saving…' : 'Open notes'}</span>
                        </div>
                    </motion.button>
                </div>
                <div className="p-4 space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2 block">Navigation</span>
                    {classData.roadmap && (
                        <Link to={`/roadmap/${classData.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors">
                            <Map className="h-3.5 w-3.5" />
                            Full Roadmap
                        </Link>
                    )}
                    <Link to={`/progress/${classData.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Progress
                    </Link>
                    <Link to={`/revision/${classData.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors">
                        <Brain className="h-3.5 w-3.5" />
                        Revision
                    </Link>
                </div>

                {classData.roadmap && (
                    <div className="p-4 border-t border-[var(--color-border)] mt-auto">
                        <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2 block">All Modules</span>
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
                                    <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-[10px] font-medium flex-shrink-0">{i + 1}</span>
                                    <span className="truncate">{mod.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            <Dialog open={notesDrawerOpen} onOpenChange={setNotesDrawerOpen}>
                <DialogContent className="left-auto right-0 top-0 h-screen max-w-[44rem] translate-x-0 translate-y-0 rounded-none border-l border-[var(--color-border)] bg-[var(--color-bg-surface)] p-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-[44rem]">
                    <div className="flex h-full flex-col">
                        <DialogHeader className="border-b border-[var(--color-border)] px-6 py-5">
                            <div className="flex items-start justify-between gap-4 pr-10">
                                <div>
                                    <DialogTitle className="flex items-center gap-2 text-[var(--color-text-primary)]">
                                        <NotebookPen className="h-5 w-5 text-[var(--color-accent)]" />
                                        Running Notes
                                    </DialogTitle>
                                    <DialogDescription className="mt-1">
                                        Durable notes for this class. Refresh when you want a newer capture of the lesson so far.
                                    </DialogDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                                        {notesMode}
                                    </span>
                                    <Button size="sm" onClick={() => { void handleGenerateNotes(); }} disabled={notesBusy} className="gap-2">
                                        {notesBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                        Refresh Notes
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[0.72fr_1.28fr]">
                            <div className="border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                                <div className="h-full overflow-y-auto px-5 py-5">
                                    <div className="space-y-4">
                                        <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4">
                                            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Status</p>
                                            <p className="mt-2 text-sm font-medium capitalize text-[var(--color-text-primary)]">{notes?.status || 'idle'}</p>
                                            <p className="mt-3 text-[11px] text-[var(--color-text-secondary)]">{formatTimestamp(notes?.generated_at)}</p>
                                        </div>

                                        <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4">
                                            <div className="flex items-center gap-2">
                                                <ListChecks className="h-4 w-4 text-[var(--color-accent)]" />
                                                <p className="text-sm font-medium text-[var(--color-text-primary)]">Key Takeaways</p>
                                            </div>
                                            {notes?.key_takeaways?.length ? (
                                                <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
                                                    {notes.key_takeaways.map(item => (
                                                        <li key={item} className="rounded-[12px] bg-[var(--color-bg-muted)] px-3 py-2">
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">No takeaways captured yet.</p>
                                            )}
                                        </div>

                                        <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4">
                                            <div className="flex items-center gap-2">
                                                <LibraryBig className="h-4 w-4 text-[var(--color-accent)]" />
                                                <p className="text-sm font-medium text-[var(--color-text-primary)]">Glossary</p>
                                            </div>
                                            {notes?.glossary?.length ? (
                                                <div className="mt-3 space-y-2">
                                                    {notes.glossary.map(item => (
                                                        <div key={item.term} className="rounded-[12px] bg-[var(--color-bg-muted)] px-3 py-2">
                                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.term}</p>
                                                            <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{item.meaning}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">No glossary items yet.</p>
                                            )}
                                        </div>

                                        <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4">
                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Action Items</p>
                                            {notes?.action_items?.length ? (
                                                <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
                                                    {notes.action_items.map(item => (
                                                        <li key={item} className="rounded-[12px] bg-[var(--color-bg-muted)] px-3 py-2">
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">No action items yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="min-h-0 overflow-y-auto px-6 py-5">
                                {notes?.markdown ? (
                                    <div className="space-y-5">
                                        <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-[var(--color-accent)]" />
                                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{notes.title || 'Study Packet'}</p>
                                            </div>
                                            {notes.summary ? (
                                                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{notes.summary}</p>
                                            ) : null}
                                        </div>

                                        <div className="prose prose-sm max-w-none text-[var(--color-text-primary)] prose-headings:font-[var(--font-heading)] prose-p:text-[var(--color-text-secondary)] prose-strong:text-[var(--color-text-primary)] prose-li:text-[var(--color-text-secondary)] prose-code:text-[var(--color-accent)]">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {notes.markdown}
                                            </ReactMarkdown>
                                        </div>

                                        {notes.timeline?.length ? (
                                            <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
                                                <p className="text-sm font-medium text-[var(--color-text-primary)]">Capture Timeline</p>
                                                <div className="mt-3 space-y-3">
                                                    {notes.timeline.map((item, index) => (
                                                        <div key={`${item.title}-${index}`} className="rounded-[14px] bg-[var(--color-bg-surface)] px-3 py-3">
                                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.title}</p>
                                                            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{item.detail}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 text-center">
                                        <NotebookPen className="h-10 w-10 text-[var(--color-accent)]" />
                                        <p className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">No running notes yet</p>
                                        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
                                            Capture the current lesson to build a reusable study packet with summary, takeaways, glossary, and next actions.
                                        </p>
                                        <Button className="mt-5 gap-2" onClick={() => { void handleGenerateNotes(); }} disabled={notesBusy}>
                                            {notesBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                            Capture Notes Now
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}








