import { motion } from 'framer-motion';

export function MentaraHeroIllustration() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[680px]"
        >
            <motion.div
                className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_25%,rgba(211,106,58,0.18),transparent_28%),radial-gradient(circle_at_78%_22%,rgba(42,111,101,0.16),transparent_26%),radial-gradient(circle_at_48%_78%,rgba(240,215,190,0.5),transparent_35%)] blur-3xl"
                animate={{ scale: [1, 1.03, 1], opacity: [0.82, 1, 0.82] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="rounded-[36px] border border-[#D9CDC2] bg-[linear-gradient(180deg,rgba(255,252,248,0.97),rgba(246,238,229,0.94))] p-5 shadow-[0_28px_90px_rgba(42,28,21,0.12)]">
                <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="rounded-[28px] border border-[#E4D8CD] bg-white/90 p-4 shadow-[0_12px_30px_rgba(42,28,21,0.06)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.24em] text-[#90796C]">Live Teaching Workspace</p>
                                <h3 className="mt-2 text-xl font-semibold text-[#201813]" style={{ fontFamily: 'var(--font-heading)' }}>Mentara</h3>
                            </div>
                            <div className="rounded-full border border-[#E8DDD4] bg-[#FFF6EF] px-3 py-1 text-xs font-medium text-[#D36A3A]">Teaching</div>
                        </div>

                        <svg viewBox="0 0 560 350" className="mt-5 w-full overflow-visible rounded-[24px] bg-[#FCF7F1] p-3">
                            <motion.rect x="18" y="22" width="150" height="84" rx="22" fill="#FFFDF9" stroke="#E4D8CD" initial={{ opacity: 0.7 }} animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 4.5, repeat: Infinity }} />
                            <motion.rect x="198" y="22" width="164" height="84" rx="22" fill="#FFF3EA" stroke="#D36A3A" initial={{ opacity: 0.8 }} animate={{ opacity: [0.85, 1, 0.85] }} transition={{ duration: 3.8, repeat: Infinity }} />
                            <motion.rect x="392" y="22" width="150" height="84" rx="22" fill="#FFFDF9" stroke="#E4D8CD" initial={{ opacity: 0.7 }} animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 4.5, repeat: Infinity, delay: 0.6 }} />

                            <motion.rect x="80" y="154" width="180" height="88" rx="24" fill="#FFFDF9" stroke="#E4D8CD" initial={{ y: 0 }} animate={{ y: [0, -3, 0] }} transition={{ duration: 6.5, repeat: Infinity }} />
                            <motion.rect x="304" y="154" width="176" height="88" rx="24" fill="#201813" stroke="#201813" initial={{ y: 0 }} animate={{ y: [0, 3, 0] }} transition={{ duration: 6.5, repeat: Infinity, delay: 0.7 }} />

                            <motion.path d="M168 64 C188 64 194 64 198 64" stroke="#D36A3A" strokeWidth="2.5" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, delay: 0.2 }} />
                            <motion.path d="M362 64 C378 64 382 64 392 64" stroke="#D36A3A" strokeWidth="2.5" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, delay: 0.5 }} />
                            <motion.path d="M280 106 C280 126 220 136 170 154" stroke="#D36A3A" strokeWidth="2.5" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.8 }} />
                            <motion.path d="M280 106 C280 126 360 138 392 154" stroke="#D36A3A" strokeWidth="2.5" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 1.05 }} />

                            <text x="40" y="50" fill="#8A7467" fontSize="12" letterSpacing="3">GOAL</text>
                            <text x="60" y="74" fill="#211915" fontSize="20" fontWeight="600">Learn RAG</text>

                            <text x="223" y="50" fill="#A15D3D" fontSize="12" letterSpacing="3">ROADMAP</text>
                            <text x="223" y="74" fill="#211915" fontSize="20" fontWeight="700">Teach in sequence</text>

                            <text x="420" y="50" fill="#8A7467" fontSize="12" letterSpacing="3">REVISION</text>
                            <text x="430" y="74" fill="#211915" fontSize="20" fontWeight="600">Keep memory</text>

                            <text x="108" y="184" fill="#8A7467" fontSize="12" letterSpacing="3">TUTOR</text>
                            <text x="108" y="208" fill="#211915" fontSize="18" fontWeight="700">Explain ? Ask ? Adapt</text>
                            <text x="108" y="230" fill="#6C5B52" fontSize="13">Structured teaching instead of prompt drift.</text>

                            <text x="332" y="184" fill="#F0C7AE" fontSize="12" letterSpacing="3">NOTETAKER</text>
                            <text x="332" y="208" fill="#FFF9F5" fontSize="18" fontWeight="700">Capture durable notes</text>
                            <text x="332" y="230" fill="#F3D7C7" fontSize="13">Reusable study packet and review prompts.</text>
                        </svg>
                    </div>

                    <div className="space-y-4">
                        <motion.div className="rounded-[28px] border border-[#E4D8CD] bg-white/88 p-4 shadow-[0_10px_28px_rgba(42,28,21,0.06)]" animate={{ y: [0, 4, 0] }} transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }}>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A7467]">How It Runs</p>
                            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5F4F46]">
                                <li>Lock roadmap before teaching starts.</li>
                                <li>Use artifacts when they clarify, not as decoration.</li>
                                <li>Preserve notes and weak concepts after class.</li>
                            </ul>
                        </motion.div>
                        <motion.div className="rounded-[28px] border border-[#D9D0C7] bg-[linear-gradient(160deg,#D36A3A_0%,#2F2420_120%)] p-4 text-white shadow-[0_16px_40px_rgba(42,28,21,0.16)]" animate={{ y: [0, -4, 0] }} transition={{ duration: 7.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-white/65">BYOK Ready</p>
                            <p className="mt-3 text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Use Mentara with your own OpenRouter key.</p>
                            <p className="mt-3 text-sm leading-6 text-white/80">Good for paid beta users, consultants, or teams who want their own model billing boundary.</p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
