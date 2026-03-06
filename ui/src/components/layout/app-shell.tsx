import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, Plus, Brain, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { UserButton } from '@clerk/clerk-react';

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/create', label: 'New Class', icon: Plus },
];

export function AppShell({ children }: { children: ReactNode }) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/80 backdrop-blur-md">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
                        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)]">
                            <GraduationCap className="h-4.5 w-4.5 text-white" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                            Mentara
                        </span>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-1">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.to;
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={cn(
                                        'flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-all duration-200',
                                        isActive
                                            ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] font-medium'
                                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}

                        {/* Contextual class links — shown when viewing a class */}
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

                    {/* User Area */}
                    <div className="flex items-center gap-3">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-6 py-8">
                {children}
            </main>
        </div>
    );
}
