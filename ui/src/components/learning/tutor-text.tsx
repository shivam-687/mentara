// ── Tutor Text ──
// Renders streaming text from the tutor with proper markdown support.
// Uses react-markdown with remark-gfm for full GitHub Flavored Markdown.

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorTextProps {
    text: string;
    isStreaming?: boolean;
}

// Copy-to-clipboard hook
function useCopyToClipboard(duration = 2000) {
    const [isCopied, setIsCopied] = useState(false);
    const copyToClipboard = (value: string) => {
        navigator.clipboard.writeText(value).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), duration);
        });
    };
    return { isCopied, copyToClipboard };
}

// Code block header with language label and copy button
function CodeHeader({ language, code }: { language?: string; code: string }) {
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    return (
        <div className="flex items-center justify-between rounded-t-lg border border-[var(--color-border)] border-b-0 bg-[var(--color-bg-muted)] px-3 py-1.5 text-xs mt-3">
            <span className="font-medium text-[var(--color-text-muted)] lowercase">
                {language || 'code'}
            </span>
            <button
                onClick={() => copyToClipboard(code)}
                className="p-1 rounded hover:bg-[var(--color-border)] transition-colors"
                aria-label="Copy code"
            >
                {isCopied ? <CheckIcon className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <CopyIcon className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />}
            </button>
        </div>
    );
}

// Markdown components styled to match the Mentara design system
const markdownComponents = {
    h1: ({ className, ...props }: any) => (
        <h1 className={cn('mb-3 mt-4 scroll-m-20 font-semibold text-lg first:mt-0 last:mb-0 text-[var(--color-text-primary)]', className)} {...props} />
    ),
    h2: ({ className, ...props }: any) => (
        <h2 className={cn('mb-2 mt-4 scroll-m-20 font-semibold text-base first:mt-0 last:mb-0 text-[var(--color-text-primary)]', className)} {...props} />
    ),
    h3: ({ className, ...props }: any) => (
        <h3 className={cn('mb-1.5 mt-3 scroll-m-20 font-semibold text-sm first:mt-0 last:mb-0 text-[var(--color-text-primary)]', className)} {...props} />
    ),
    h4: ({ className, ...props }: any) => (
        <h4 className={cn('mb-1 mt-2.5 scroll-m-20 font-medium text-sm first:mt-0 last:mb-0', className)} {...props} />
    ),
    p: ({ className, ...props }: any) => (
        <p className={cn('my-2.5 leading-relaxed first:mt-0 last:mb-0', className)} {...props} />
    ),
    a: ({ className, ...props }: any) => (
        <a className={cn('text-[var(--color-accent)] underline underline-offset-2 hover:text-[var(--color-accent-hover)]', className)} target="_blank" rel="noopener noreferrer" {...props} />
    ),
    blockquote: ({ className, ...props }: any) => (
        <blockquote className={cn('my-3 border-l-2 border-[var(--color-accent-muted)] pl-4 text-[var(--color-text-secondary)] italic', className)} {...props} />
    ),
    ul: ({ className, ...props }: any) => (
        <ul className={cn('my-2 ml-5 list-disc marker:text-[var(--color-text-muted)] [&>li]:mt-1', className)} {...props} />
    ),
    ol: ({ className, ...props }: any) => (
        <ol className={cn('my-2 ml-5 list-decimal marker:text-[var(--color-text-muted)] [&>li]:mt-1', className)} {...props} />
    ),
    li: ({ className, ...props }: any) => (
        <li className={cn('leading-relaxed', className)} {...props} />
    ),
    hr: ({ className, ...props }: any) => (
        <hr className={cn('my-4 border-[var(--color-border)]', className)} {...props} />
    ),
    table: ({ className, ...props }: any) => (
        <div className="my-3 overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className={cn('w-full border-collapse text-sm', className)} {...props} />
        </div>
    ),
    th: ({ className, ...props }: any) => (
        <th className={cn('bg-[var(--color-bg-muted)] px-3 py-2 text-left font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border)]', className)} {...props} />
    ),
    td: ({ className, ...props }: any) => (
        <td className={cn('px-3 py-2 text-left border-b border-[var(--color-border)] last:border-b-0', className)} {...props} />
    ),
    tr: ({ className, ...props }: any) => (
        <tr className={cn('border-b border-[var(--color-border)] last:border-b-0', className)} {...props} />
    ),
    strong: ({ className, ...props }: any) => (
        <strong className={cn('font-semibold text-[var(--color-text-primary)]', className)} {...props} />
    ),
    em: ({ className, ...props }: any) => (
        <em className={cn('italic', className)} {...props} />
    ),
    pre: ({ children, ...props }: any) => {
        // Extract language and code from the child <code> element
        const codeEl = children?.props;
        const language = codeEl?.className?.replace(/language-/, '') || '';
        const code = typeof codeEl?.children === 'string' ? codeEl.children : '';

        return (
            <>
                <CodeHeader language={language} code={code} />
                <pre
                    className="overflow-x-auto rounded-t-none rounded-b-lg border border-[var(--color-border)] border-t-0 bg-[var(--color-bg-muted)]/50 p-3 text-xs leading-relaxed font-mono"
                    {...props}
                >
                    {children}
                </pre>
            </>
        );
    },
    code: ({ className, children, ...props }: any) => {
        // Inline code (not inside a pre block)
        const isInline = !className?.includes('language-');
        if (isInline) {
            return (
                <code
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--color-accent)]"
                    {...props}
                >
                    {children}
                </code>
            );
        }
        return <code className={className} {...props}>{children}</code>;
    },
};

export function TutorText({ text, isStreaming = false }: TutorTextProps) {
    const content = useMemo(() => {
        if (!text) return null;
        return (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {text}
            </ReactMarkdown>
        );
    }, [text]);

    return (
        <div className="text-sm text-[var(--color-text-primary)] leading-relaxed">
            {content}
            {isStreaming && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--color-accent)] animate-pulse rounded-sm" />
            )}
        </div>
    );
}
