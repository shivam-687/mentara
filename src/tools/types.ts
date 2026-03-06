// ── Tool System Types ──
// Inspired by PicoClaw's tool registry pattern.

export interface ToolParameter {
    type: string;
    description: string;
    enum?: string[];
}

export interface ToolSchema {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
}

export interface ToolResult {
    content: string;
    error?: string;
}

export interface Tool {
    name: string;
    description: string;
    parameters: ToolSchema;
    execute(args: Record<string, unknown>): Promise<ToolResult>;
}
