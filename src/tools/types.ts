// Tool System Types
// Inspired by PicoClaw's tool registry pattern.

export interface ToolParameter {
    type: string;
    description?: string;
    enum?: string[];
    items?: ToolParameter | {
        type: string;
        properties?: Record<string, ToolParameter>;
        required?: string[];
    };
    properties?: Record<string, ToolParameter>;
    required?: string[];
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
