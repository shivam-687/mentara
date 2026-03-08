import type { LLMProvider, Message } from '../providers/types.js';
import type { ClassData, ClassNotesData, ProgressData, QuestionAnswerData, TestResultData } from '../session/types.js';

interface NoteGenerationInput {
    classData: ClassData;
    progress: ProgressData | null;
    history: Array<{ role: string; content: string }>;
    questions: QuestionAnswerData[];
    tests: TestResultData[];
}

interface GeneratedNotesPayload {
    title: string;
    summary: string;
    markdown: string;
    key_takeaways: string[];
    glossary: Array<{ term: string; meaning: string }>;
    action_items: string[];
    timeline: Array<{ title: string; detail: string }>;
}

function extractJsonObject(content: string): GeneratedNotesPayload | null {
    const direct = content.trim();
    const candidates = [direct];
    const fencedMatch = direct.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fencedMatch) {
        candidates.unshift(fencedMatch[1].trim());
    }

    for (const candidate of candidates) {
        try {
            const parsed = JSON.parse(candidate) as GeneratedNotesPayload;
            if (
                typeof parsed.title === 'string' &&
                typeof parsed.summary === 'string' &&
                typeof parsed.markdown === 'string' &&
                Array.isArray(parsed.key_takeaways) &&
                Array.isArray(parsed.glossary) &&
                Array.isArray(parsed.action_items) &&
                Array.isArray(parsed.timeline)
            ) {
                return {
                    title: parsed.title,
                    summary: parsed.summary,
                    markdown: parsed.markdown,
                    key_takeaways: parsed.key_takeaways.filter(item => typeof item === 'string').slice(0, 8),
                    glossary: parsed.glossary
                        .filter(item => item && typeof item === 'object' && typeof item.term === 'string' && typeof item.meaning === 'string')
                        .slice(0, 10),
                    action_items: parsed.action_items.filter(item => typeof item === 'string').slice(0, 8),
                    timeline: parsed.timeline
                        .filter(item => item && typeof item === 'object' && typeof item.title === 'string' && typeof item.detail === 'string')
                        .slice(0, 8),
                };
            }
        } catch {
            // Ignore parse errors and fall through to the heuristic fallback.
        }
    }

    return null;
}

function buildFallbackNotes(input: NoteGenerationInput): GeneratedNotesPayload {
    const currentModuleTitle = input.classData.roadmap?.modules.find(mod => mod.id === input.classData.current_module_id)?.title;
    const timeline = (input.classData.roadmap?.modules || []).slice(0, 8).map(module => ({
        title: module.title,
        detail: `${module.status === 'completed' ? 'Completed' : module.status === 'in_progress' ? 'Reached' : 'Planned'} with ${module.mastery_score}% mastery across ${module.subtopics.length} subtopics.`,
    }));

    const incorrectTopics = input.questions
        .filter(question => !question.is_correct && question.topic)
        .map(question => question.topic as string)
        .filter((topic, index, array) => array.indexOf(topic) === index)
        .slice(0, 5);

    const keyTakeaways = [
        `Completed ${input.progress?.modules_completed || 0} of ${input.progress?.modules_total || 0} modules in ${input.classData.title}.`,
        currentModuleTitle ? `The most recent focus area was ${currentModuleTitle}.` : `The class covered a structured sequence of modules.`,
        input.progress?.total_questions ? `Answered ${input.progress.total_questions} questions with ${input.progress.total_correct} correct.` : 'Built understanding through explanations and checks for understanding.',
    ].filter(Boolean);

    const actionItems = incorrectTopics.length > 0
        ? incorrectTopics.map(topic => `Review ${topic} using one concrete example and one short self-test.`)
        : ['Do one quick recap pass and explain the core ideas out loud in your own words.'];

    return {
        title: `${input.classData.title} Notes`,
        summary: `Study notes for ${input.classData.title}, focused on what was taught, what was checked, and what to revisit next.`,
        markdown: [
            `# ${input.classData.title}`,
            '',
            '## Summary',
            `- ${keyTakeaways.join('\n- ')}`,
            '',
            '## Recommended Next Moves',
            actionItems.map(item => `- ${item}`).join('\n'),
        ].join('\n'),
        key_takeaways: keyTakeaways,
        glossary: incorrectTopics.map(topic => ({ term: topic, meaning: 'Important concept to revisit from this class.' })),
        action_items: actionItems,
        timeline,
    };
}

export async function generateClassNotesWithProvider(
    provider: LLMProvider,
    model: string,
    input: NoteGenerationInput,
): Promise<GeneratedNotesPayload> {
    const transcript = input.history
        .filter(message => message.content.trim())
        .slice(-36)
        .map(message => `${message.role}: ${message.content}`)
        .join('\n\n');

    const questionSummary = input.questions.slice(0, 12).map(question => ({
        topic: question.topic,
        question: question.question_text,
        is_correct: question.is_correct,
        user_answer: question.user_answer,
        correct_answer: question.correct_answer,
    }));

    const testSummary = input.tests.slice(0, 6).map(test => ({
        title: test.title,
        score: test.score,
        correct_answers: test.correct_answers,
        total_questions: test.total_questions,
    }));

    const messages: Message[] = [
        {
            role: 'system',
            content: [
                'You are NoteTaker, the study-companion agent for Mentara.',
                'Your job is to turn a tutoring session into durable study notes.',
                'Return JSON only.',
                'Do not wrap the JSON in markdown unless necessary.',
                'Write concise, high-signal notes that a student can reuse later.',
                'Required schema:',
                '{',
                '  "title": string,',
                '  "summary": string,',
                '  "markdown": string,',
                '  "key_takeaways": string[],',
                '  "glossary": [{"term": string, "meaning": string}],',
                '  "action_items": string[],',
                '  "timeline": [{"title": string, "detail": string}]',
                '}',
                'Constraints:',
                '- key_takeaways: 4-8 items',
                '- glossary: max 10 items',
                '- action_items: 3-6 items',
                '- timeline: max 8 items',
                '- markdown should contain short sections with bullets, not a long essay',
            ].join('\n'),
        },
        {
            role: 'user',
            content: JSON.stringify({
                class: input.classData,
                progress: input.progress,
                recent_visible_history: transcript,
                question_summary: questionSummary,
                tests: testSummary,
            }),
        },
    ];

    const response = await provider.chat(messages, [], model, {
        max_tokens: 1600,
        temperature: 0.3,
    });

    return extractJsonObject(response.content) || buildFallbackNotes(input);
}

export type { GeneratedNotesPayload };
