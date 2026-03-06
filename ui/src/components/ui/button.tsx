import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] cursor-pointer',
    {
        variants: {
            variant: {
                default:
                    'bg-[var(--color-bg-dark)] text-[var(--color-text-inverse)] hover:bg-[#2A2A2A] shadow-[var(--shadow-sm)]',
                accent:
                    'bg-[var(--color-accent)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-hover)]',
                outline:
                    'border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] hover:border-[var(--color-border-hover)]',
                destructive:
                    'bg-red-600 text-white hover:bg-red-700',
                ghost:
                    'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]',
                link:
                    'text-[var(--color-accent)] underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-5 rounded-[var(--radius-md)] text-sm',
                sm: 'h-8 px-3 rounded-[var(--radius-sm)] text-xs',
                lg: 'h-12 px-6 rounded-[var(--radius-md)] text-base',
                icon: 'h-9 w-9 rounded-[var(--radius-md)]',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
