# Mentara

**A roadmap-first AI teaching system built to explore agentic tutoring, structured learning flows, and stateful LLM product design.**

Mentara is not a generic chat wrapper. It turns a learning goal into a class, negotiates a roadmap, teaches module by module, checks understanding, stores revision memory, and generates durable notes through a separate `NoteTaker` companion.

This project exists as an engineering and product exploration of what an AI tutor looks like when it behaves more like a **class** than a **chat thread**.

## What This Project Demonstrates

- Agentic orchestration with tool-calling LLM flows
- Structured state transitions across setup, roadmap, learning, revision, and completion
- Persistent learning memory instead of stateless chat
- Multi-surface product thinking: tutor, artifacts, notes, revision, completion dossier
- Defensive UX around unreliable model behavior
- Full-stack TypeScript across Express, Drizzle/Postgres, React, Clerk, and interactive artifact rendering

## Core Product Thesis

Most AI learning tools answer prompts.

Mentara is designed around a different workflow:

1. The learner defines a goal.
2. The system builds and negotiates a roadmap.
3. The roadmap is locked into a structured class.
4. The tutor teaches one concept at a time.
5. The system checks understanding, tracks progress, and preserves revision memory.
6. A separate `NoteTaker` companion turns the class into reusable study material.

## Key Features

### 1. Roadmap-First Class Creation
- Converts a goal into modules and subtopics
- Supports learner preferences like experience level and depth
- Locks the roadmap before learning begins to keep the teaching flow structured

### 2. Stateful AI Tutor
- Teaches in sequence instead of improvising every turn from scratch
- Tracks current module and subtopic
- Uses prompt + tool orchestration to manage tutoring behavior
- Starts with deterministic teaching kickoff instead of tool-only noise

### 3. Interactive Learning Artifacts
- Diagrams and mind maps rendered with proper graph interaction
- Zoom, pan, minimap, and large-view support via `@xyflow/react`
- Option-based checks for understanding
- Markdown-aware teaching responses

### 4. Revision Memory
- Tracks question history and weak concepts
- Stores review state for spaced repetition-style revision
- Preserves class history after completion

### 5. NoteTaker Companion
- Separate note capture surface for running and completed classes
- Generates summary, glossary, action items, and timeline
- Keeps learning artifacts useful after the class ends

### 6. BYOK OpenRouter Flow
- Browser-local OpenRouter key support
- Custom OpenRouter model override support
- Seeded default model when no custom model is provided
- Dashboard and class-creation UX guarded when no key is configured

## System Overview

### Frontend
- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Clerk
- `@xyflow/react`

### Backend
- Node.js + Express
- TypeScript
- Drizzle ORM
- PostgreSQL
- Clerk auth
- OpenRouter-backed LLM provider abstraction

## Architecture Notes

### Agent / System Roles
- `Tutor`: the primary teaching agent
- `NoteTaker`: a separate companion flow that produces durable notes
- UI artifacts: diagrams, mind maps, quizzes, and structured interactions

### Important Product Decisions
- First learning turn is deterministic and text-first
- Internal orchestration messages are filtered from student-visible history
- Tool payloads are normalized defensively when model output is inconsistent
- Read-only views still work without model access; LLM-backed actions require an OpenRouter key

## Local Development

### 1. Install dependencies
```bash
npm install
cd ui && npm install
```

### 2. Configure environment
Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required pieces:
- PostgreSQL connection string
- Clerk keys
- Provider/model defaults

For the frontend:
- set `VITE_CLERK_PUBLISHABLE_KEY` in `ui/.env.local`

### 3. Start the backend
```bash
npm run dev
```

### 4. Start the frontend
```bash
cd ui
npm run dev
```

## Using the App

### OpenRouter requirement
Mentara now expects a browser-supplied OpenRouter key for LLM-backed actions.

That means:
- dashboard and read-only screens can still load without a key
- creating a class, tutoring, roadmap lock, and note generation require a configured OpenRouter key

Set it in:
- `Settings`
- or directly from the create-class screen

You can also set a custom OpenRouter model there. If you leave the model blank, the app uses the seeded default model.

## Docker Compose

A Docker-based local stack is included for running:
- `db` (PostgreSQL)
- `api` (Express backend)
- `web` (built frontend served by Nginx)

### 1. Prepare Compose env
```bash
cp .env.compose.example .env.compose
```

Fill in at least:
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

`OPENROUTER_API_KEY` can remain blank because Mentara now expects browser-supplied OpenRouter keys for LLM-backed actions.

### 2. Start the stack
```bash
docker compose --env-file .env.compose up --build
```

### 3. Open the app
- frontend: `http://localhost:5173`
- backend health: `http://localhost:3000/health`
- postgres: `localhost:${POSTGRES_PORT}` from your compose env

Notes:
- the backend container runs `drizzle-kit migrate` before starting the API
- the frontend container reverse-proxies `/api` to the backend container through Nginx
- for actual tutoring flows, add your OpenRouter key in the app Settings screen after login

## Current Product State

This repository is best understood as:
- a serious product prototype
- a showcase of agentic AI product engineering
- an exploration of structured AI teaching UX

It is **not** positioned as a broad public launch.

## What I Focused On While Building It

- Making tutoring feel like a class, not a chatbot
- Reducing prompt fragility with explicit product state
- Treating notes and revision as first-class product surfaces
- Using real interactive primitives for artifacts instead of static mock visuals
- Keeping the system useful even when the model behaves imperfectly

## Screens / Flows Worth Exploring

- Class creation and roadmap negotiation
- Learning workspace with diagrams and mind maps
- NoteTaker drawer during an active class
- Completion dossier and revision surfaces
- Settings-driven BYOK model flow

## If You Want To Try It

This project is currently best used as a local demo or engineering showcase.

To run the full tutoring flow, configure:
- PostgreSQL
- Clerk
- OpenRouter key in browser settings

## Why This Repo Exists

I built Mentara to explore a practical question:

**What changes when you stop building “AI chat” and start building a structured, stateful learning system around an LLM?**

That question drove the architecture, UI decisions, and the tradeoffs in this codebase.


