import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'accent' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium transition-colors',
                {
                    'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]': variant === 'default',
                    'bg-[var(--color-success-light)] text-[var(--color-success)]': variant === 'success',
                    'bg-[var(--color-warning-light)] text-[var(--color-warning)]': variant === 'warning',
                    'bg-[var(--color-accent-light)] text-[var(--color-accent)]': variant === 'accent',
                    'border border-[var(--color-border)] text-[var(--color-text-secondary)]': variant === 'outline',
                },
                className
            )}
            {...props}
        />
    );
}
