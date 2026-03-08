// ── Tutor Engine — The Core Agentic Loop ──
// Uses PostgreSQL-backed SessionManager via Drizzle ORM.

import * as fs from 'fs';
import * as path from 'path';
import type { LLMProvider, Message, ToolCall } from '../providers/types.js';
import type { SessionEvent } from '../providers/stream-types.js';
import { isUIArtifactTool } from '../providers/stream-types.js';
import { ToolRegistry } from '../tools/registry.js';
import {
    createClassStateTool,
    createUpdateClassStateTool,
    createGetProgressTool,
    createUpdateProgressTool,
    createShowCodeTool,
    createShowOptionsTool,
    createShowQuestionFlowTool,
    createShowHtmlTool,
    createRecordQuestionAnswerTool,
    createShowTestTool,
    createShowFlashcardsTool,
    createShowInteractiveTool,
} from '../tools/index.js';
import { SessionManager } from '../session/manager.js';
import { isHiddenAssistantContent } from '../session/message-visibility.js';
import { ContextBuilder } from './context-builder.js';
import { generateClassNotesWithProvider } from '../agents/note-taker.js';
import type { Database } from '../db/index.js';

function isOptionPayload(value: unknown): value is {
    id?: string;
    title?: string;
    description?: string;
    options: Array<{ id: string; label: string; description?: string }>;
    selectionMode?: 'single' | 'multi';
    responseActions?: Array<{ id: string; label: string; variant?: string }>;
} {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const record = value as Record<string, unknown>;
    if (!Array.isArray(record.options) || record.options.length === 0) {
        return false;
    }

    return record.options.every(option => {
        if (!option || typeof option !== 'object' || Array.isArray(option)) {
            return false;
        }
        const optionRecord = option as Record<string, unknown>;
        return typeof optionRecord.id === 'string' && typeof optionRecord.label === 'string';
    });
}

function createSyntheticToolCall(name: string, args: Record<string, unknown>): ToolCall {
    return {
        id: `synthetic-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'function',
        function: {
            name,
            arguments: JSON.stringify(args),
        },
    };
}

function normalizeEmbeddedToolPayloads(response: { content: string; tool_calls?: ToolCall[] }): { content: string; tool_calls: ToolCall[] } {
    const toolCalls = [...(response.tool_calls || [])];
    let content = response.content || '';

    const jsonFencePattern = /```json\s*([\s\S]*?)\s*```/ig;
    let match: RegExpExecArray | null;
    while ((match = jsonFencePattern.exec(response.content || '')) !== null) {
        try {
            const parsed = JSON.parse(match[1]) as Record<string, unknown>;
            if (!isOptionPayload(parsed)) {
                continue;
            }

            const args: Record<string, unknown> = {
                id: typeof parsed.id === 'string' && parsed.id ? parsed.id : `q-${Date.now()}`,
                title: typeof parsed.title === 'string' ? parsed.title : undefined,
                description: typeof parsed.description === 'string' ? parsed.description : undefined,
                options: parsed.options,
                selectionMode: parsed.selectionMode === 'multi' ? 'multi' : 'single',
                responseActions: Array.isArray(parsed.responseActions) ? parsed.responseActions : undefined,
            };

            const alreadyHasEquivalent = toolCalls.some(tc => tc.function.name === 'show_options' && tc.function.arguments === JSON.stringify(args));
            if (!alreadyHasEquivalent) {
                toolCalls.push(createSyntheticToolCall('show_options', args));
            }
            content = content.replace(match[0], '').trim();
        } catch {
            continue;
        }
    }

    return { content, tool_calls: toolCalls };
}

export interface TutorEngineConfig {
    provider: LLMProvider;
    model: string;
    db: Database;
    maxIterations?: number;
    maxTokens?: number;
    temperature?: number;
}

export class TutorEngine {
    private provider: LLMProvider;
    private model: string;
    private db: Database;
    private sessionManager: SessionManager;
    private contextBuilder: ContextBuilder;
    private toolRegistry: ToolRegistry;
    private maxIterations: number;
    private maxTokens: number;
    private temperature: number;

    constructor(config: TutorEngineConfig) {
        this.provider = config.provider;
        this.model = config.model;
        this.db = config.db;
        this.maxIterations = config.maxIterations || 10;
        this.maxTokens = config.maxTokens || 8192;
        this.temperature = config.temperature || 0.75;

        // Initialize session manager with database
        this.sessionManager = new SessionManager(config.db);

        // Initialize context builder
        this.contextBuilder = new ContextBuilder(this.sessionManager);

        // Initialize tool registry with teaching tools
        this.toolRegistry = new ToolRegistry();
        this.toolRegistry.register(createClassStateTool(this.sessionManager));
        this.toolRegistry.register(createUpdateClassStateTool(this.sessionManager));
        this.toolRegistry.register(createGetProgressTool(this.sessionManager));
        this.toolRegistry.register(createUpdateProgressTool(this.sessionManager));
        this.toolRegistry.register(createShowCodeTool());
        this.toolRegistry.register(createShowOptionsTool());
        this.toolRegistry.register(createShowQuestionFlowTool());
        this.toolRegistry.register(createShowHtmlTool());
        this.toolRegistry.register(createRecordQuestionAnswerTool(this.sessionManager));
        this.toolRegistry.register(createShowTestTool());
        this.toolRegistry.register(createShowFlashcardsTool());
        this.toolRegistry.register(createShowInteractiveTool());
    }

    // ── Public API ──

    getSessionManager(): SessionManager {
        return this.sessionManager;
    }

    getDb(): Database {
        return this.db;
    }

    async ensureUser(clerkId: string, email?: string, name?: string): Promise<string> {
        return this.sessionManager.ensureUser(clerkId, email, name);
    }

    async createClass(userId: string, title: string, description: string) {
        return this.sessionManager.createClass(userId, title, description);
    }

    async listClasses(userId?: string) {
        return this.sessionManager.listClasses(userId);
    }

    async getClass(classId: string) {
        return this.sessionManager.getClass(classId);
    }

    async getProgress(classId: string) {
        return this.sessionManager.getProgress(classId);
    }

    async getVisibleHistory(classId: string) {
        return this.sessionManager.getVisibleHistory(classId);
    }

    async getClassNotes(classId: string) {
        return this.sessionManager.getClassNotes(classId);
    }

    async updateClassNotesSettings(classId: string, settings: { mode?: 'auto' | 'manual'; auto_generate?: boolean }) {
        return this.sessionManager.updateClassNotesSettings(classId, settings);
    }

    async generateClassNotes(classId: string) {
        await this.sessionManager.markClassNotesStatus(classId, 'generating');

        try {
            const [classData, progressData, history, questions, tests] = await Promise.all([
                this.sessionManager.getClass(classId),
                this.sessionManager.getProgress(classId),
                this.sessionManager.getVisibleHistory(classId),
                this.sessionManager.getQuestionAnswers(classId),
                this.sessionManager.getTestResults(classId),
            ]);

            if (!classData) {
                throw new Error(`Class ${classId} not found`);
            }

            const generated = await generateClassNotesWithProvider(this.provider, this.model, {
                classData,
                progress: progressData,
                history: history.map(message => ({ role: message.role, content: message.content })),
                questions,
                tests,
            });

            return this.sessionManager.saveClassNotes(classId, {
                ...generated,
                status: 'ready',
                generated_at: new Date(),
            });
        } catch (error) {
            await this.sessionManager.markClassNotesStatus(classId, 'error');
            throw error;
        }
    }
    async lockRoadmap(classId: string) {
        return this.sessionManager.lockRoadmap(classId);
    }

    async deleteClass(classId: string) {
        return this.sessionManager.deleteClass(classId);
    }

    private buildLessonKickoffFallback(classData: Awaited<ReturnType<SessionManager['getClass']>>): string {
        if (!classData) {
            return "Let's begin. I'll introduce the topic in a simple way and then check your understanding with a short question.";
        }

        const moduleTitle = classData.roadmap?.modules.find(module => module.id === classData.current_module_id)?.title || 'this module';
        const subtopic = classData.current_module_id
            ? classData.roadmap?.modules.find(module => module.id === classData.current_module_id)?.subtopics[classData.current_subtopic_index]
            : null;

        if (subtopic) {
            return `We're starting with **${subtopic}** in **${moduleTitle}**. I'll explain the idea in plain language first, then you can tell me what part feels unclear or what example you want next.`;
        }

        return `We're starting **${moduleTitle}**. I'll explain the first idea in plain language first, then you can tell me what part feels unclear or what example you want next.`;
    }

    async startLesson(classId: string, kickoffMessage: string): Promise<{ content: string }> {
        const messages = await this.contextBuilder.buildMessages(classId, kickoffMessage);
        await this.sessionManager.addMessage(classId, 'user', kickoffMessage);

        const response = await this.provider.chat(messages, [], this.model, {
            max_tokens: Math.min(this.maxTokens, 1200),
            temperature: 0.4,
        });

        logLLMTraffic(classId, messages, response);

        let content = response.content?.trim() || '';
        if (!content || isHiddenAssistantContent(content)) {
            const classData = await this.sessionManager.getClass(classId);
            content = this.buildLessonKickoffFallback(classData);
        }

        await this.sessionManager.addMessage(classId, 'assistant', content);
        return { content };
    }

    /**
     * Send a message in a learning session and get the tutor's response.
     */
    async chat(classId: string, userMessage: string): Promise<{ content: string; tool_calls?: ToolCall[] }> {
        // 1. Build messages with full context
        const messages = await this.contextBuilder.buildMessages(classId, userMessage);

        // 2. Save user message to session history
        await this.sessionManager.addMessage(classId, 'user', userMessage);

        // 3. Run the agentic loop
        const { content, tool_calls } = await this.runAgentLoop(messages, classId);

        // 4. Save assistant response only for visible, non-tool final replies.
        if ((!tool_calls || tool_calls.length === 0) && content.trim() && !isHiddenAssistantContent(content)) {
            await this.sessionManager.addMessage(classId, 'assistant', content);
        }

        return { content, tool_calls };
    }

    /**
     * Streaming version of chat — yields SSE events as the tutor responds.
     */
    async *chatStream(classId: string, userMessage: string): AsyncGenerator<SessionEvent> {
        const messages = await this.contextBuilder.buildMessages(classId, userMessage);
        await this.sessionManager.addMessage(classId, 'user', userMessage);

        let iteration = 0;

        while (iteration < this.maxIterations) {
            iteration++;
            console.log(`  [Engine:stream] Iteration ${iteration}/${this.maxIterations}`);

            const toolDefs = this.toolRegistry.toProviderDefs();
            const stream = this.provider.chatStream(messages, toolDefs, this.model, {
                max_tokens: this.maxTokens,
                temperature: this.temperature,
            });

            // Consume the stream — yield text deltas to the client
            let response;
            while (true) {
                const result = await stream.next();
                if (result.done) {
                    response = result.value;
                    break;
                }
                const delta = result.value;
                if (delta.type === 'text_delta' && delta.content) {
                    yield { type: 'text_delta', content: delta.content };
                }
                // tool_call_delta events are accumulated by the provider, we handle them after
            }

            // Log full prompt and response to file
            logLLMTraffic(classId, messages, response);
            const normalizedResponse = normalizeEmbeddedToolPayloads(response);

            if (response.usage) {
                console.log(`  [Engine:stream] Tokens: ${response.usage.prompt_tokens} prompt, ${response.usage.completion_tokens} completion`);
            }

            // No tool calls → final response
            if (!response.tool_calls || response.tool_calls.length === 0) {
                console.log(`  [Engine:stream] Direct response (no tool calls)`);
                if (response.content.trim() && !isHiddenAssistantContent(response.content)) {
                    await this.sessionManager.addMessage(classId, 'assistant', response.content);
                }

                // Yield final status
                const updatedClass = await this.sessionManager.getClass(classId);
                const progress = await this.sessionManager.getProgress(classId);
                yield { type: 'status', class: updatedClass, progress };

                // Trigger background summarization to keep context lean
                this.contextBuilder.summarizeIfNeeded(classId, this.provider, this.model)
                    .catch(err => console.error('[Engine] Background summarization failed:', err));

                yield { type: 'done' };
                return;
            }

            console.log(`  [Engine:stream] Tool calls: ${normalizedResponse.tool_calls.map(tc => tc.function.name).join(', ')}`);

            // Add assistant message with tool calls to context
            const assistantMsg: Message = {
                role: 'assistant',
                content: normalizedResponse.content || '',
                tool_calls: normalizedResponse.tool_calls,
            };
            messages.push(assistantMsg);
            await this.sessionManager.addMessage(classId, 'assistant', normalizedResponse.content || '', normalizedResponse.tool_calls);
            // Execute each tool call
            for (const toolCall of normalizedResponse.tool_calls) {
                const toolName = toolCall.function.name;
                let args: Record<string, unknown>;
                try {
                    args = JSON.parse(toolCall.function.arguments);
                } catch {
                    args = {};
                }

                console.log(`  [Engine:stream] Executing tool: ${toolName}`);
                const result = await this.toolRegistry.execute(toolName, args);
                const resultContent = result.error ? `Error: ${result.error}` : result.content;

                const toolResultMsg: Message = {
                    role: 'tool',
                    content: resultContent,
                    tool_call_id: toolCall.id,
                };
                messages.push(toolResultMsg);
                await this.sessionManager.addMessage(classId, 'tool', resultContent, undefined, toolCall.id);

                // Forward UI artifact tools to the frontend
                if (isUIArtifactTool(toolCall)) {
                    yield { type: 'tool_call', id: toolCall.id, name: toolName, args };
                }
            }

            // ── Cascade Prevention ──
            // If ALL tool calls in this iteration were UI artifacts (show_*),
            // don't loop back to the LLM — they produce no meaningful result
            // for the LLM to act on. End the stream cleanly.
            const allUIArtifacts = normalizedResponse.tool_calls.every(tc => isUIArtifactTool(tc));
            if (allUIArtifacts) {
                console.log(`  [Engine:stream] All tool calls were UI artifacts — ending stream`);
                const updatedClass = await this.sessionManager.getClass(classId);
                const progressData = await this.sessionManager.getProgress(classId);
                yield { type: 'status', class: updatedClass, progress: progressData };

                this.contextBuilder.summarizeIfNeeded(classId, this.provider, this.model)
                    .catch(err => console.error('[Engine] Background summarization failed:', err));

                yield { type: 'done' };
                return;
            }
        }

        // Max iterations exceeded
        const fallbackContent = 'I seem to be taking too long to process. Let me try a simpler approach. What would you like to focus on?';
        await this.sessionManager.addMessage(classId, 'assistant', fallbackContent);
        yield { type: 'text_delta', content: fallbackContent };

        const updatedClass = await this.sessionManager.getClass(classId);
        const progress = await this.sessionManager.getProgress(classId);
        yield { type: 'status', class: updatedClass, progress };
        yield { type: 'done' };
    }

    // ── Agentic Loop (Core) ──

    private async runAgentLoop(messages: Message[], classId: string): Promise<{ content: string; tool_calls?: ToolCall[] }> {
        let iteration = 0;

        while (iteration < this.maxIterations) {
            iteration++;
            console.log(`  [Engine] Iteration ${iteration}/${this.maxIterations}`);

            const toolDefs = this.toolRegistry.toProviderDefs();
            const response = await this.provider.chat(messages, toolDefs, this.model, {
                max_tokens: this.maxTokens,
                temperature: this.temperature,
            });

            // Log full prompt and response to file
            logLLMTraffic(classId, messages, response);
            const normalizedResponse = normalizeEmbeddedToolPayloads(response);

            if (response.usage) {
                console.log(`  [Engine] Tokens: ${response.usage.prompt_tokens} prompt, ${response.usage.completion_tokens} completion`);
            }

            // No tool calls ??? done
            if (!normalizedResponse.tool_calls || normalizedResponse.tool_calls.length === 0) {
                console.log(`  [Engine] Direct response (no tool calls)`);
                return { content: normalizedResponse.content };
            }

            console.log(`  [Engine] Tool calls: ${normalizedResponse.tool_calls.map(tc => tc.function.name).join(', ')}`);

            // Add assistant message with tool calls
            const assistantMsg: Message = {
                role: 'assistant',
                content: normalizedResponse.content || '',
                tool_calls: normalizedResponse.tool_calls,
            };
            messages.push(assistantMsg);

            await this.sessionManager.addMessage(
                classId, 'assistant', normalizedResponse.content || '', normalizedResponse.tool_calls,
            );

            // Execute each tool call
            for (const toolCall of normalizedResponse.tool_calls) {
                const toolName = toolCall.function.name;
                let args: Record<string, unknown>;
                try {
                    args = JSON.parse(toolCall.function.arguments);
                } catch {
                    args = {};
                }

                console.log(`  [Engine] Executing tool: ${toolName}`);
                const result = await this.toolRegistry.execute(toolName, args);
                const resultContent = result.error ? `Error: ${result.error}` : result.content;

                const toolResultMsg: Message = {
                    role: 'tool',
                    content: resultContent,
                    tool_call_id: toolCall.id,
                };
                messages.push(toolResultMsg);

                await this.sessionManager.addMessage(classId, 'tool', resultContent, undefined, toolCall.id);
            }

            // Cascade prevention: if all tool calls were UI artifacts, stop
            const allUIArtifacts = normalizedResponse.tool_calls.every(tc => isUIArtifactTool(tc));
            if (allUIArtifacts) {
                console.log(`  [Engine] All tool calls were UI artifacts ??? done`);
                return { content: normalizedResponse.content || '', tool_calls: normalizedResponse.tool_calls };
            }
        }

        return { content: 'I seem to be taking too long to process. Let me try a simpler approach. What would you like to focus on?' };
    }
}

// ── Helper to capture all LLM traffic for debugging ──
function logLLMTraffic(classId: string, messages: Message[], response: any) {
    try {
        const logFile = path.resolve(process.cwd(), 'llm-debug.log');
        const timestamp = new Date().toISOString();
        const divider = '\n========================================================================\n';
        const logData = `${divider}TIMESTAMP: ${timestamp}\nCLASS_ID: ${classId}\n\n[PROMPT]\n${JSON.stringify(messages, null, 2)}\n\n[RESPONSE]\n${JSON.stringify(response, null, 2)}\n`;
        fs.appendFileSync(logFile, logData);
    } catch (err) {
        console.error('Failed to write LLM log:', err);
    }
}





