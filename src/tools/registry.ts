// ── Tool Registry ──
// Register, list, execute tools. Convert to LLM-compatible definitions.

import type { ToolDefinition } from '../providers/types.js';
import type { Tool, ToolResult } from './types.js';

export class ToolRegistry {
    private tools: Map<string, Tool> = new Map();

    register(tool: Tool): void {
        this.tools.set(tool.name, tool);
    }

    get(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    list(): string[] {
        return Array.from(this.tools.keys());
    }

    async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
        const tool = this.tools.get(name);
        if (!tool) {
            return { content: '', error: `Tool '${name}' not found` };
        }
        try {
            return await tool.execute(args);
        } catch (err) {
            return { content: '', error: `Tool '${name}' failed: ${(err as Error).message}` };
        }
    }

    toProviderDefs(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(tool => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters as unknown as Record<string, unknown>,
            },
        }));
    }
}
