// ── Create Class ──
// Multi-step flow: Goal → Experience → Depth → Interests → Building Roadmap.
// Merges the old create page + setup wizard into one unified experience.
// The roadmap is built during a single API call, not as a chat conversation.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Sparkles, BookOpen, Target, Lightbulb, GraduationCap, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const suggestions = [
    { icon: BookOpen, text: 'Learn Retrieval Augmented Generation deeply', color: 'var(--color-accent)' },
    { icon: Target, text: 'Master system design interviews', color: 'var(--color-success)' },
    { icon: Lightbulb, text: 'Understand machine learning fundamentals', color: 'var(--color-warning)' },
];

interface SetupStep {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    options?: { value: string; label: string; description: string }[];
    type: 'cards' | 'text';
}

const setupSteps: SetupStep[] = [
    {
        id: 'experience',
        title: "What's your experience level?",
        subtitle: 'This helps tailor the depth and pacing of your learning.',
        icon: GraduationCap,
        type: 'cards',
        options: [
            { value: 'beginner', label: 'Beginner', description: 'New to this topic. Start from the fundamentals.' },
            { value: 'intermediate', label: 'Intermediate', description: 'Know the basics. Ready for deeper concepts.' },
            { value: 'advanced', label: 'Advanced', description: 'Strong foundation. Focus on advanced topics and edge cases.' },
        ],
    },
    {
        id: 'depth',
        title: 'How deep do you want to go?',
        subtitle: 'Choose the level of detail for your learning roadmap.',
        icon: Layers,
        type: 'cards',
        options: [
            { value: 'overview', label: 'Overview', description: 'Broad understanding of key concepts. Quick and focused.' },
            { value: 'balanced', label: 'Balanced', description: 'Good mix of theory and practice. Most popular choice.' },
            { value: 'deep-dive', label: 'Deep Dive', description: 'Comprehensive coverage. Leave no stone unturned.' },
        ],
    },
    {
        id: 'interests',
        title: 'Any specific areas of interest?',
        subtitle: 'Optional — tell us what you want to focus on or skip.',
        icon: Target,
        type: 'text',
    },
];

const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
};

type Phase = 'goal' | 'setup' | 'building';

export default function CreateClass() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<Phase>('goal');
    const [goal, setGoal] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [textInput, setTextInput] = useState('');
    const [error, setError] = useState('');

    const step = setupSteps[currentStep];
    const totalSteps = setupSteps.length + 1; // goal + setup steps
    const activeStepIndex = phase === 'goal' ? 0 : currentStep + 1;

    // ── Goal Phase Handlers ──

    const handleGoalSubmit = () => {
        if (!goal.trim()) return;
        setDirection(1);
        setPhase('setup');
    };

    // ── Setup Phase Handlers ──

    const selectOption = (value: string) => {
        setAnswers(prev => ({ ...prev, [step.id]: value }));
        // Auto-advance after card selection
        setTimeout(() => {
            if (currentStep < setupSteps.length - 1) {
                setDirection(1);
                setCurrentStep(prev => prev + 1);
            }
        }, 300);
    };

    const goNext = () => {
        if (step.type === 'text') {
            setAnswers(prev => ({ ...prev, [step.id]: textInput }));
        }
        if (currentStep < setupSteps.length - 1) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        } else {
            handleBuild();
        }
    };

    const goBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        } else {
            // Back to goal phase
            setDirection(-1);
            setPhase('goal');
        }
    };

    // ── Build Roadmap ──

    const handleBuild = async () => {
        setPhase('building');
        setError('');

        const preferences = {
            experience: answers.experience,
            depth: answers.depth,
            interests: textInput || answers.interests || '',
        };

        try {
            const result = await api.createClass(goal.trim(), preferences);
            navigate(`/session/${result.class.id}`);
        } catch (err) {
            setError((err as Error).message);
            setPhase('setup');
        }
    };

    const canProceed = step?.type === 'text' || answers[step?.id];
    const isLastStep = currentStep === setupSteps.length - 1;

    // ── Render: Building Phase ──

    if (phase === 'building') {
        return (
            <div className="animate-fade-in mx-auto max-w-2xl py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.165, 0.85, 0.45, 1] }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="mb-8 relative">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-accent-light)]">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-medium tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                        Building your roadmap...
                    </h2>
                    <p className="mt-2 max-w-md text-[var(--color-text-secondary)]">
                        Your AI tutor is creating a personalized learning path for
                    </p>
                    <p className="mt-1 max-w-md font-medium text-[var(--color-text-primary)]">
                        "{goal}"
                    </p>
                    <div className="mt-8 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                        {answers.experience && (
                            <span className="rounded-full border border-[var(--color-border)] px-3 py-1 capitalize">
                                {answers.experience}
                            </span>
                        )}
                        {answers.depth && (
                            <span className="rounded-full border border-[var(--color-border)] px-3 py-1 capitalize">
                                {answers.depth}
                            </span>
                        )}
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-6 text-sm text-[var(--color-error)]"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        );
    }

    // ── Render: Goal & Setup Phases ──

    return (
        <div className="animate-fade-in mx-auto max-w-2xl py-12">
            {/* Progress dots */}
            <div className="mb-8 flex justify-center gap-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'h-1.5 rounded-full transition-all duration-300',
                            i === activeStepIndex
                                ? 'w-8 bg-[var(--color-accent)]'
                                : i < activeStepIndex
                                    ? 'w-1.5 bg-[var(--color-accent)]/50'
                                    : 'w-1.5 bg-[var(--color-border)]'
                        )}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait" custom={direction}>
                {phase === 'goal' ? (
                    <motion.div
                        key="goal"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.165, 0.85, 0.45, 1] }}
                    >
                        {/* Goal Header */}
                        <div className="text-center">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-light)]">
                                <Sparkles className="h-7 w-7 text-[var(--color-accent)]" />
                            </div>
                            <h1 className="text-3xl font-medium tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                                What would you like to learn?
                            </h1>
                            <p className="mt-2 text-[var(--color-text-secondary)]">
                                Describe your learning goal and we'll build a personalized roadmap.
                            </p>
                        </div>

                        {/* Goal Input */}
                        <div className="mt-10">
                            <div className="relative">
                                <Input
                                    placeholder="e.g., Teach me RAG deeply like an AI engineer..."
                                    value={goal}
                                    onChange={e => setGoal(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleGoalSubmit()}
                                    className="h-14 pr-14 text-base shadow-[var(--shadow-md)] border-[var(--color-border)]"
                                    autoFocus
                                />
                                <Button
                                    size="icon"
                                    variant="accent"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-[var(--radius-md)]"
                                    onClick={handleGoalSubmit}
                                    disabled={!goal.trim()}
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Suggestions */}
                        <div className="mt-10">
                            <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                                Or try one of these
                            </p>
                            <div className="space-y-2">
                                {suggestions.map((s, i) => {
                                    const Icon = s.icon;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => { setGoal(s.text); }}
                                            className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-left text-sm transition-all duration-200 hover:border-[var(--color-accent)]/30 hover:shadow-[var(--shadow-sm)] active:scale-[0.998] cursor-pointer"
                                        >
                                            <Icon className="h-4 w-4 flex-shrink-0" style={{ color: s.color }} />
                                            <span className="text-[var(--color-text-secondary)]">{s.text}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={step.id}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.165, 0.85, 0.45, 1] }}
                    >
                        {/* Step header */}
                        <div className="text-center mb-8">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-light)]">
                                <step.icon className="h-5 w-5 text-[var(--color-accent)]" />
                            </div>
                            <h2
                                className="text-2xl font-medium tracking-tight"
                                style={{ fontFamily: 'var(--font-heading)' }}
                            >
                                {step.title}
                            </h2>
                            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                                {step.subtitle}
                            </p>
                        </div>

                        {/* Step content */}
                        {step.type === 'cards' && step.options && (
                            <div className="space-y-3">
                                {step.options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => selectOption(option.value)}
                                        className={cn(
                                            'flex w-full items-start gap-4 rounded-[var(--radius-lg)] border p-4 text-left transition-all duration-200 cursor-pointer',
                                            answers[step.id] === option.value
                                                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]/50 shadow-[var(--shadow-sm)]'
                                                : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-accent)]/30 hover:shadow-[var(--shadow-sm)]'
                                        )}
                                    >
                                        <div className={cn(
                                            'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
                                            answers[step.id] === option.value
                                                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                                                : 'border-[var(--color-border)]'
                                        )}>
                                            {answers[step.id] === option.value && (
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-[var(--color-text-primary)]">{option.label}</div>
                                            <div className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{option.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {step.type === 'text' && (
                            <div>
                                <Input
                                    placeholder="e.g., Focus on practical implementation, skip the math..."
                                    value={textInput}
                                    onChange={e => setTextInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && goNext()}
                                    className="h-14 text-base"
                                    autoFocus
                                />
                                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                                    Press Enter to continue, or leave blank to skip.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
                {phase === 'setup' ? (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goBack}
                            className="gap-1.5"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back
                        </Button>

                        {(step.type === 'text' || isLastStep) && (
                            <Button
                                variant="accent"
                                size="sm"
                                onClick={goNext}
                                className="gap-1.5"
                            >
                                {isLastStep ? (
                                    <>
                                        Build Roadmap
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </Button>
                        )}
                    </>
                ) : (
                    <div /> /* Spacer for goal phase — nav is handled by the input button */
                )}
            </div>

            {/* Learning goal badge — shown during setup steps */}
            {phase === 'setup' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 text-center"
                >
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
                        <Sparkles className="h-3 w-3" />
                        {goal.length > 50 ? goal.substring(0, 50) + '...' : goal}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
