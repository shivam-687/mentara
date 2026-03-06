// ── Mentara CLI ──
// Interactive command-line interface for testing the tutor engine.

import { createInterface } from 'readline';
import { loadConfig } from '../config.js';
import { createProvider } from '../providers/index.js';
import { TutorEngine } from '../engine/index.js';

const config = loadConfig();

if (config.provider === 'openrouter' && !config.openrouterApiKey) {
    console.error('❌ OPENROUTER_API_KEY is required when using OpenRouter. Copy .env.example to .env and set your key.');
    process.exit(1);
}

const provider = createProvider(config.provider, {
    apiKey: config.openrouterApiKey,
    baseUrl: config.ollamaBaseUrl,
});
const engine = new TutorEngine({
    provider,
    model: config.model,
    dataDir: config.dataDir,
});

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

function prompt(question: string): Promise<string> {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer.trim()));
    });
}

async function main() {
    console.log(`
╔══════════════════════════════════════════╗
║         🎓 Mentara AI Tutor CLI         ║
║    Personal Agentic Learning System     ║
╠══════════════════════════════════════════╣
║  Model: ${config.model.padEnd(32)}║
║  Data: ${config.dataDir.padEnd(33)}║
╚══════════════════════════════════════════╝
  `);

    // Check for existing classes
    const classes = engine.listClasses();
    let classId: string;

    if (classes.length > 0) {
        console.log('📚 Your Classes:');
        classes.forEach((c, i) => {
            const progress = engine.getProgress(c.id);
            const mastery = progress?.overall_mastery || 0;
            console.log(`  ${i + 1}. ${c.title} [${c.status}] (${mastery}% mastery)`);
        });
        console.log(`  ${classes.length + 1}. Create new class`);
        console.log('');

        const choice = await prompt('Select a class (number): ');
        const idx = parseInt(choice, 10) - 1;

        if (idx >= 0 && idx < classes.length) {
            classId = classes[idx].id;
            console.log(`\n📖 Resuming: ${classes[idx].title}\n`);
        } else {
            // Create new class
            const goal = await prompt('🎯 What do you want to learn? ');
            const classData = engine.createClass(goal, goal);
            classId = classData.id;
            console.log(`\n📖 Created class: ${classData.title}\n`);

            // Send initial message
            console.log('🎓 Tutor is thinking...\n');
            const response = await engine.chat(classId, `I want to learn: ${goal}`);
            console.log(`🎓 Tutor: ${response}\n`);
        }
    } else {
        const goal = await prompt('🎯 What do you want to learn? ');
        const classData = engine.createClass(goal, goal);
        classId = classData.id;
        console.log(`\n📖 Created class: ${classData.title}\n`);

        // Send initial message
        console.log('🎓 Tutor is thinking...\n');
        const response = await engine.chat(classId, `I want to learn: ${goal}`);
        console.log(`🎓 Tutor: ${response}\n`);
    }

    // Main chat loop
    while (true) {
        const input = await prompt('You: ');

        if (!input) continue;

        // Special commands
        if (input === '/quit' || input === '/exit') {
            console.log('\n👋 Goodbye! Your progress has been saved.\n');
            break;
        }

        if (input === '/progress') {
            const progress = engine.getProgress(classId);
            const classData = engine.getClass(classId);
            console.log('\n📊 Progress Report:');
            console.log(`  Overall Mastery: ${progress?.overall_mastery || 0}%`);
            console.log(`  Modules: ${progress?.modules_completed || 0}/${progress?.modules_total || 0}`);
            console.log(`  Questions: ${progress?.total_correct || 0}/${progress?.total_questions || 0} correct`);
            if (progress?.weak_concepts && progress.weak_concepts.length > 0) {
                console.log(`  Weak Areas: ${progress.weak_concepts.join(', ')}`);
            }
            if (classData?.roadmap) {
                console.log('\n  Module Details:');
                for (const mod of classData.roadmap.modules) {
                    const statusIcon = mod.status === 'completed' ? '✅' : mod.status === 'in_progress' ? '📖' : '⬜';
                    console.log(`    ${statusIcon} ${mod.title} (${mod.mastery_score}% mastery)`);
                }
            }
            console.log('');
            continue;
        }

        if (input === '/lock') {
            try {
                engine.lockRoadmap(classId);
                console.log('\n🔒 Roadmap locked! Learning begins.\n');
                const response = await engine.chat(classId, 'I have locked the roadmap. Let\'s begin learning.');
                console.log(`🎓 Tutor: ${response}\n`);
            } catch (err) {
                console.log(`\n❌ ${(err as Error).message}\n`);
            }
            continue;
        }

        if (input === '/help') {
            console.log('\n📋 Commands:');
            console.log('  /progress - View your progress');
            console.log('  /lock     - Lock the roadmap and start learning');
            console.log('  /help     - Show this help');
            console.log('  /quit     - Exit (progress is saved)\n');
            continue;
        }

        // Regular message to tutor
        console.log('\n🎓 Tutor is thinking...\n');
        try {
            const response = await engine.chat(classId, input);
            console.log(`🎓 Tutor: ${response}\n`);
        } catch (err) {
            console.error(`\n❌ Error: ${(err as Error).message}\n`);
        }
    }

    rl.close();
}

main().catch(console.error);
