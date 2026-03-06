// ── Content Block ──
// Renders a single unit in the learning flow.
// Can be a tutor message, student response, or interactive element.
// Each type has distinct visual treatment for clear separation.

import { motion } from 'framer-motion';
import { User, GraduationCap } from 'lucide-react';
import { TutorText } from './tutor-text';
import { cn } from '@/lib/utils';

export type ContentBlockType =
    | { kind: 'tutor'; text: string; isStreaming?: boolean }
    | { kind: 'student'; text: string }
    | { kind: 'interaction'; toolName: string; toolId: string; args: Record<string, unknown> };

interface ContentBlockProps {
    block: ContentBlockType;
    isFirstInGroup?: boolean;
    renderInteraction?: (toolName: string, toolId: string, args: Record<string, unknown>) => React.ReactNode;
}

export function ContentBlock({ block, isFirstInGroup = false, renderInteraction }: ContentBlockProps) {
    if (block.kind === 'tutor') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                    'flex gap-3 py-4',
                    isFirstInGroup && 'mt-4'
                )}
            >
                <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-light)]">
                    <GraduationCap className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="lesson-card">
                        <TutorText text={block.text} isStreaming={block.isStreaming} />
                    </div>
                </div>
            </motion.div>
        );
    }

    if (block.kind === 'student') {
        return (
            <>
                {/* Divider before student response */}
                <div className="content-divider" />
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex justify-end py-3"
                >
                    <div className="flex gap-3 max-w-[80%]">
                        <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-dark)] px-4 py-2.5 text-sm text-[var(--color-text-inverse)] shadow-sm">
                            {block.text}
                        </div>
                        <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg-muted)]">
                            <User className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                        </div>
                    </div>
                </motion.div>
            </>
        );
    }

    if (block.kind === 'interaction') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="py-3"
            >
                <div className="interaction-card">
                    {renderInteraction?.(block.toolName, block.toolId, block.args)}
                </div>
            </motion.div>
        );
    }

    return null;
}
