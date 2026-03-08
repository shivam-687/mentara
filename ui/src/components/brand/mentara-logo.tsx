import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MentaraLogoProps {
    className?: string;
    iconClassName?: string;
    labelClassName?: string;
    animated?: boolean;
    compact?: boolean;
}

export function MentaraLogo({
    className,
    iconClassName,
    labelClassName,
    animated = false,
    compact = false,
}: MentaraLogoProps) {
    const Wrapper = animated ? motion.div : 'div';
    const wrapperProps = animated
        ? {
            initial: { opacity: 0, y: 6 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
        }
        : {};

    return (
        <Wrapper
            {...wrapperProps}
            className={cn('flex items-center gap-3', className)}
        >
            <motion.div
                className={cn(
                    'relative flex items-center justify-center overflow-hidden rounded-[18px] border border-[#E0D2C8] bg-[linear-gradient(160deg,#FFF8F1_0%,#F2D3C1_48%,#C85D31_100%)] shadow-[0_10px_30px_rgba(72,44,31,0.12)]',
                    compact ? 'h-9 w-9' : 'h-11 w-11',
                    iconClassName,
                )}
                animate={animated ? { rotate: [0, 1.8, 0] } : undefined}
                transition={animated ? { duration: 7, repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
                <motion.div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.85),transparent_35%)]"
                    animate={animated ? { opacity: [0.7, 1, 0.7] } : undefined}
                    transition={animated ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : undefined}
                />
                <svg
                    viewBox="0 0 64 64"
                    className={cn('relative z-10', compact ? 'h-6 w-6' : 'h-7 w-7')}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path
                        d="M15 22.5C15 19.4624 17.4624 17 20.5 17H30.5C34.6421 17 38 20.3579 38 24.5V42.5H22C18.134 42.5 15 39.366 15 35.5V22.5Z"
                        fill="#FFF8F2"
                    />
                    <path
                        d="M49 22.5C49 19.4624 46.5376 17 43.5 17H33.5C29.3579 17 26 20.3579 26 24.5V42.5H42C45.866 42.5 49 39.366 49 35.5V22.5Z"
                        fill="#2A1A15"
                    />
                    <path
                        d="M22 25.5H30"
                        stroke="#D36A3A"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    />
                    <path
                        d="M22 31H30"
                        stroke="#D36A3A"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    />
                    <path
                        d="M33.5 24L43 33.5"
                        stroke="#F7D4C2"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    />
                    <path
                        d="M43 24L33.5 33.5"
                        stroke="#F7D4C2"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    />
                    <path
                        d="M32 14V48"
                        stroke="#E9B79C"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        opacity="0.9"
                    />
                    <circle cx="46.5" cy="15.5" r="3.5" fill="#FFF4EB" />
                    <path
                        d="M46.5 11.8L47.4 14.5L50.1 15.5L47.4 16.4L46.5 19.1L45.5 16.4L42.9 15.5L45.5 14.5L46.5 11.8Z"
                        fill="#D36A3A"
                    />
                </svg>
            </motion.div>

            <div className={cn('min-w-0', labelClassName)}>
                <div
                    className={cn(
                        'leading-none tracking-tight text-[#221814]',
                        compact ? 'text-lg font-semibold' : 'text-[1.55rem] font-semibold',
                    )}
                    style={{ fontFamily: 'var(--font-heading)' }}
                >
                    Mentara
                </div>
                {!compact && (
                    <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#8E7A6E]">
                        Learn With Memory
                    </div>
                )}
            </div>
        </Wrapper>
    );
}
