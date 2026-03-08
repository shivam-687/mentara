import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Brain, Compass, NotebookPen, Sparkles, Wand2, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MentaraLogo } from '@/components/brand/mentara-logo';
import { MentaraHeroIllustration } from '@/components/brand/mentara-hero-illustration';
import { api } from '@/lib/api';

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D9D0C7] bg-white/85 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#7A685D] backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-[#D36A3A]" />
            {children}
        </div>
    );
}

function MetricChip({ label }: { label: string }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="rounded-full border border-[#DDD4CB] bg-white/75 px-3 py-2 text-sm text-[#6D5D54] backdrop-blur-sm"
        >
            {label}
        </motion.div>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="rounded-[28px] border border-[#DDD4CB] bg-white/88 p-5 shadow-[0_18px_60px_rgba(44,31,24,0.07)]"
        >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4E1D7] text-[#D36A3A]">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-[#201813]" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#6D5D54]">{description}</p>
        </motion.div>
    );
}

function HowStep({
    index,
    title,
    description,
}: {
    index: string;
    title: string;
    description: string;
}) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="rounded-[28px] border border-[#DDD4CB] bg-[#FFFDF9] p-5 shadow-[0_12px_36px_rgba(44,31,24,0.05)]"
        >
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D36A3A]">{index}</div>
            <h3 className="mt-3 text-lg font-semibold text-[#201813]" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#6D5D54]">{description}</p>
        </motion.div>
    );
}

export default function LandingPage() {
    const [waitlistName, setWaitlistName] = useState('');
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistMessage, setWaitlistMessage] = useState('');
    const [waitlistBusy, setWaitlistBusy] = useState(false);

    const handleJoinWaitlist = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!waitlistEmail.trim()) return;

        setWaitlistBusy(true);
        setWaitlistMessage('');
        try {
            const result = await api.joinWaitlist({
                name: waitlistName.trim() || undefined,
                email: waitlistEmail.trim(),
            });
            setWaitlistMessage(result.message);
            setWaitlistEmail('');
            setWaitlistName('');
        } catch (error) {
            setWaitlistMessage('Could not join the waitlist right now.');
        } finally {
            setWaitlistBusy(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-[80rem] space-y-16 overflow-x-clip pb-20">
            <section className="relative overflow-hidden rounded-[40px] border border-[#DDD4CB] bg-[linear-gradient(180deg,#FFF9F4_0%,#F7EEE6_100%)] px-6 py-10 shadow-[0_24px_80px_rgba(44,31,24,0.08)] sm:px-8 lg:px-12 lg:py-14">
                <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(211,106,58,0.18),transparent_55%)]" />
                <motion.div
                    className="absolute -left-16 top-14 h-32 w-32 rounded-full bg-[#E8B89A]/25 blur-3xl"
                    animate={{ x: [0, 14, 0], y: [0, -10, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute right-8 top-8 h-24 w-24 rounded-full bg-[#D36A3A]/10 blur-3xl"
                    animate={{ x: [0, -12, 0], y: [0, 14, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                />

                <div className="relative grid items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
                    <div>
                        <MentaraLogo animated className="mb-5" />
                        <SectionLabel>AI Tutor Product Beta</SectionLabel>
                        <motion.h1
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.05 }}
                            className="mt-6 max-w-3xl text-5xl leading-[0.95] tracking-tight text-[#1F1712] sm:text-6xl xl:text-7xl"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            Structured teaching with memory.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.12 }}
                            className="mt-5 max-w-xl text-base leading-8 text-[#64534A] sm:text-lg"
                        >
                            Mentara builds a roadmap, teaches in sequence, checks understanding, keeps revision memory, and turns classes into reusable notes.
                        </motion.p>

                        <motion.form
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.18 }}
                            onSubmit={handleJoinWaitlist}
                            className="mt-8 rounded-[28px] border border-[#DDD4CB] bg-white/82 p-4 shadow-[0_14px_40px_rgba(44,31,24,0.06)] backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A7467]">
                                <Sparkles className="h-3.5 w-3.5 text-[#D36A3A]" />
                                Join The Waitlist
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                                <Input
                                    value={waitlistName}
                                    onChange={e => setWaitlistName(e.target.value)}
                                    placeholder="Your name"
                                    className="h-11 bg-white/80"
                                />
                                <Input
                                    value={waitlistEmail}
                                    onChange={e => setWaitlistEmail(e.target.value)}
                                    placeholder="Email address"
                                    type="email"
                                    className="h-11 bg-white/80"
                                />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-3">
                                <Button type="submit" size="lg" className="rounded-full px-6" disabled={waitlistBusy || !waitlistEmail.trim()}>
                                    {waitlistBusy ? 'Joining...' : 'Request Beta Access'}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                                <SignedOut>
                                    <SignInButton mode="modal">
                                        <Button size="lg" variant="outline" className="rounded-full px-6">
                                            Sign In Instead
                                        </Button>
                                    </SignInButton>
                                </SignedOut>
                                <SignedIn>
                                    <Link to="/create">
                                        <Button size="lg" variant="outline" className="rounded-full px-6">
                                            Open App
                                        </Button>
                                    </Link>
                                </SignedIn>
                            </div>
                            {waitlistMessage ? (
                                <p className="mt-3 text-sm text-[#6A5A51]">{waitlistMessage}</p>
                            ) : (
                                <p className="mt-3 text-sm text-[#6A5A51]">Best for early users who want roadmap-driven AI teaching, notes, and BYOK OpenRouter support.</p>
                            )}
                        </motion.form>

                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.24 }}
                            className="mt-7 flex flex-wrap gap-3"
                        >
                            <MetricChip label="Roadmap-first teaching" />
                            <MetricChip label="Running notes" />
                            <MetricChip label="Revision memory" />
                            <MetricChip label="BYOK OpenRouter" />
                        </motion.div>
                    </div>

                    <MentaraHeroIllustration />
                </div>
            </section>

            <section id="product-story" className="space-y-7">
                <div className="max-w-3xl">
                    <SectionLabel>Why It Can Be A Product</SectionLabel>
                    <h2 className="mt-5 text-3xl text-[#201813] sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
                        Mentara is strongest when it behaves like a class product, not a generic AI wrapper.
                    </h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <FeatureCard icon={Compass} title="Roadmap Before Teaching" description="Every class starts with structure, so the tutor can teach in sequence instead of improvising from prompt to prompt." />
                    <FeatureCard icon={Brain} title="Adaptive Tutor" description="The tutor explains, checks understanding, and uses artifacts when they clarify the idea." />
                    <FeatureCard icon={NotebookPen} title="NoteTaker Companion" description="A second memory surface captures study notes, glossary items, and next-step prompts while the class is running." />
                    <FeatureCard icon={KeyRound} title="BYOK OpenRouter" description="Early users can bring their own OpenRouter key and run Mentara on their own model budget." />
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-[36px] border border-[#DDD4CB] bg-[#201813] p-8 text-white shadow-[0_20px_70px_rgba(42,28,21,0.16)]">
                    <SectionLabel>How To Use</SectionLabel>
                    <h2 className="mt-5 text-3xl sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
                        Four steps. One durable learning workspace.
                    </h2>
                    <div className="mt-6 space-y-4 text-sm leading-7 text-white/78">
                        <p>Choose a goal, lock the roadmap, learn subtopic by subtopic, and keep the resulting notes and revision memory after the class ends.</p>
                        <div className="rounded-[24px] border border-white/12 bg-white/8 p-4">
                            <p className="font-semibold text-white">Who it is for</p>
                            <p className="mt-2 text-white/72">Interview prep, technical upskilling, AI systems learning, and any topic where sequence and revision matter more than pure chat.</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <HowStep index="01" title="Set the goal" description="Choose the topic, experience level, and depth. Mentara uses that to generate a real class structure." />
                    <HowStep index="02" title="Lock the roadmap" description="Freeze the class plan before teaching starts, so the first lesson is deterministic instead of agent noise." />
                    <HowStep index="03" title="Learn with artifacts" description="The tutor explains, asks checks for understanding, and uses diagrams, mind maps, or code only when they help." />
                    <HowStep index="04" title="Keep the memory" description="Open running notes during the class, then revisit the completion dossier, revision stats, and weak concepts later." />
                </div>
            </section>

            <section className="rounded-[36px] border border-[#DDD4CB] bg-[linear-gradient(180deg,#FFFDF9_0%,#F6EDE4_100%)] p-8 shadow-[0_18px_70px_rgba(44,31,24,0.06)] lg:p-10">
                <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                    <div>
                        <SectionLabel>Launch Posture</SectionLabel>
                        <h2 className="mt-5 text-3xl text-[#201813] sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
                            Launch it as a focused beta, not a broad AI tutor for everyone.
                        </h2>
                        <p className="mt-5 text-base leading-8 text-[#64534A]">
                            The clearest path is a narrow product for technical learning, interview prep, or AI systems education. That is where roadmap, notes, and revision memory become paid value instead of decoration.
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            { label: 'Waitlist for beta users and early design partners', icon: CheckCircle2 },
                            { label: 'BYOK support for users who want their own model budget', icon: KeyRound },
                            { label: 'Structured how-to-use flow instead of vague startup copy', icon: Wand2 },
                            { label: 'Motion graphic hero that demonstrates the product behavior', icon: BookOpen },
                        ].map(({ label, icon: Icon }) => (
                            <motion.div
                                key={label}
                                whileHover={{ y: -4, scale: 1.01 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="rounded-[26px] border border-[#DDD4CB] bg-white p-5"
                            >
                                <Icon className="h-5 w-5 text-[#D36A3A]" />
                                <p className="mt-3 text-sm leading-6 text-[#5F4F46]">{label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
