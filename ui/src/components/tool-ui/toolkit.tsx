/**
 * Toolkit — Registers Tool UI components with assistant-ui.
 *
 * Uses makeAssistantToolUI to render rich Tool UI components
 * (code-block, option-list, question-flow) when the assistant
 * returns tool calls with matching names.
 */

import { makeAssistantToolUI } from "@assistant-ui/react";
import { CodeBlock } from "@/components/tool-ui/code-block";
import { safeParseSerializableCodeBlock } from "@/components/tool-ui/code-block/schema";
import { OptionList } from "@/components/tool-ui/option-list";
import { safeParseSerializableOptionList } from "@/components/tool-ui/option-list/schema";
import { QuestionFlow } from "@/components/tool-ui/question-flow";
import { safeParseSerializableQuestionFlow } from "@/components/tool-ui/question-flow/schema";
import { TestAssessment } from "@/components/tool-ui/test-assessment";
import { safeParseSerializableTestAssessment } from "@/components/tool-ui/test-assessment/schema";
import { Flashcards } from "@/components/tool-ui/flashcards";
import { safeParseSerializableFlashcards } from "@/components/tool-ui/flashcards/schema";
import { Interactive } from "@/components/tool-ui/interactive";
import { safeParseSerializableInteractive } from "@/components/tool-ui/interactive/schema";

// ── Code Block Tool UI ──
// Renders syntax-highlighted code snippets
export const CodeBlockToolUI = makeAssistantToolUI({
    toolName: "show_code",
    render: ({ args, result, status }) => {
        const data = result ?? args;
        const parsed = safeParseSerializableCodeBlock(data);
        if (!parsed) {
            if (status.type === "running") {
                return (
                    <div className="my-2 rounded-lg border border-border/50 bg-muted/30 p-4 animate-pulse">
                        <div className="h-4 w-24 bg-muted rounded mb-2" />
                        <div className="h-3 w-full bg-muted rounded mb-1" />
                        <div className="h-3 w-3/4 bg-muted rounded" />
                    </div>
                );
            }
            return null;
        }
        return <CodeBlock {...parsed} />;
    },
});

// ── Option List Tool UI ──
// Renders selectable options for quizzes and choices
export const OptionListToolUI = makeAssistantToolUI({
    toolName: "show_options",
    render: ({ args, result, status }) => {
        const parsed = safeParseSerializableOptionList({
            ...args,
            id: (args as Record<string, unknown>)?.id ?? `option-list-${Date.now()}`,
        });
        if (!parsed) {
            if (status.type === "running") {
                return (
                    <div className="my-2 rounded-lg border border-border/50 bg-muted/30 p-4 animate-pulse">
                        <div className="h-4 w-32 bg-muted rounded mb-3" />
                        <div className="space-y-2">
                            <div className="h-10 w-full bg-muted rounded" />
                            <div className="h-10 w-full bg-muted rounded" />
                            <div className="h-10 w-full bg-muted rounded" />
                        </div>
                    </div>
                );
            }
            return null;
        }

        if (result) {
            return <OptionList {...parsed} choice={result as string | string[]} />;
        }
        return <OptionList {...parsed} />;
    },
});

// ── Question Flow Tool UI ──
// Renders multi-step guided questions with branching
export const QuestionFlowToolUI = makeAssistantToolUI({
    toolName: "show_question_flow",
    render: ({ args, result, status }) => {
        const data = result ?? args;
        const parsed = safeParseSerializableQuestionFlow(data);
        if (!parsed) {
            if (status.type === "running") {
                return (
                    <div className="my-2 rounded-lg border border-border/50 bg-muted/30 p-4 animate-pulse">
                        <div className="h-5 w-40 bg-muted rounded mb-3" />
                        <div className="h-4 w-56 bg-muted rounded mb-4" />
                        <div className="space-y-2">
                            <div className="h-12 w-full bg-muted rounded" />
                            <div className="h-12 w-full bg-muted rounded" />
                        </div>
                    </div>
                );
            }
            return null;
        }
        return <QuestionFlow {...parsed} />;
    },
});

// ── Test Assessment Tool UI ──
// Renders multi-question timed assessments with score cards
export const TestAssessmentToolUI = makeAssistantToolUI({
    toolName: "show_test",
    render: ({ args, result, status }) => {
        const parsed = safeParseSerializableTestAssessment(args);
        if (!parsed) {
            if (status.type === "running") {
                return (
                    <div className="my-2 rounded-lg border border-border/50 bg-muted/30 p-4 animate-pulse">
                        <div className="h-5 w-48 bg-muted rounded mb-3" />
                        <div className="h-4 w-32 bg-muted rounded mb-4" />
                        <div className="h-10 w-28 bg-muted rounded" />
                    </div>
                );
            }
            return null;
        }
        if (result) {
            return <TestAssessment {...parsed} receipt={result as string} />;
        }
        return <TestAssessment {...parsed} />;
    },
});

// ── Flashcards Tool UI ──
// Renders interactive flashcard decks for active recall
export const FlashcardsToolUI = makeAssistantToolUI({
    toolName: "show_flashcards",
    render: ({ args, result, status }) => {
        const parsed = safeParseSerializableFlashcards(args);
        if (!parsed) {
            if (status.type === "running") {
                return (
                    <div className="my-2 rounded-lg border border-border/50 bg-muted/30 p-4 animate-pulse">
                        <div className="h-5 w-40 bg-muted rounded mb-3" />
                        <div className="h-32 w-full bg-muted rounded mb-3" />
                        <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                );
            }
            return null;
        }
        if (result) {
            return <Flashcards {...parsed} receipt={result as string} />;
        }
        return <Flashcards {...parsed} />;
    },
});

// ── Interactive Artifact Tool UI ──
// Renders diagrams, mind maps, comparisons, timelines, steps, infographics
export const InteractiveToolUI = makeAssistantToolUI({
    toolName: "show_interactive",
    render: ({ args, status }) => {
        // Coerce data from object to string if needed
        const coercedArgs = { ...args } as Record<string, unknown>;
        if (coercedArgs.data && typeof coercedArgs.data !== 'string') {
            coercedArgs.data = JSON.stringify(coercedArgs.data);
        }
        const parsed = safeParseSerializableInteractive(coercedArgs);
        if (parsed) {
            return <Interactive {...parsed} />;
        }
        // Fallback: try direct render when schema parse fails
        if (status.type === "running") {
            return (
                <div className="my-2 rounded-lg border border-border/50 bg-muted/30 p-4 animate-pulse">
                    <div className="h-4 w-28 bg-muted rounded mb-3" />
                    <div className="h-48 w-full bg-muted rounded" />
                </div>
            );
        }
        if (coercedArgs.type && (coercedArgs.data || coercedArgs.id)) {
            console.warn('[InteractiveToolUI] Schema parse failed, using fallback render:', coercedArgs);
            return (
                <Interactive
                    id={String(coercedArgs.id || `interactive-${Date.now()}`)}
                    type={coercedArgs.type as any}
                    title={String(coercedArgs.title || 'Visualization')}
                    data={coercedArgs.data as any}
                />
            );
        }
        return null;
    },
});
