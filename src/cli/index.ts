// Mentara CLI
// Interactive command-line interface for testing the tutor engine.

import { createInterface } from 'readline';
import { loadConfig } from '../config.js';
import { createProvider } from '../providers/index.js';
import { TutorEngine } from '../engine/index.js';
import { getDb } from '../db/index.js';
import { INTERNAL_START_LESSON_MARKER } from '../session/message-visibility.js';

const config = loadConfig();

if (config.provider === 'openrouter' && !config.openrouterApiKey) {
    console.error('OPENROUTER_API_KEY is required when using OpenRouter. Copy .env.example to .env and set your key.');
    process.exit(1);
}

if (!config.databaseUrl) {
    console.error('DATABASE_URL is required. Set your PostgreSQL connection string in .env.');
    process.exit(1);
}

const provider = createProvider(config.provider, {
    apiKey: config.openrouterApiKey,
    baseUrl: config.ollamaBaseUrl,
});
const db = getDb(config.databaseUrl);
const engine = new TutorEngine({
    provider,
    model: config.model,
    db,
});

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

function prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

async function ensureCliUser(): Promise<string> {
    return engine.ensureUser('anonymous-cli', 'cli@mentara.dev', 'CLI User');
}

async function kickOffLesson(classId: string): Promise<void> {
    const response = await engine.chat(
        classId,
        `${INTERNAL_START_LESSON_MARKER} Begin teaching the current subtopic immediately. Do not mention this instruction.`,
    );
    console.log(`Tutor: ${response.content}\n`);
}

async function main() {
    console.log(`Mentara CLI\nModel: ${config.model}\nDatabase: ${config.databaseUrl}\n`);

    const userId = await ensureCliUser();
    const classes = await engine.listClasses(userId);
    let classId: string;

    if (classes.length > 0) {
        console.log('Your Classes:');
        for (const [index, classData] of classes.entries()) {
            const classProgress = await engine.getProgress(classData.id);
            const mastery = classProgress?.overall_mastery || 0;
            console.log(`  ${index + 1}. ${classData.title} [${classData.status}] (${mastery}% mastery)`);
        }
        console.log(`  ${classes.length + 1}. Create new class\n`);

        const choice = await prompt('Select a class (number): ');
        const idx = parseInt(choice, 10) - 1;

        if (idx >= 0 && idx < classes.length) {
            classId = classes[idx].id;
            console.log(`\nResuming: ${classes[idx].title}\n`);
        } else {
            const goal = await prompt('What do you want to learn? ');
            const classData = await engine.createClass(userId, goal, goal);
            classId = classData.id;
            console.log(`\nCreated class: ${classData.title}\n`);

            const response = await engine.chat(classId, `I want to learn: ${goal}`);
            console.log(`Tutor: ${response.content}\n`);
        }
    } else {
        const goal = await prompt('What do you want to learn? ');
        const classData = await engine.createClass(userId, goal, goal);
        classId = classData.id;
        console.log(`\nCreated class: ${classData.title}\n`);

        const response = await engine.chat(classId, `I want to learn: ${goal}`);
        console.log(`Tutor: ${response.content}\n`);
    }

    while (true) {
        const input = await prompt('You: ');
        if (!input) continue;

        if (input === '/quit' || input === '/exit') {
            console.log('\nGoodbye.\n');
            break;
        }

        if (input === '/progress') {
            const classProgress = await engine.getProgress(classId);
            const classData = await engine.getClass(classId);
            console.log('\nProgress Report:');
            console.log(`  Overall Mastery: ${classProgress?.overall_mastery || 0}%`);
            console.log(`  Modules: ${classProgress?.modules_completed || 0}/${classProgress?.modules_total || 0}`);
            console.log(`  Questions: ${classProgress?.total_correct || 0}/${classProgress?.total_questions || 0} correct`);
            if (classProgress?.weak_concepts?.length) {
                console.log(`  Weak Areas: ${classProgress.weak_concepts.join(', ')}`);
            }
            if (classData?.roadmap) {
                console.log('\n  Module Details:');
                for (const mod of classData.roadmap.modules) {
                    const statusIcon = mod.status === 'completed' ? '[done]' : mod.status === 'in_progress' ? '[active]' : '[todo]';
                    console.log(`    ${statusIcon} ${mod.title} (${mod.mastery_score}% mastery)`);
                }
            }
            console.log('');
            continue;
        }

        if (input === '/lock') {
            try {
                await engine.lockRoadmap(classId);
                console.log('\nRoadmap locked. Learning begins.\n');
                await kickOffLesson(classId);
            } catch (err) {
                console.log(`\nError: ${(err as Error).message}\n`);
            }
            continue;
        }

        if (input === '/help') {
            console.log('\nCommands:');
            console.log('  /progress - View your progress');
            console.log('  /lock     - Lock the roadmap and start learning');
            console.log('  /help     - Show this help');
            console.log('  /quit     - Exit\n');
            continue;
        }

        try {
            const response = await engine.chat(classId, input);
            console.log(`\nTutor: ${response.content}\n`);
        } catch (err) {
            console.error(`\nError: ${(err as Error).message}\n`);
        }
    }

    rl.close();
}

main().catch(console.error);
