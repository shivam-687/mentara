import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
}

export function Progress({ value, max = 100, size = 'md', className, ...props }: ProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div
            className={cn(
                'w-full rounded-[var(--radius-full)] bg-[var(--color-bg-muted)] overflow-hidden',
                {
                    'h-1.5': size === 'sm',
                    'h-2.5': size === 'md',
                    'h-4': size === 'lg',
                },
                className
            )}
            {...props}
        >
            <div
                className="h-full rounded-[var(--radius-full)] bg-[var(--color-accent)] transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}
