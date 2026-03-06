// ── Context Builder ──
// Builds the full message array for LLM calls (async, database-backed).
// Uses smart context windowing, pacing intelligence, and history sanitization.
// Inspired by picoclaw's session management patterns.

import type { Message } from '../providers/types.js';
import type { SessionManager } from '../session/manager.js';
import { buildTutorSystemPrompt } from './tutor-prompt.js';

// Max recent messages to keep verbatim in context
const MAX_RECENT_MESSAGES = 16;
// Threshold for triggering summarization (total messages in history)
const SUMMARIZATION_THRESHOLD = 30;

export class ContextBuilder {
    private sessionManager: SessionManager;
    // In-memory summary cache (per classId)
    private summaryCache: Map<string, string> = new Map();

    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
    }

    async buildMessages(classId: string, userMessage: string): Promise<Message[]> {
        const messages: Message[] = [];

        // 1. System prompt with class_id and phase injected
        const classData = await this.sessionManager.getClass(classId);
        const systemPrompt = buildTutorSystemPrompt(classId, classData?.status);

        // 2. Lean context injection — only what the LLM can't get from tools
        //    (Phase, current position, and pacing signals)
        let contextAddendum = '';
        if (classData) {
            contextAddendum += `\n\n## Where You Are Right Now\n`;
            contextAddendum += `- **Phase**: ${classData.status}\n`;

            if (classData.roadmap && classData.current_module_id) {
                const currentModule = classData.roadmap.modules.find(m => m.id === classData.current_module_id);
                if (currentModule) {
                    contextAddendum += `- **Module**: ${currentModule.title} (${currentModule.status})\n`;
                    if (classData.current_subtopic_index < currentModule.subtopics.length) {
                        contextAddendum += `- **Subtopic**: ${currentModule.subtopics[classData.current_subtopic_index]}\n`;
                    }
                    // Compact progress signal
                    const moduleIdx = classData.roadmap.modules.indexOf(currentModule);
                    contextAddendum += `- **Position**: Module ${moduleIdx + 1}/${classData.roadmap.modules.length}, Subtopic ${classData.current_subtopic_index + 1}/${currentModule.subtopics.length}\n`;
                }
            } else if (!classData.roadmap) {
                contextAddendum += `- **Roadmap**: Not yet created\n`;
            }

            // 3. Adaptive Pacing Signals — analyze recent Q&A patterns
            const pacingSignal = await this.buildPacingSignal(classId);
            if (pacingSignal) {
                contextAddendum += `\n## Pacing Signal\n${pacingSignal}\n`;
            }
        }

        messages.push({ role: 'system', content: systemPrompt + contextAddendum });

        // 4. Conversation summary for long sessions
        if (classData) {
            const history = await this.sessionManager.getHistory(classId);
            if (history.length > SUMMARIZATION_THRESHOLD) {
                const cachedSummary = this.summaryCache.get(classId);
                if (cachedSummary) {
                    messages.push({
                        role: 'system',
                        content: `## Previous Conversation Summary\n${cachedSummary}`,
                    });
                }
            }
        }

        // 5. Recent history with smart windowing
        const history = await this.sessionManager.getHistory(classId);
        const recentHistory = history.slice(-MAX_RECENT_MESSAGES);
        const sanitized = this.sanitizeHistory(recentHistory);
        for (const msg of sanitized) {
            const message: Message = {
                role: msg.role as Message['role'],
                content: this.compactContent(msg.role, msg.content),
            };
            if (msg.tool_calls && msg.tool_calls.length > 0) {
                message.tool_calls = msg.tool_calls as Message['tool_calls'];
            }
            if (msg.tool_call_id) {
                message.tool_call_id = msg.tool_call_id;
            }
            messages.push(message);
        }

        // 6. Current user message
        messages.push({ role: 'user', content: userMessage });

        return messages;
    }

    /**
     * Build adaptive pacing signals by analyzing recent Q&A patterns.
     * This gives the LLM intelligence about HOW the student is doing
     * without the LLM needing to ask.
     */
    private async buildPacingSignal(classId: string): Promise<string | null> {
        try {
            const recentQAs = await this.sessionManager.getQuestionAnswers(classId, {});
            if (recentQAs.length === 0) return null;

            // Only look at last 10 answers
            const recent = recentQAs.slice(-10);
            const correctCount = recent.filter(q => q.is_correct).length;
            const totalCount = recent.length;
            const accuracy = Math.round((correctCount / totalCount) * 100);

            // Detect streaks
            let streak = 0;
            let streakType: 'correct' | 'incorrect' | null = null;
            for (let i = recent.length - 1; i >= 0; i--) {
                if (streakType === null) {
                    streakType = recent[i].is_correct ? 'correct' : 'incorrect';
                    streak = 1;
                } else if ((recent[i].is_correct && streakType === 'correct') ||
                    (!recent[i].is_correct && streakType === 'incorrect')) {
                    streak++;
                } else {
                    break;
                }
            }

            // Generate signal
            const signals: string[] = [];

            if (streak >= 3 && streakType === 'correct') {
                signals.push(`🟢 Student has answered ${streak} questions correctly in a row. Consider increasing difficulty, going deeper, or advancing faster.`);
            } else if (streak >= 2 && streakType === 'incorrect') {
                signals.push(`🔴 Student has answered ${streak} questions incorrectly in a row. Consider simplifying, trying a different explanation angle, or reviewing prerequisites.`);
            }

            if (totalCount >= 5) {
                if (accuracy >= 90) {
                    signals.push(`Student's recent accuracy: ${accuracy}% (${correctCount}/${totalCount}) — they're excelling.`);
                } else if (accuracy <= 40) {
                    signals.push(`Student's recent accuracy: ${accuracy}% (${correctCount}/${totalCount}) — they're struggling. Slow down.`);
                }
            }

            // Identify weak areas from recent wrong answers
            const wrongTopics = recent
                .filter(q => !q.is_correct && q.topic)
                .map(q => q.topic!)
                .filter((t, i, arr) => arr.indexOf(t) === i); // unique
            if (wrongTopics.length > 0) {
                signals.push(`Recent weak areas: ${wrongTopics.join(', ')}`);
            }

            return signals.length > 0 ? signals.join('\n') : null;
        } catch {
            return null;
        }
    }

    /**
     * Sanitize history to remove orphaned messages (picoclaw pattern).
     */
    private sanitizeHistory(
        history: Array<{ role: string; content: string; tool_calls?: unknown[]; tool_call_id?: string }>
    ): typeof history {
        if (history.length === 0) return history;

        const sanitized: typeof history = [];
        for (const msg of history) {
            if (msg.role === 'tool') {
                if (sanitized.length === 0) continue;
                const last = sanitized[sanitized.length - 1];
                if (last.role !== 'assistant' || !last.tool_calls || last.tool_calls.length === 0) {
                    let hasMatchingAssistant = false;
                    for (let i = sanitized.length - 1; i >= 0; i--) {
                        if (sanitized[i].role === 'assistant' && sanitized[i].tool_calls && sanitized[i].tool_calls!.length > 0) {
                            hasMatchingAssistant = true;
                            break;
                        }
                        if (sanitized[i].role === 'user') break;
                    }
                    if (!hasMatchingAssistant) continue;
                }
                sanitized.push(msg);
            } else {
                sanitized.push(msg);
            }
        }

        return sanitized;
    }

    /**
     * Generate a summary of older messages to reduce token usage.
     */
    async summarizeIfNeeded(classId: string, provider: any, model: string): Promise<void> {
        const history = await this.sessionManager.getHistory(classId);
        if (history.length <= SUMMARIZATION_THRESHOLD) return;

        const olderMessages = history.slice(0, -MAX_RECENT_MESSAGES);
        if (olderMessages.length === 0) return;

        const conversationText = olderMessages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => `${m.role}: ${m.content.substring(0, 200)}`)
            .join('\n');

        if (!conversationText.trim()) return;

        try {
            const summaryMessages = [
                {
                    role: 'system' as const,
                    content: 'Summarize this learning conversation in 3-5 bullet points. Focus on: topics covered, student strengths/weaknesses, where they left off.',
                },
                { role: 'user' as const, content: conversationText },
            ];

            const response = await provider.chat(summaryMessages, [], model, {
                max_tokens: 300,
                temperature: 0.3,
            });

            if (response.content) {
                this.summaryCache.set(classId, response.content);
                console.log(`  [ContextBuilder] Summarized ${olderMessages.length} older messages`);
                // NOTE: We do NOT truncate the DB history anymore.
                // The full history is preserved for frontend page refreshes.
                // Only the context sent to the LLM is windowed (last 16 messages).
            }
        } catch (err) {
            console.error('[ContextBuilder] Summarization failed:', err);
        }
    }

    /**
     * Compact verbose tool results to reduce token waste.
     */
    private compactContent(role: string, content: string): string {
        if (role === 'tool') {
            if (content.length > 500) {
                return content.substring(0, 500) + '... [truncated]';
            }
        }
        return content;
    }
}
