import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, Brain, Map, KeyRound, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { MentaraLogo } from '@/components/brand/mentara-logo';
import { Badge } from '@/components/ui/badge';
import { hasOpenRouterConfiguration } from '@/lib/byok';

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/create', label: 'New Class', icon: Plus, requiresByok: true },
    { to: '/settings', label: 'Settings', icon: KeyRound },
];

export function AppShell({ children }: { children: ReactNode }) {
    const location = useLocation();
    const isWorkspaceRoute = /^\/(session|progress|revision|roadmap)\//.test(location.pathname);
    const hasByok = hasOpenRouterConfiguration();

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/80 backdrop-blur-md">
                <div className={cn(
                    'flex h-14 items-center justify-between px-6',
                    isWorkspaceRoute ? 'w-full' : 'mx-auto w-full max-w-[92rem]',
                )}>
                    <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
                        <MentaraLogo compact className="gap-2.5" iconClassName="rounded-[14px]" />
                    </Link>

                    <nav className="flex items-center gap-1">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.to;
                            const isDisabled = Boolean(item.requiresByok && !hasByok);
                            const className = cn(
                                'flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-all duration-200',
                                isActive
                                    ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] font-medium'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]',
                                isDisabled && 'pointer-events-none opacity-45'
                            );

                            return isDisabled ? (
                                <div key={item.to} className={className} title="Add an OpenRouter key in Settings first.">
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </div>
                            ) : (
                                <Link key={item.to} to={item.to} className={className}>
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}

                        {(() => {
                            const match = location.pathname.match(/\/(session|progress|revision|roadmap)\/([^/]+)/);
                            if (!match) return null;
                            const classId = match[2];
                            const isRoadmapActive = location.pathname.startsWith(`/roadmap/${classId}`);
                            const isRevisionActive = location.pathname.startsWith(`/revision/${classId}`);
                            return (
                                <>
                                    <Link
                                        to={`/roadmap/${classId}`}
                                        className={cn(
                                            'flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-all duration-200',
                                            isRoadmapActive
                                                ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] font-medium'
                                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]'
                                        )}
                                    >
                                        <Map className="h-4 w-4" />
                                        Roadmap
                                    </Link>
                                    <Link
                                        to={`/revision/${classId}`}
                                        className={cn(
                                            'flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-all duration-200',
                                            isRevisionActive
                                                ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] font-medium'
                                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]'
                                        )}
                                    >
                                        <Brain className="h-4 w-4" />
                                        Revision
                                    </Link>
                                </>
                            );
                        })()}
                    </nav>

                    <div className="flex items-center gap-3">
                        {!hasByok ? (
                            <Badge variant="warning" className="hidden gap-1 md:inline-flex">
                                <AlertTriangle className="h-3 w-3" />
                                OpenRouter key required
                            </Badge>
                        ) : null}
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            <main className={cn(
                isWorkspaceRoute ? 'w-full px-0 py-0' : 'mx-auto w-full max-w-[92rem] px-6 py-8 xl:px-10',
            )}>
                {children}
            </main>
        </div>
    );
}
