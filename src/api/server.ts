// ── Mentara API Server ──
// Express REST API with Clerk authentication and PostgreSQL via Drizzle.

import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { loadConfig } from '../config.js';
import { createProvider } from '../providers/index.js';
import { getDb } from '../db/index.js';
import { TutorEngine } from '../engine/index.js';
import { createRoutes } from './routes.js';

const config = loadConfig();

// Validate config based on provider
if (config.provider === 'openrouter' && !config.openrouterApiKey) {
    console.error('❌ OPENROUTER_API_KEY is required when using OpenRouter. Copy .env.example to .env and set your key.');
    process.exit(1);
}

if (!config.databaseUrl) {
    console.error('❌ DATABASE_URL is required. Set your PostgreSQL connection string in .env.');
    process.exit(1);
}

// Initialize database
const db = getDb(config.databaseUrl);

// Initialize provider and engine
const provider = createProvider(config.provider, {
    apiKey: config.openrouterApiKey,
    baseUrl: config.ollamaBaseUrl,
});
const engine = new TutorEngine({
    provider,
    model: config.model,
    db,
});

// Create Express app
const app = express();
app.use(express.json());

// CORS for local dev
app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (_req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Clerk middleware (populates req.auth)
if (config.clerkSecretKey) {
    app.use(clerkMiddleware());
}

// Mount routes
app.use('/api', createRoutes(engine));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', provider: config.provider, model: config.model, database: 'postgresql' });
});

// Start server
app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║         🎓 Mentara AI Tutor             ║
║    Personal Agentic Learning System     ║
╠══════════════════════════════════════════╣
║  API: http://localhost:${String(config.port).padEnd(18)}║
║  Provider: ${config.provider.padEnd(29)}║
║  Model: ${config.model.padEnd(32)}║
║  DB: PostgreSQL (Drizzle ORM)           ║
║  Auth: ${config.clerkSecretKey ? 'Clerk ✅' : 'Disabled (no key)'}${''.padEnd(config.clerkSecretKey ? 22 : 13)}║
╚══════════════════════════════════════════╝
  `);
});

export default app;
