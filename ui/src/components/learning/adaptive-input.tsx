// ── Adaptive Input ──
// The input area that changes based on the current interaction state.
// Includes quick-action chips for common learner actions.

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Send, MessageSquare, Mic, RefreshCcw, BookOpen, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InputMode = 'text' | 'hidden' | 'follow-up';

export interface QuickAction {
    id: string;
    label: string;
    message: string;
    icon?: React.ReactNode;
}

interface AdaptiveInputProps {
    mode: InputMode;
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
    quickActions?: QuickAction[];
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'explain',
        label: 'Explain again',
        message: 'Can you explain that in a different way?',
        icon: <RefreshCcw className="h-3 w-3" />,
    },
    {
        id: 'example',
        label: 'Show example',
        message: 'Show me a practical example.',
        icon: <BookOpen className="h-3 w-3" />,
    },
    {
        id: 'quiz',
        label: 'Quiz me',
        message: 'Test my understanding with a question.',
        icon: <HelpCircle className="h-3 w-3" />,
    },
    {
        id: 'next',
        label: 'Move on',
        message: "I understand, let's continue to the next topic.",
        icon: <ArrowRight className="h-3 w-3" />,
    },
];

export function AdaptiveInput({
    mode,
    onSend,
    disabled = false,
    placeholder,
    quickActions,
}: AdaptiveInputProps) {
    const [value, setValue] = useState('');
    const [expanded, setExpanded] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const actions = useMemo(
        () => quickActions || DEFAULT_QUICK_ACTIONS,
        [quickActions],
    );

    useEffect(() => {
        if (mode === 'text' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [mode]);

    const handleSend = () => {
        if (!value.trim() || disabled) return;
        onSend(value.trim());
        setValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickAction = (action: QuickAction) => {
        if (disabled) return;
        onSend(action.message);
    };

    // Hidden mode — show a small "Ask a question" link
    if (mode === 'hidden') {
        if (!expanded) {
            return (
                <div className="border-t border-[var(--color-border)] px-6 py-3">
                    <button
                        onClick={() => setExpanded(true)}
                        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
                    >
                        <MessageSquare className="h-3 w-3" />
                        Have a question? Type here...
                    </button>
                </div>
            );
        }
        // When expanded, show a small input
        return (
            <div className="border-t border-[var(--color-border)] px-6 py-3">
                <div className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a follow-up question..."
                        rows={2}
                        className="flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-0"
                        disabled={disabled}
                        autoFocus
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleSend}
                        disabled={!value.trim() || disabled}
                        className="flex-shrink-0 h-9 w-9"
                    >
                        <Send className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        );
    }

    // Text input mode — the primary answer input with quick-action chips
    return (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] px-6 py-4 space-y-3">
            {/* Quick Action Chips */}
            {!disabled && actions.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {actions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleQuickAction(action)}
                            disabled={disabled}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)]',
                                'text-xs text-[var(--color-text-muted)] whitespace-nowrap',
                                'hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
                                'transition-colors min-h-[36px] flex-shrink-0',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                            )}
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className={cn(
                'flex gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3',
                'focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_0_1px_var(--color-accent)]',
                'transition-all duration-200'
            )}>
                <textarea
                    ref={inputRef}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || 'Type your answer...'}
                    rows={4}
                    className="flex-1 resize-none bg-transparent text-sm outline-none ring-0 border-none focus:outline-none focus:ring-0 placeholder:text-[var(--color-text-muted)] min-h-[6rem] max-h-48"
                    disabled={disabled}
                />
                <div className="flex flex-col gap-2 justify-end">
                    {/* Voice button placeholder */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                disabled
                                className="flex-shrink-0 h-8 w-8 rounded-full opacity-40"
                                aria-label="Voice input (coming soon)"
                            >
                                <Mic className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p className="text-xs">Voice input coming soon</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Send button */}
                    <Button
                        size="icon"
                        variant="default"
                        onClick={handleSend}
                        disabled={!value.trim() || disabled}
                        className="flex-shrink-0 h-8 w-8 rounded-full bg-[var(--color-bg-dark)]"
                    >
                        <Send className="h-3.5 w-3.5 text-white" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
