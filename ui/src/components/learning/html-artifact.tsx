// ── HTML Artifact ──
// Renders rich HTML content (infographics, diagrams, tables, interactive elements)
// from the LLM in a sandboxed iframe.

import { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HtmlArtifactProps {
    html: string;
    title?: string;
    height?: string;
}

export function HtmlArtifact({ html, title, height }: HtmlArtifactProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [iframeHeight, setIframeHeight] = useState(height || '300px');

    // Auto-resize iframe to content height
    useEffect(() => {
        if (!height || height === 'auto') {
            const handleResize = () => {
                const iframe = iframeRef.current;
                if (!iframe?.contentDocument?.body) return;
                const contentHeight = iframe.contentDocument.body.scrollHeight;
                setIframeHeight(`${Math.min(Math.max(contentHeight + 20, 200), 600)}px`);
            };

            const iframe = iframeRef.current;
            if (iframe) {
                iframe.addEventListener('load', handleResize);
                return () => iframe.removeEventListener('load', handleResize);
            }
        }
    }, [height, html]);

    // Wrap HTML with base styles
    const wrappedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    -webkit-font-smoothing: antialiased;
                    padding: 1rem;
                    color: #1a1a1a;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>${html}</body>
        </html>
    `;

    return (
        <div className={cn(
            'rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden bg-white shadow-sm',
            expanded && 'fixed inset-4 z-50 shadow-lg'
        )}>
            {/* Title bar */}
            {(title || true) && (
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] truncate">
                        {title || 'Interactive Content'}
                    </span>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex-shrink-0 p-1 rounded hover:bg-[var(--color-bg-muted)] transition-colors cursor-pointer"
                    >
                        {expanded ? (
                            <Minimize2 className="h-3 w-3 text-[var(--color-text-muted)]" />
                        ) : (
                            <Maximize2 className="h-3 w-3 text-[var(--color-text-muted)]" />
                        )}
                    </button>
                </div>
            )}

            {/* Content iframe */}
            <iframe
                ref={iframeRef}
                srcDoc={wrappedHtml}
                sandbox="allow-scripts"
                className="w-full border-none"
                style={{ height: expanded ? 'calc(100% - 2.5rem)' : iframeHeight }}
                title={title || 'Learning content'}
            />
        </div>
    );
}
