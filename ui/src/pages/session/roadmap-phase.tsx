// Roadmap Phase
// Shows the visual roadmap timeline with a chat sidebar for modifications.
// Used during the "negotiating" status.

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Send, MessageSquare } from 'lucide-react';
import { RoadmapTimeline } from '@/components/roadmap/roadmap-timeline';
import { api } from '@/lib/api';
import type { ClassData, ProgressData } from '@/lib/api';
import { cn } from '@/lib/utils';

interface RoadmapPhaseProps {
    classData: ClassData;
    onUpdate: (classData: ClassData, progress?: ProgressData) => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function RoadmapPhase({ classData, onUpdate }: RoadmapPhaseProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Here\'s your personalized learning roadmap. Would you like to add, remove, or modify any topics?' }
    ]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLocking, setIsLocking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isSending) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsSending(true);

        try {
            const res = await api.sendMessage(classData.id, userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
            onUpdate(res.class, res.progress);
        } catch (_err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
        }

        setIsSending(false);
    };

    const handleLock = async () => {
        setIsLocking(true);
        try {
            const res = await api.lockRoadmap(classData.id);
            onUpdate(res.class, res.progress ?? undefined);
        } catch (err) {
            console.error('Failed to lock roadmap:', err);
            setIsLocking(false);
        }
    };

    if (!classData.roadmap) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 mx-auto mb-3 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                    <p className="text-sm text-[var(--color-text-secondary)]">Generating your roadmap...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            <div className="flex-1 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                <div className="max-w-2xl mx-auto py-8 px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2
                            className="text-xl font-medium mb-1"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            Your Learning Roadmap
                        </h2>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                            {classData.roadmap.modules.length} modules covering {classData.title}
                        </p>
                    </motion.div>

                    <RoadmapTimeline
                        modules={classData.roadmap.modules}
                        currentModuleId={classData.current_module_id}
                        currentSubtopicIndex={classData.current_subtopic_index}
                    />

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 text-center"
                    >
                        <Button
                            variant="accent"
                            size="lg"
                            className="gap-2"
                            onClick={handleLock}
                            disabled={isLocking}
                        >
                            {isLocking ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Locking roadmap...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4" />
                                    Lock Roadmap & Start Learning
                                </>
                            )}
                        </Button>
                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                            Once locked, the roadmap structure cannot be changed.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="w-[340px] flex flex-col bg-[var(--color-bg-base)]">
                <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
                    <MessageSquare className="h-4 w-4 text-[var(--color-text-muted)]" />
                    <span className="text-sm font-medium">Modify Roadmap</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                'rounded-[var(--radius-md)] px-3 py-2 text-sm',
                                msg.role === 'user'
                                    ? 'ml-8 bg-[var(--color-bg-dark)] text-[var(--color-text-inverse)]'
                                    : 'mr-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
                            )}
                        >
                            {msg.content}
                        </div>
                    ))}
                    {isSending && (
                        <div className="mr-4 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] border border-[var(--color-border)] px-3 py-2">
                            <div className="flex gap-1">
                                <div className="h-2 w-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="h-2 w-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="h-2 w-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-[var(--color-border)] p-3">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add a module, remove a topic..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={isSending}
                            className="text-sm"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleSend}
                            disabled={!input.trim() || isSending}
                            className="flex-shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
