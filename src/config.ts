import dotenv from 'dotenv';
import type { ProviderType } from './providers/index.js';
dotenv.config();

export interface MentaraConfig {
    provider: ProviderType;
    openrouterApiKey: string;
    ollamaBaseUrl: string;
    model: string;
    port: number;
    dataDir: string;
    databaseUrl: string;
    clerkSecretKey: string;
    clerkPublishableKey: string;
}

export function loadConfig(): MentaraConfig {
    return {
        provider: (process.env.PROVIDER as ProviderType) || 'openrouter',
        openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
        ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        // Model tiers (via OpenRouter):
        //   Budget:  qwen/qwen3.5-flash-02-23, google/gemini-2.0-flash
        //   Quality: anthropic/claude-sonnet-4, google/gemini-2.5-pro
        model: process.env.MODEL || 'google/gemini-2.0-flash',
        port: parseInt(process.env.PORT || '3000', 10),
        dataDir: process.env.DATA_DIR || './data',
        databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mentara',
        clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
        clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
    };
}
