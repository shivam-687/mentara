export const INTERNAL_START_LESSON_MARKER = '[INTERNAL_START_LESSON]';
export const TOOL_ONLY_PLACEHOLDER_MESSAGE = '(Only the tool call was made as requested.)';
export const ROADMAP_REVIEW_MESSAGE = "Here's your personalized learning roadmap. Would you like to add, remove, or modify any topics?";
export const ROADMAP_TOOL_EXECUTED_MESSAGE = '(Note: The tool call has been executed and the roadmap is set.)';

export interface HistoryMessageLike {
    role: string;
    content: string;
    tool_calls?: Array<{
        id: string;
        type?: string;
        function?: {
            name?: string;
            arguments?: string;
        };
    }>;
    tool_call_id?: string;
    timestamp: string;
}

function parseJsonObject(content: string): Record<string, unknown> | null {
    const trimmed = content.trim();
    if (!trimmed.startsWith('{')) {
        return null;
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
    } catch {
        return null;
    }

    return null;
}

function hasRoadmapShape(value: unknown): boolean {
    return !!value && typeof value === 'object' && !Array.isArray(value) && 'modules' in (value as Record<string, unknown>);
}

export function isMachineStatePayload(content: string): boolean {
    const parsed = parseJsonObject(content);
    if (!parsed) {
        return false;
    }

    const hasClassEnvelope =
        ('class_id' in parsed || 'id' in parsed) &&
        'status' in parsed &&
        ('roadmap' in parsed || 'current_module_id' in parsed);

    if (hasClassEnvelope) {
        return true;
    }

    if (hasRoadmapShape(parsed)) {
        return true;
    }

    const roadmapValue = parsed.roadmap;
    if (typeof roadmapValue === 'string') {
        try {
            const nested = JSON.parse(roadmapValue);
            if (hasRoadmapShape(nested)) {
                return true;
            }
        } catch {
            return false;
        }
    }

    return false;
}

export function isSetupOrInternalUserMessage(content: string): boolean {
    const trimmed = content.trim();
    return trimmed.startsWith(INTERNAL_START_LESSON_MARKER) ||
        /^(Experience level:|I want to learn:|Depth preference:|My experience level:)/i.test(trimmed);
}

export function isHiddenAssistantContent(content: string): boolean {
    const trimmed = content.trim();
    return trimmed.length === 0 ||
        trimmed === TOOL_ONLY_PLACEHOLDER_MESSAGE ||
        trimmed === ROADMAP_REVIEW_MESSAGE ||
        trimmed === ROADMAP_TOOL_EXECUTED_MESSAGE ||
        isMachineStatePayload(trimmed);
}

export function isUiArtifactToolName(name: string | undefined): boolean {
    return ['show_code', 'show_options', 'show_question_flow', 'show_html', 'show_test', 'show_flashcards', 'show_interactive'].includes(name || '');
}
