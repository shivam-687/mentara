// ── Mentara Landing Page ──
// Anthropic-inspired premium design with animated illustrations, waitlist, and SEO.

import { useState, useEffect, useRef } from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Sparkles, Brain, BookOpen, BarChart3, ChevronRight, Check, ArrowRight, Zap, Play, Layout, Award } from 'lucide-react';

// ── Advanced Animated SVG: Knowledge Neural Network ──
function AdvancedNeuralAnimation() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hoveredNode, setHoveredNode] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x, y });
    };

    const nodes = [
        { id: 0, x: 120, y: 100, r: 20, label: 'Learn', desc: 'Ingest new concepts', delay: 0 },
        { id: 1, x: 300, y: 80, r: 24, label: 'Understand', desc: 'Connect base ideas', delay: 0.3 },
        { id: 2, x: 250, y: 200, r: 18, label: 'Practice', desc: 'Apply knowledge', delay: 0.6 },
        { id: 3, x: 180, y: 280, r: 16, label: 'Review', desc: 'Spaced repetition', delay: 0.9 },
        { id: 4, x: 400, y: 200, r: 22, label: 'Master', desc: 'Deep comprehension', delay: 1.2 },
        { id: 5, x: 480, y: 120, r: 26, label: 'Create', desc: 'Generate new ideas', delay: 1.5 },
        { id: 6, x: 350, y: 310, r: 17, label: 'Connect', desc: 'Synthesize topics', delay: 1.8 },
        { id: 7, x: 500, y: 300, r: 20, label: 'Grow', desc: 'Expand horizons', delay: 2.1 },
    ];

    const lines = [
        [120, 100, 300, 80], [120, 100, 250, 200], [120, 100, 180, 280],
        [300, 80, 480, 120], [300, 80, 400, 200],
        [250, 200, 400, 200], [250, 200, 350, 310],
        [180, 280, 350, 310], [400, 200, 480, 120],
        [400, 200, 500, 300], [350, 310, 500, 300],
        [480, 120, 500, 300],
    ];

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
            className="relative w-full aspect-[3/2] flex items-center justify-center cursor-crosshair"
        >
            {/* Interactive Tooltip */}
            <AnimatePresence>
                {hoveredNode !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute z-10 bg-white/90 backdrop-blur-md border border-[#E5E2DC] shadow-xl rounded-xl p-3 pointer-events-none"
                        style={{
                            left: `calc(${(nodes[hoveredNode].x / 600) * 100}% - 60px)`,
                            top: `calc(${(nodes[hoveredNode].y / 400) * 100}% - 70px)`,
                            width: 140
                        }}
                    >
                        <p className="text-sm font-bold text-[#1A1A1A]">{nodes[hoveredNode].label}</p>
                        <p className="text-xs text-[#6B6B6B] leading-tight mt-1">{nodes[hoveredNode].desc}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.svg
                viewBox="0 0 600 400"
                className="w-full h-full overflow-visible"
                animate={{
                    x: mousePos.x * -20,
                    y: mousePos.y * -20,
                }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            >
                <defs>
                    <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C96442" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#E8A87C" stopOpacity="0.7" />
                    </linearGradient>
                    <linearGradient id="nodeGradHover" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1A1A1A" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#4A4A4A" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#C96442" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#C96442" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#C96442" stopOpacity="0.2" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <radialGradient id="pulseGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#C96442" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#C96442" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Connection lines */}
                {lines.map(([x1, y1, x2, y2], i) => (
                    <g key={`line-${i}`}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#lineGrad)" strokeWidth="1.5" />

                        {/* Data Particles */}
                        <circle r="3" fill="#C96442" filter="url(#glow)">
                            <animateMotion
                                path={`M${x1},${y1} L${x2},${y2}`}
                                dur={`${2 + (i % 3)}s`}
                                repeatCount="indefinite"
                                begin={`${i * 0.3}s`}
                            />
                            <animate attributeName="opacity" values="0;1;0" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
                        </circle>
                    </g>
                ))}

                {/* Nodes */}
                {nodes.map((node) => {
                    const isHovered = hoveredNode === node.id;
                    return (
                        <g
                            key={`node-${node.id}`}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            className="cursor-pointer transition-all duration-300 pointer-events-auto"
                        >
                            {/* Pulse ring (only visible if not hovered to reduce noise, or always visible) */}
                            {!isHovered && (
                                <circle cx={node.x} cy={node.y} r={node.r + 12} fill="url(#pulseGrad)">
                                    <animate attributeName="r" values={`${node.r + 5};${node.r + 18};${node.r + 5}`} dur="3s" repeatCount="indefinite" begin={`${node.delay}s`} />
                                    <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" begin={`${node.delay}s`} />
                                </circle>
                            )}

                            {/* Hover Halo */}
                            {isHovered && (
                                <circle cx={node.x} cy={node.y} r={node.r + 8} fill="#C96442" opacity="0.15" filter="url(#glow)" />
                            )}

                            {/* Main node */}
                            <motion.circle
                                cx={node.x}
                                cy={node.y}
                                r={isHovered ? node.r + 4 : node.r}
                                fill={isHovered ? "url(#nodeGradHover)" : "url(#nodeGrad)"}
                                filter="url(#glow)"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: node.delay, duration: 0.6 }}
                            />

                            {/* Label */}
                            <motion.text
                                x={node.x}
                                y={node.y + node.r + 18}
                                textAnchor="middle"
                                fill={isHovered ? "#1A1A1A" : "#6B6B6B"}
                                fontSize={isHovered ? "12" : "11"}
                                fontFamily="Inter, sans-serif"
                                fontWeight={isHovered ? "700" : "500"}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: node.delay + 0.3 }}
                                className="pointer-events-none transition-all duration-200"
                            >
                                {node.label}
                            </motion.text>
                        </g>
                    );
                })}

                {/* Background Decor */}
                <g transform="translate(280, 170)" opacity="0.03">
                    <path d="M20 0C8.96 0 0 8.96 0 20s8.96 20 20 20 20-8.96 20-20S31.04 0 20 0zm0 36c-8.84 0-16-7.16-16-16S11.16 4 20 4s16 7.16 16 16-7.16 16-16 16z" fill="#1A1A1A" />
                </g>
            </motion.svg>
        </div>
    );
}

// ── Scroll-reveal hook ──
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return { ref, visible };
}

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    const { ref, visible } = useReveal();
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
            }}
        >
            {children}
        </div>
    );
}

// ── Waitlist Form ──
function WaitlistForm({ variant = 'hero' }: { variant?: 'hero' | 'cta' }) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name }),
            });
            const data = await res.json();
            if (data.success) {
                setStatus('success');
                setMessage(data.message || "You're on the list!");
            } else {
                setStatus('error');
                setMessage(data.error || 'Something went wrong.');
            }
        } catch {
            setStatus('error');
            setMessage('Connection failed. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl ${variant === 'hero' ? 'bg-[#E6F4EC]' : 'bg-white/10 backdrop-blur'}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B8A5A]">
                    <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className={`font-semibold ${variant === 'hero' ? 'text-[#1A1A1A]' : 'text-white'}`}>{message}</p>
                    <p className={`text-sm ${variant === 'hero' ? 'text-[#3B8A5A]' : 'text-white/70'}`}>We'll notify you when Mentara launches.</p>
                </div>
            </div>
        );
    }

    const isHero = variant === 'hero';

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className={`flex flex-col sm:flex-row gap-3 ${isHero ? '' : ''}`}>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className={`px-4 py-3 rounded-xl text-sm outline-none border transition-all ${isHero
                        ? 'border-[#E5E2DC] bg-white focus:border-[#C96442] focus:shadow-[0_0_0_3px_rgba(201,100,66,0.1)]'
                        : 'border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/40 backdrop-blur'
                        }`}
                />
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className={`px-4 py-3 rounded-xl text-sm outline-none border transition-all flex-1 ${isHero
                        ? 'border-[#E5E2DC] bg-white focus:border-[#C96442] focus:shadow-[0_0_0_3px_rgba(201,100,66,0.1)]'
                        : 'border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/40 backdrop-blur'
                        }`}
                />
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isHero
                        ? 'bg-[#1A1A1A] text-white hover:bg-[#333] shadow-lg hover:shadow-xl disabled:opacity-60'
                        : 'bg-white text-[#1A1A1A] hover:bg-white/90 shadow-lg disabled:opacity-60'
                        }`}
                >
                    {status === 'loading' ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <>Join Waitlist <ArrowRight className="h-4 w-4" /></>
                    )}
                </button>
            </div>
            {status === 'error' && <p className="text-sm text-[#C94242]">{message}</p>}
        </form>
    );
}

// ── Main Landing Page ──
export default function LandingPage() {
    useEffect(() => {
        document.title = 'Mentara — AI-Powered Adaptive Learning That Truly Understands You';
        // Set meta description
        let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.appendChild(meta);
        }
        meta.content = 'Mentara is an intelligent learning system that adapts to your pace, creates visual explanations, and helps you master any topic through personalized AI tutoring with interactive diagrams, assessments, and spaced repetition.';
    }, []);

    return (
        <div className="min-h-screen bg-[#F5F2ED]" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {/* ── Navigation ── */}
            <nav className="sticky top-0 z-50 border-b border-[#E5E2DC]/60 bg-[#F5F2ED]/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C96442]">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            Mentara
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="#features" className="hidden sm:block text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Features</a>
                        <a href="#how-it-works" className="hidden sm:block text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">How It Works</a>
                        <SignInButton mode="modal">
                            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors shadow-sm">
                                Sign In
                            </button>
                        </SignInButton>
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <section className="relative overflow-hidden">
                {/* Subtle gradient orbs */}
                <div className="absolute top-20 -left-40 w-96 h-96 rounded-full bg-[#C96442]/5 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#E8D5CC]/40 blur-3xl" />

                <div className="mx-auto max-w-6xl px-6 pt-20 pb-16">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Copy */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5E6DF] text-[#C96442] text-xs font-semibold mb-6">
                                <Sparkles className="h-3.5 w-3.5" />
                                AI-Powered Adaptive Learning
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                                Learn anything, <br />
                                <span className="relative">
                                    <span className="relative z-10">deeply understood</span>
                                    <span className="absolute bottom-1 left-0 w-full h-3 bg-[#C96442]/15 rounded-sm -z-0" />
                                </span>
                            </h1>
                            <p className="text-lg text-[#6B6B6B] leading-relaxed mb-8 max-w-lg">
                                Mentara is an AI tutor that adapts to how you think. It creates personalized roadmaps,
                                teaches with interactive visual content, and verifies your understanding at every step —
                                like having a brilliant private tutor available 24/7.
                            </p>
                            <WaitlistForm variant="hero" />
                            <p className="mt-3 text-xs text-[#9B9B9B]">
                                Join 2,400+ learners on the waitlist. No spam, ever.
                            </p>
                        </div>

                        {/* Right: Animated interactive demo */}
                        <div className="relative hidden lg:block">
                            <AdvancedNeuralAnimation />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Social Proof Bar ── */}
            <section className="border-y border-[#E5E2DC] bg-white/50">
                <div className="mx-auto max-w-6xl px-6 py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: '10x', label: 'Faster comprehension' },
                            { value: '94%', label: 'Material retention' },
                            { value: '50+', label: 'Visual artifact types' },
                            { value: '24/7', label: 'Available anytime' },
                        ].map((stat, i) => (
                            <RevealSection key={i} delay={i * 0.1}>
                                <p className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>{stat.value}</p>
                                <p className="text-sm text-[#6B6B6B] mt-1">{stat.label}</p>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features Section ── */}
            <section id="features" className="py-24">
                <div className="mx-auto max-w-6xl px-6">
                    <RevealSection className="text-center mb-16">
                        <p className="text-sm font-semibold text-[#C96442] uppercase tracking-widest mb-3">Why Mentara</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Learning that adapts to you
                        </h2>
                        <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
                            Unlike static courses or generic chatbots, Mentara builds a living understanding of your knowledge gaps and learning style.
                        </p>
                    </RevealSection>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Brain,
                                title: 'Adaptive Intelligence',
                                description: 'Your AI tutor adjusts difficulty, pacing, and teaching style based on your responses. Struggling? It breaks concepts down. Excelling? It challenges you further.',
                                gradient: 'from-[#C96442]/10 to-[#E8D5CC]/20',
                            },
                            {
                                icon: Sparkles,
                                title: 'Visual Learning Artifacts',
                                description: 'Concepts come alive through interactive diagrams, mind maps, comparison tables, step-by-step animations, and infographics — generated in real-time.',
                                gradient: 'from-[#3B8A5A]/10 to-[#E6F4EC]/20',
                            },
                            {
                                icon: BarChart3,
                                title: 'Mastery Tracking',
                                description: 'Every answer is tracked with spaced repetition scheduling. Flashcards, mini-tests, and comprehensive assessments ensure you actually retain what you learn.',
                                gradient: 'from-[#C9892A]/10 to-[#FFF4E5]/20',
                            },
                        ].map((feature, i) => (
                            <RevealSection key={i} delay={i * 0.15}>
                                <div className={`p-8 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-[#E5E2DC]/50 h-full group hover:shadow-lg transition-shadow duration-300`}>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm mb-5">
                                        <feature.icon className="h-6 w-6 text-[#C96442]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{feature.title}</h3>
                                    <p className="text-sm text-[#6B6B6B] leading-relaxed">{feature.description}</p>
                                </div>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section id="how-it-works" className="py-24 bg-white">
                <div className="mx-auto max-w-6xl px-6">
                    <RevealSection className="text-center mb-16">
                        <p className="text-sm font-semibold text-[#C96442] uppercase tracking-widest mb-3">How It Works</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                            From curiosity to mastery in four steps
                        </h2>
                    </RevealSection>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { step: '01', title: 'Tell us what to learn', desc: 'Describe any topic — from "teach me React" to "advanced quantum mechanics."', icon: BookOpen },
                            { step: '02', title: 'Get a custom roadmap', desc: 'AI creates a structured module-by-module learning path tailored to your level.', icon: Zap },
                            { step: '03', title: 'Learn with rich visuals', desc: 'Interactive diagrams, code examples, flashcards, and assessments guide your journey.', icon: Sparkles },
                            { step: '04', title: 'Achieve real mastery', desc: 'Spaced repetition and adaptive testing ensure you retain everything long-term.', icon: Award },
                        ].map((item, i) => (
                            <RevealSection key={i} delay={i * 0.12}>
                                <div className="relative p-6 rounded-2xl border border-[#E5E2DC] hover:border-[#C96442]/30 transition-colors group">
                                    <span className="text-5xl font-bold text-[#E5E2DC] group-hover:text-[#C96442]/20 transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {item.step}
                                    </span>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5E6DF] mt-4 mb-3">
                                        <item.icon className="h-5 w-5 text-[#C96442]" />
                                    </div>
                                    <h3 className="font-semibold text-[#1A1A1A] mb-1">{item.title}</h3>
                                    <p className="text-sm text-[#6B6B6B] leading-relaxed">{item.desc}</p>
                                </div>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Video Demo Section ── */}
            <section className="py-24 bg-[#1A1A1A] relative overflow-hidden">
                <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#C96442]/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-[#E8A87C]/10 blur-3xl pointer-events-none" />

                <div className="mx-auto max-w-5xl px-6 relative z-10">
                    <RevealSection className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                            See Mentara in action
                        </h2>
                        <p className="text-lg text-[#9B9B9B] max-w-2xl mx-auto">
                            Watch how our AI tutor adapts to your learning pace in real-time.
                        </p>
                    </RevealSection>

                    <RevealSection delay={0.2}>
                        <div className="relative w-full aspect-video bg-[#0A0A0A] rounded-2xl sm:rounded-3xl border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden group cursor-pointer">
                            {/* Static placeholder representing a video thumbnail */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex flex-col items-center justify-center p-8">
                                <div className="w-full h-full border border-white/5 rounded-xl bg-white/5 relative overflow-hidden backdrop-blur-sm">
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
                                    <div className="absolute top-4 left-4 right-4 flex gap-4 opacity-30">
                                        <div className="w-48 h-4 rounded bg-white" />
                                        <div className="w-16 h-4 rounded bg-white ml-auto" />
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 opacity-30 flex justify-between">
                                        <div className="w-1/3 h-24 rounded bg-white" />
                                        <div className="w-1/2 h-48 rounded bg-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Play button overlay */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center backdrop-blur-[2px] group-hover:backdrop-blur-sm">
                                <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md transform group-hover:scale-110 transition-transform shadow-2xl">
                                    <div className="w-16 h-16 rounded-full bg-[#C96442] flex items-center justify-center text-white pl-1">
                                        <Play className="w-8 h-8 fill-current" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealSection>
                </div>
            </section>

            {/* ── Feature Deep Dive ── */}
            <section className="py-24">
                <div className="mx-auto max-w-6xl px-6">
                    {[
                        {
                            title: 'Interactive Visual Teaching',
                            desc: 'Mentara doesn\'t just explain — it shows. Every concept comes with auto-generated diagrams, mind maps, step-by-step animations, and comparison tables. Complex topics become intuitive through visual storytelling.',
                            features: ['Mind maps & flowcharts', 'Step-by-step animations', 'Comparison tables', 'Infographics & stat cards'],
                            align: 'left' as const,
                        },
                        {
                            title: 'Assessments That Actually Help',
                            desc: 'Forget passive quizzes. Mentara uses multi-question timed tests, interactive flashcard decks with spaced repetition, and real-time difficulty adaptation. Your weak spots get more attention, your strengths get celebrated.',
                            features: ['Timed assessments', 'Spaced repetition', 'Adaptive difficulty', 'Progress analytics'],
                            align: 'right' as const,
                        },
                    ].map((block, i) => (
                        <RevealSection key={i} className={`flex flex-col ${block.align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center mb-24 last:mb-0`}>
                            {/* Text */}
                            <div className="flex-1">
                                <h3 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {block.title}
                                </h3>
                                <p className="text-[#6B6B6B] leading-relaxed mb-6">{block.desc}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {block.features.map((f, j) => (
                                        <div key={j} className="flex items-center gap-2 text-sm">
                                            <div className="h-5 w-5 rounded-full bg-[#E6F4EC] flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3 text-[#3B8A5A]" />
                                            </div>
                                            <span className="text-[#1A1A1A]">{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Visual placeholder */}
                            <div className="flex-1">
                                <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${i === 0 ? 'from-[#F5E6DF] to-[#EDE9E3]' : 'from-[#E6F4EC] to-[#EDE9E3]'} border border-[#E5E2DC] flex items-center justify-center`}>
                                    <div className="text-center p-8">
                                        <div className="flex justify-center gap-4 mb-4">
                                            {i === 0 ? (
                                                <>
                                                    <div className="w-16 h-16 rounded-xl bg-white shadow-md flex items-center justify-center">
                                                        <Brain className="h-8 w-8 text-[#C96442]" />
                                                    </div>
                                                    <div className="w-12 h-12 rounded-lg bg-white shadow-md flex items-center justify-center self-end">
                                                        <ChevronRight className="h-6 w-6 text-[#C96442]" />
                                                    </div>
                                                    <div className="w-16 h-16 rounded-xl bg-white shadow-md flex items-center justify-center">
                                                        <Sparkles className="h-8 w-8 text-[#3B8A5A]" />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex flex-col gap-2">
                                                        {[85, 92, 67, 100].map((v, k) => (
                                                            <div key={k} className="flex items-center gap-2">
                                                                <div className="w-24 h-2.5 rounded-full bg-white overflow-hidden">
                                                                    <div className="h-full rounded-full bg-[#3B8A5A] transition-all" style={{ width: `${v}%` }} />
                                                                </div>
                                                                <span className="text-[10px] text-[#6B6B6B] tabular-nums w-8">{v}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#9B9B9B]">
                                            {i === 0 ? 'AI-generated visual explanations' : 'Real-time mastery tracking'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </RevealSection>
                    ))}
                </div>
            </section>

            {/* ── CTA Section ── */}
            <section className="py-24">
                <div className="mx-auto max-w-6xl px-6">
                    <RevealSection>
                        <div className="relative overflow-hidden rounded-3xl bg-[#1A1A1A] px-8 sm:px-16 py-16 text-center">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#C96442]/10 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-[#C96442]/5 blur-3xl" />

                            <div className="relative z-10 max-w-xl mx-auto">
                                <div className="flex justify-center mb-6">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                                        <GraduationCap className="h-7 w-7 text-[#E8A87C]" />
                                    </div>
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Ready to learn differently?
                                </h2>
                                <p className="text-[#9B9B9B] mb-8 text-lg">
                                    Join thousands of learners who are discovering a better way to master any subject. Get early access when we launch.
                                </p>
                                <WaitlistForm variant="cta" />
                            </div>
                        </div>
                    </RevealSection>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-[#E5E2DC] bg-[#F5F2ED] py-12">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C96442]">
                                <GraduationCap className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Mentara
                            </span>
                        </div>
                        <p className="text-sm text-[#9B9B9B]">
                            © 2026 Mentara. Building the future of personalized learning.
                        </p>
                        <div className="flex items-center gap-6 text-sm text-[#6B6B6B]">
                            <a href="#" className="hover:text-[#1A1A1A] transition-colors">Privacy</a>
                            <a href="#" className="hover:text-[#1A1A1A] transition-colors">Terms</a>
                            <a href="mailto:hello@mentara.ai" className="hover:text-[#1A1A1A] transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
