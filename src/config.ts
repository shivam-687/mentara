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
    nodeEnv: string;
    allowAnonymousAccess: boolean;
    allowedOrigins: string[];
}

export function loadConfig(): MentaraConfig {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const allowAnonymousAccess = process.env.ALLOW_ANONYMOUS_ACCESS
        ? process.env.ALLOW_ANONYMOUS_ACCESS === 'true'
        : nodeEnv !== 'production';
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    return {
        provider: (process.env.PROVIDER as ProviderType) || 'openrouter',
        openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
        ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.MODEL || 'google/gemini-2.0-flash',
        port: parseInt(process.env.PORT || '3000', 10),
        dataDir: process.env.DATA_DIR || './data',
        databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mentara',
        clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
        clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
        nodeEnv,
        allowAnonymousAccess,
        allowedOrigins,
    };
}
