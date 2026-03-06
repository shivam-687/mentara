// ── Show Interactive Artifact Tool ──
// UI artifact tool for rendering rich interactive visualizations natively in React.

import type { Tool, ToolResult } from './types.js';

export function createShowInteractiveTool(): Tool {
    return {
        name: 'show_interactive',
        description: `Render rich interactive visual content — diagrams, mind maps, animated step-by-step explanations, comparison tables, timeline visualizations, and infographics. Unlike show_html (iframe), this renders natively in the app with full theming, accessibility, and interactivity. Use structured JSON data for the visualization.

Supported types and their STRICT JSON schemas for 'data':
- "diagram": Flowcharts. STRICT SCHEMA: {"nodes": [{"id": "string", "label": "string", "description": "string (optional)"}], "edges": [{"from": "string", "to": "string", "label": "string (optional)"}], "direction": "TB" | "LR"}
- "mindmap": Radial mind maps. STRICT SCHEMA: {"center": "string", "branches": [{"label": "string", "children": [...] }]}
- "comparison": Interactive comparison tables. STRICT SCHEMA: {"columns": ["string"], "rows": [{"label": "string", "cells": ["string"]}], "highlights": [{"row": number, "col": number}] (optional)}
- "timeline": Event timelines. STRICT SCHEMA: {"events": [{"date": "string", "title": "string", "description": "string"}]}
- "steps": Step-by-step animated explanations. STRICT SCHEMA: {"steps": [{"title": "string", "description": "string", "detail": "string (optional)"}]}
- "infographic": Info cards. STRICT SCHEMA: {"sections": [{"title": "string", "content": "string", "icon": "string (optional)", "stats": [{"label": "string", "value": "string"}]}]}

FAILURE TO USE THESE EXACT SCHEMAS WILL RESULT IN A CRASH. Do not invent your own keys (e.g. do not use "items" for comparison, use "columns" and "rows").`,
        parameters: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Unique ID for this artifact' },
                type: {
                    type: 'string',
                    enum: ['diagram', 'mindmap', 'comparison', 'timeline', 'steps', 'infographic'],
                    description: 'Type of interactive visualization',
                },
                title: { type: 'string', description: 'Title of the artifact' },
                data: {
                    type: 'string',
                    description: 'JSON string containing the structured data for the visualization (shape depends on type)',
                },
            },
            required: ['id', 'type', 'title', 'data'],
        },
        async execute(_args: Record<string, unknown>): Promise<ToolResult> {
            return { content: 'Interactive artifact displayed to student.' };
        },
    };
}
