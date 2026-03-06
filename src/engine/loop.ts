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
import { ContextBuilder } from './context-builder.js';
import type { Database } from '../db/index.js';

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

    async lockRoadmap(classId: string) {
        return this.sessionManager.lockRoadmap(classId);
    }

    async deleteClass(classId: string) {
        return this.sessionManager.deleteClass(classId);
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

        // 4. Save assistant response
        await this.sessionManager.addMessage(classId, 'assistant', content, tool_calls);

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

            if (response.usage) {
                console.log(`  [Engine:stream] Tokens: ${response.usage.prompt_tokens} prompt, ${response.usage.completion_tokens} completion`);
            }

            // No tool calls → final response
            if (!response.tool_calls || response.tool_calls.length === 0) {
                console.log(`  [Engine:stream] Direct response (no tool calls)`);
                await this.sessionManager.addMessage(classId, 'assistant', response.content);

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

            console.log(`  [Engine:stream] Tool calls: ${response.tool_calls.map(tc => tc.function.name).join(', ')}`);

            // Add assistant message with tool calls to context
            const assistantMsg: Message = {
                role: 'assistant',
                content: response.content || '',
                tool_calls: response.tool_calls,
            };
            messages.push(assistantMsg);
            await this.sessionManager.addMessage(classId, 'assistant', response.content || '', response.tool_calls);

            // Execute each tool call
            for (const toolCall of response.tool_calls) {
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
            const allUIArtifacts = response.tool_calls.every(tc => isUIArtifactTool(tc));
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

            if (response.usage) {
                console.log(`  [Engine] Tokens: ${response.usage.prompt_tokens} prompt, ${response.usage.completion_tokens} completion`);
            }

            // No tool calls → done
            if (!response.tool_calls || response.tool_calls.length === 0) {
                console.log(`  [Engine] Direct response (no tool calls)`);
                return { content: response.content };
            }

            console.log(`  [Engine] Tool calls: ${response.tool_calls.map(tc => tc.function.name).join(', ')}`);

            // Add assistant message with tool calls
            const assistantMsg: Message = {
                role: 'assistant',
                content: response.content || '',
                tool_calls: response.tool_calls,
            };
            messages.push(assistantMsg);

            await this.sessionManager.addMessage(
                classId, 'assistant', response.content || '', response.tool_calls
            );

            // Execute each tool call
            for (const toolCall of response.tool_calls) {
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
            const allUIArtifacts = response.tool_calls.every(tc => isUIArtifactTool(tc));
            if (allUIArtifacts) {
                console.log(`  [Engine] All tool calls were UI artifacts — done`);
                return { content: response.content || '', tool_calls: response.tool_calls };
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
