import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, KeyRound, Sparkles, Trash2, ShieldCheck, Cpu, LockKeyhole } from 'lucide-react';
import {
    clearOpenRouterApiKey,
    getOpenRouterApiKey,
    getOpenRouterModel,
    hasOpenRouterConfiguration,
    maskOpenRouterApiKey,
    DEFAULT_OPENROUTER_MODEL,
    setOpenRouterApiKey,
    setOpenRouterModel,
} from '@/lib/byok';

const suggestedModels = [
    'google/gemini-2.0-flash',
    'openai/gpt-4.1-mini',
    'anthropic/claude-3.5-haiku',
    'meta-llama/llama-3.3-70b-instruct',
];

export default function SettingsPage() {
    const [draftKey, setDraftKey] = useState(() => getOpenRouterApiKey());
    const [draftModel, setDraftModel] = useState(() => getOpenRouterModel());
    const [isConfigured, setIsConfigured] = useState(() => hasOpenRouterConfiguration());
    const [savedKeyMask, setSavedKeyMask] = useState(() => {
        const key = getOpenRouterApiKey();
        return key ? maskOpenRouterApiKey(key) : '';
    });
    const [message, setMessage] = useState<string>('');

    const handleSave = () => {
        setOpenRouterApiKey(draftKey);
        setOpenRouterModel(draftModel);

        const key = getOpenRouterApiKey();
        setIsConfigured(Boolean(key));
        setSavedKeyMask(key ? maskOpenRouterApiKey(key) : '');
        setDraftModel(getOpenRouterModel());
        setMessage(key ? 'OpenRouter key and model preference saved in this browser.' : 'Add an OpenRouter key to enable class creation and tutoring.');
    };

    const handleRemove = () => {
        clearOpenRouterApiKey();
        setDraftKey('');
        setIsConfigured(false);
        setSavedKeyMask('');
        setMessage('OpenRouter key removed from this browser. Mentara class actions are now disabled until you add one again.');
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-medium tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                    Settings
                </h1>
                <p className="mt-1 text-[var(--color-text-secondary)]">
                    Configure the browser-local OpenRouter key required for class creation, teaching, and notes.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="overflow-hidden border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,253,249,0.98),rgba(246,238,230,0.92))]">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <KeyRound className="h-5 w-5 text-[var(--color-accent)]" />
                                    <CardTitle>OpenRouter Access</CardTitle>
                                </div>
                                <CardDescription className="mt-2 max-w-2xl leading-6">
                                    Mentara now runs only with your browser-supplied OpenRouter key. There is no server-side OpenRouter fallback for learning actions.
                                </CardDescription>
                            </div>
                            <Badge variant={isConfigured ? 'success' : 'warning'}>
                                {isConfigured ? 'Configured' : 'Required'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {!isConfigured ? (
                            <div className="rounded-[20px] border border-[var(--color-warning)]/30 bg-[var(--color-warning-light)]/70 p-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--color-warning)]" />
                                    <div>
                                        <p className="font-medium text-[var(--color-text-primary)]">OpenRouter key required</p>
                                        <p className="mt-1">Dashboard viewing still works, but creating classes, sending messages, locking a roadmap, and generating notes stay disabled until you save a key here.</p>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4">
                            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Saved Key</p>
                            <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                                {savedKeyMask || 'No browser key saved'}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                                The key stays in browser local storage and is attached to your own API requests as a request header.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-[var(--color-text-primary)]">OpenRouter API Key</label>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Input
                                    type="password"
                                    value={draftKey}
                                    onChange={e => setDraftKey(e.target.value)}
                                    placeholder="sk-or-v1-..."
                                    className="h-11 bg-white/80"
                                />
                                <div className="flex gap-2">
                                    <Button type="button" onClick={handleSave} className="gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Save
                                    </Button>
                                    {isConfigured && (
                                        <Button type="button" variant="outline" onClick={handleRemove} className="gap-2">
                                            <Trash2 className="h-4 w-4" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-[var(--color-text-primary)]">OpenRouter Model</label>
                            <Input
                                value={draftModel}
                                onChange={e => setDraftModel(e.target.value)}
                                placeholder={DEFAULT_OPENROUTER_MODEL}
                                className="h-11 bg-white/80"
                                list="openrouter-model-suggestions"
                            />
                            <datalist id="openrouter-model-suggestions">
                                {suggestedModels.map(model => (
                                    <option key={model} value={model} />
                                ))}
                            </datalist>
                            <div className="flex flex-wrap gap-2">
                                {suggestedModels.map(model => (
                                    <button
                                        key={model}
                                        type="button"
                                        onClick={() => setDraftModel(model)}
                                        className="rounded-full border border-[var(--color-border)] bg-white/80 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text-primary)]"
                                    >
                                        {model}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setDraftModel(DEFAULT_OPENROUTER_MODEL)}
                                    className="rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-accent-light)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] transition hover:border-[var(--color-accent)]/45"
                                >
                                    Use seeded default
                                </button>
                            </div>
                            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                                If you do not set a custom model, Mentara uses the seeded default: <span className="font-medium text-[var(--color-text-primary)]">{DEFAULT_OPENROUTER_MODEL}</span>.
                            </p>
                        </div>

                        {message ? <p className="text-sm text-[var(--color-text-secondary)]">{message}</p> : null}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-[var(--color-accent)]" />
                                Request Behavior
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                            <p>When the key is present, Mentara sends your OpenRouter key and selected model with every LLM-backed request.</p>
                            <p>When the model field is empty or reset, the app uses the seeded model default.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LockKeyhole className="h-5 w-5 text-[var(--color-warning)]" />
                                Product Guardrails
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                            <p>The dashboard remains accessible without a key, but class creation and tutoring controls should stay disabled so the app fails early and clearly instead of breaking mid-session.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[var(--color-success)]" />
                                Security Posture
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                            <p>The key is stored locally in this browser only. It is never fetched back from the server and is not shared between browsers or devices.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
                                Recommended Use
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                            <p>Use the seeded model first. Only override the model when you know the OpenRouter route you want and you are willing to own the model quality and cost tradeoff.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
