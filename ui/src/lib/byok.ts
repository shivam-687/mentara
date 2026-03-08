const OPENROUTER_KEY_STORAGE = 'mentara.openrouter.apiKey';
const OPENROUTER_MODEL_STORAGE = 'mentara.openrouter.model';

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash';

export function getOpenRouterApiKey(): string {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(OPENROUTER_KEY_STORAGE) || '';
}

export function setOpenRouterApiKey(apiKey: string): void {
    if (typeof window === 'undefined') return;
    const trimmed = apiKey.trim();
    if (!trimmed) {
        window.localStorage.removeItem(OPENROUTER_KEY_STORAGE);
        return;
    }
    window.localStorage.setItem(OPENROUTER_KEY_STORAGE, trimmed);
}

export function getOpenRouterModel(): string {
    if (typeof window === 'undefined') return DEFAULT_OPENROUTER_MODEL;
    return window.localStorage.getItem(OPENROUTER_MODEL_STORAGE) || DEFAULT_OPENROUTER_MODEL;
}

export function setOpenRouterModel(model: string): void {
    if (typeof window === 'undefined') return;
    const trimmed = model.trim();
    if (!trimmed || trimmed === DEFAULT_OPENROUTER_MODEL) {
        window.localStorage.removeItem(OPENROUTER_MODEL_STORAGE);
        return;
    }
    window.localStorage.setItem(OPENROUTER_MODEL_STORAGE, trimmed);
}

export function hasOpenRouterApiKey(): boolean {
    return Boolean(getOpenRouterApiKey());
}

export function hasOpenRouterConfiguration(): boolean {
    return hasOpenRouterApiKey();
}

export function clearOpenRouterApiKey(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(OPENROUTER_KEY_STORAGE);
}

export function clearOpenRouterModel(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(OPENROUTER_MODEL_STORAGE);
}

export function maskOpenRouterApiKey(apiKey: string): string {
    const trimmed = apiKey.trim();
    if (trimmed.length <= 10) return trimmed;
    return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}
