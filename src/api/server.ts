// Mentara API Server
// Express REST API with Clerk authentication and PostgreSQL via Drizzle.

import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { loadConfig } from '../config.js';
import { createProvider } from '../providers/index.js';
import { getDb } from '../db/index.js';
import { TutorEngine } from '../engine/index.js';
import { createRoutes } from './routes.js';

const config = loadConfig();

if (config.provider === 'openrouter' && !config.openrouterApiKey) {
    console.warn('OPENROUTER_API_KEY is not set. Mentara now expects browser-supplied OpenRouter keys for LLM-backed actions.');
}

if (!config.databaseUrl) {
    console.error('DATABASE_URL is required. Set your PostgreSQL connection string in .env.');
    process.exit(1);
}

const db = getDb(config.databaseUrl);
const provider = createProvider(config.provider, {
    apiKey: config.openrouterApiKey,
    baseUrl: config.ollamaBaseUrl,
});
const engine = new TutorEngine({
    provider,
    model: config.model,
    db,
});

const app = express();
app.use(express.json());

const allowedOrigins = new Set(config.allowedOrigins);
app.use((req, res, next) => {
    const origin = req.header('Origin');
    const isLocalOrigin = !!origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    const originAllowed = !origin || allowedOrigins.has(origin) || (config.nodeEnv !== 'production' && isLocalOrigin);

    res.header('Vary', 'Origin');
    if (origin && originAllowed) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-OpenRouter-API-Key, X-OpenRouter-Model');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        if (!originAllowed) {
            return res.sendStatus(403);
        }
        return res.sendStatus(200);
    }

    next();
});

if (config.clerkSecretKey) {
    app.use(clerkMiddleware());
}

app.use('/api', createRoutes(engine, config));

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        provider: config.provider,
        model: config.model,
        database: 'postgresql',
        anonymous_access: config.allowAnonymousAccess,
        env: config.nodeEnv,
    });
});

app.listen(config.port, () => {
    console.log(`Mentara API running on http://localhost:${config.port}`);
});

export default app;

