// ── Setup Wizard ──
// Guided wizard for the "clarifying" phase. Collects experience level,
// depth preference, and specific interests, then sends to the backend.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, GraduationCap, Layers, Target } from 'lucide-react';
import { api } from '@/lib/api';
import type { ClassData, ProgressData } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SetupPhaseProps {
    classData: ClassData;
    onUpdate: (classData: ClassData, progress?: ProgressData) => void;
}

interface WizardStep {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    options?: { value: string; label: string; description: string }[];
    type: 'cards' | 'text';
}

const steps: WizardStep[] = [
    {
        id: 'experience',
        title: 'What\'s your experience level?',
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

export default function SetupPhase({ classData, onUpdate }: SetupPhaseProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [textInput, setTextInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    const step = steps[currentStep];

    const goNext = () => {
        if (step.type === 'text') {
            setAnswers(prev => ({ ...prev, [step.id]: textInput }));
        }
        if (currentStep < steps.length - 1) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const goBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const selectOption = (value: string) => {
        setAnswers(prev => ({ ...prev, [step.id]: value }));
        // Auto-advance after card selection
        setTimeout(() => {
            if (currentStep < steps.length - 1) {
                setDirection(1);
                setCurrentStep(prev => prev + 1);
            }
        }, 300);
    };

    const handleSubmit = async () => {
        setIsSending(true);
        const finalAnswers = { ...answers, interests: textInput || answers.interests || '' };

        const message = [
            `Experience level: ${finalAnswers.experience || 'not specified'}.`,
            `Depth preference: ${finalAnswers.depth || 'balanced'}.`,
            finalAnswers.interests ? `Specific interests/focus: ${finalAnswers.interests}.` : '',
        ].filter(Boolean).join(' ');

        try {
            const res = await api.sendMessage(classData.id, message);
            onUpdate(res.class, res.progress);
        } catch (err) {
            console.error('Failed to send setup answers:', err);
            setIsSending(false);
        }
    };

    const StepIcon = step.icon;
    const canProceed = step.type === 'text' || answers[step.id];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="flex h-full items-center justify-center p-8">
            <div className="w-full max-w-xl">
                {/* Progress dots */}
                <div className="mb-8 flex justify-center gap-2">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-1.5 rounded-full transition-all duration-300',
                                i === currentStep
                                    ? 'w-8 bg-[var(--color-accent)]'
                                    : i < currentStep
                                        ? 'w-1.5 bg-[var(--color-accent)]/50'
                                        : 'w-1.5 bg-[var(--color-border)]'
                            )}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait" custom={direction}>
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
                                <StepIcon className="h-5 w-5 text-[var(--color-accent)]" />
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
                </AnimatePresence>

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goBack}
                        disabled={currentStep === 0}
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
                            disabled={isSending}
                            className="gap-1.5"
                        >
                            {isSending ? (
                                <>
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Building roadmap...
                                </>
                            ) : isLastStep ? (
                                <>
                                    Generate Roadmap
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
                </div>
            </div>
        </div>
    );
}
