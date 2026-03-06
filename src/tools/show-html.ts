import type { Tool } from './types.js';

/**
 * Tool to render rich HTML content — infographics, diagrams,
 * comparison tables, interactive exercises, and more.
 */
export const createShowHtmlTool = (): Tool => ({
    name: 'show_html',
    description: 'Render rich HTML content to the student — infographics, diagrams, comparison tables, process flowcharts, interactive mini-exercises. Use this extensively to make learning visual and engaging. The HTML should be self-contained with inline styles or a <style> tag.',
    parameters: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'Unique ID for this HTML artifact (e.g. infographic-1, diagram-2)' },
            html: { type: 'string', description: 'Complete, self-contained HTML content. Include inline CSS or a <style> tag. Do NOT include external dependencies.' },
            title: { type: 'string', description: 'Optional title shown above the artifact (e.g. "How RAG Works", "SQL vs NoSQL")' },
            height: { type: 'string', description: 'Optional CSS height for the iframe (e.g. "400px", "auto"). Defaults to auto.' },
        },
        required: ['id', 'html'],
    },
    execute: async (args) => ({ content: 'HTML artifact displayed to student.', error: undefined }),
});
