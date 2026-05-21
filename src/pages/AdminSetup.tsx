import { useState } from 'react';
import { db, functions } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export const AdminSetup = () => {
    const { user, createUserAccount } = useAuth();
    const [log, setLog] = useState<string[]>([]);
    
    const [coachName, setCoachName] = useState('');
    const [coachEmail, setCoachEmail] = useState('');
    const [coachPassword, setCoachPassword] = useState('');
    const [isCreatingCoach, setIsCreatingCoach] = useState(false);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const handleCreateCoach = async () => {
        if (!coachName || !coachEmail || !coachPassword) {
            addLog('❌ Please fill in all coach details');
            return;
        }

        setIsCreatingCoach(true);
        try {
            const result = await createUserAccount(coachEmail, coachPassword, coachName, 'coach');
            if (result.error) {
                addLog(`❌ Error: ${result.error}`);
            } else {
                addLog(`✅ Coach account created successfully!`);
                setCoachName('');
                setCoachEmail('');
                setCoachPassword('');
            }
        } catch (e: any) {
            addLog(`❌ Error: ${e.message}`);
        } finally {
            setIsCreatingCoach(false);
        }
    };

    const seedVideos = async () => {
        try {
            const videos = [
                { title: 'Nutrition Fundamentals', category: 'Nutrition', thumbnailUrl: 'https://placehold.co/600x400/10b981/ffffff?text=Nutrition', isLocked: false, description: 'Master the fundamentals of nutrition.', videoUrl: '', platform: 'youtube' },
                { title: 'Progressive Overload', category: 'Training', thumbnailUrl: 'https://placehold.co/600x400/3b82f6/ffffff?text=Training', isLocked: false, description: 'Learn progressive overload for gains.', videoUrl: '', platform: 'youtube' },
                { title: 'Advanced Macro Cycling', category: 'Nutrition', thumbnailUrl: 'https://placehold.co/600x400/8b5cf6/ffffff?text=Advanced', isLocked: true, description: 'Advanced carb cycling techniques.', videoUrl: '', platform: 'vimeo' },
                { title: 'Coaching Secrets', category: 'Coaching', thumbnailUrl: 'https://placehold.co/600x400/f43f5e/ffffff?text=Secrets', isLocked: true, description: 'Insider tips from top coaches.', videoUrl: '', platform: 'youtube' },
            ];
            for (const v of videos) {
                await addDoc(collection(db, 'videos'), { ...v, createdAt: serverTimestamp() });
            }
            addLog(`✅ ${videos.length} sample videos created`);
        } catch (e: any) {
            addLog(`❌ Error: ${e.message}`);
        }
    };

    const seedCategories = async () => {
        try {
            await setDoc(doc(db, 'settings', 'videoCategories'), {
                categories: ['Nutrition', 'Training', 'Coaching', 'Mindset', 'Recovery'],
            });
            await setDoc(doc(db, 'settings', 'workoutCategories'), {
                categories: [
                    'Full Body', 'Upper / Lower', 'Push / Pull / Legs',
                    'Bro Split', 'Powerlifting', 'HIIT / Circuit', 'Cardio-Focused',
                ],
            });
            addLog('✅ Video + Workout categories seeded');
        } catch (e: any) {
            addLog(`❌ Error: ${e.message}`);
        }
    };

    const seedWelcomePost = async () => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'posts'), {
                authorId: user.id,
                authorName: user.name,
                authorRole: user.role,
                content: '💪 Welcome to BioZackTeam! Share wins, ask questions, and support each other.',
                timestamp: serverTimestamp(),
                likes: [],
                commentCount: 0,
            });
            addLog('✅ Welcome post created');
        } catch (e: any) {
            addLog(`❌ Error: ${e.message}`);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-8 space-y-8 pb-20 animate-in fade-in duration-500">
            <header>
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">Platform Operations</span>
                <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface tracking-tighter">
                    Admin <span className="text-primary-container">Setup</span>
                </h1>
                <p className="text-on-surface/70 mt-4 font-body leading-relaxed max-w-xl">As the platform admin, use this page to set up the system.</p>
            </header>

            <section className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block mb-2">Step 01</span>
                <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">Create Coach Account</h2>
                <p className="text-sm font-body text-on-surface/60 mb-6">Create the account for Mohammed Zaki to log in and manage clients.</p>

                <div className="space-y-5 max-w-md">
                    <div>
                        <label className="block text-[10px] font-label font-bold text-on-surface/60 uppercase tracking-widest mb-2">Coach Name</label>
                        <input
                            type="text"
                            value={coachName}
                            onChange={e => setCoachName(e.target.value)}
                            placeholder="e.g. Mohammed Zaki"
                            className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder-on-surface/30"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-label font-bold text-on-surface/60 uppercase tracking-widest mb-2">Email</label>
                        <input
                            type="email"
                            value={coachEmail}
                            onChange={e => setCoachEmail(e.target.value)}
                            placeholder="coach@example.com"
                            className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder-on-surface/30"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-label font-bold text-on-surface/60 uppercase tracking-widest mb-2">Password</label>
                        <input
                            type="password"
                            value={coachPassword}
                            onChange={e => setCoachPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder-on-surface/30"
                        />
                    </div>
                    <button
                        onClick={handleCreateCoach}
                        disabled={isCreatingCoach || !coachName || !coachEmail || !coachPassword}
                        className="w-full py-4 mt-4 font-label font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed text-on-primary bg-gradient-to-r from-primary to-primary-container rounded-full shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {isCreatingCoach ? 'Creating…' : 'Create Coach Account'}
                    </button>
                </div>
            </section>

            <section className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block mb-2">Step 02</span>
                <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">Seed System Content</h2>
                <p className="text-sm font-body text-on-surface/60 mb-6">Initialize required database configurations and samples.</p>

                <div className="flex flex-wrap gap-4">
                    <button onClick={seedCategories} className="px-6 py-3 rounded-full bg-primary/10 text-primary text-[10px] font-label font-bold uppercase tracking-widest border border-primary/20 hover:bg-primary/20 transition-colors">
                        Seed Categories
                    </button>
                    <button onClick={seedVideos} className="px-6 py-3 rounded-full bg-primary/10 text-primary text-[10px] font-label font-bold uppercase tracking-widest border border-primary/20 hover:bg-primary/20 transition-colors">
                        Seed Sample Videos
                    </button>
                    <button onClick={seedWelcomePost} className="px-6 py-3 rounded-full bg-primary/10 text-primary text-[10px] font-label font-bold uppercase tracking-widest border border-primary/20 hover:bg-primary/20 transition-colors">
                        Seed Welcome Post
                    </button>
                </div>
            </section>

            {log.length > 0 && (
                <section className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block mb-2">Console</span>
                    <h3 className="text-2xl font-headline font-bold text-on-surface mb-6">Execution Log</h3>
                    <div className="space-y-3 font-mono text-xs bg-surface-container-lowest p-6 rounded-xl ghost-border overflow-x-auto">
                        {log.map((l, i) => (
                            <p key={i} className={l.includes('❌') ? 'text-red-400' : 'text-emerald-400'}>{l}</p>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Forward old admin-addressed messages to coach ───────
                One-shot data fix for messages sent BEFORE the team-
                routing fix (every client message went to admin because
                of a `limit(1)` lookup that picked admin first). Creates
                a duplicate of each admin-addressed message addressed to
                the coach. Idempotent — re-running skips messages already
                forwarded. */}
            <ForwardMessagesSection />

            {/* ── Consolidate admin-addressed messages to coach ────────
                Destructive one-shot — mutates receiverId on every
                admin-addressed message to point at the coach, and
                deletes the redundant forwarded duplicates created by
                the (non-destructive) ForwardMessagesSection above.
                Run this AFTER forwarding to leave a clean inbox where
                the coach can mark messages read (Firestore rules only
                let the receiver flip `read` — so admin-addressed
                messages stay forever unread for the coach until their
                receiverId is migrated). */}
            <ConsolidateMessagesSection />

            {/* ── Wipe legacy metrics ───────────────────────────────────
                Destructive one-shot to clear every user's selfLogs /
                weighIns / metrics / xpEvents subcollections plus the
                user-doc weight anchors. Used when the check-in schema
                has changed and stale `locked: true` rows are blocking
                fresh submissions. Admin only — the Cloud Function
                rejects coaches even if they reach this UI somehow. */}
            <WipeLegacyMetricsSection />
        </div>
    );
};

function ForwardMessagesSection() {
    // Pre-filled with the two UIDs that prompted this feature, but both
    // are editable in case the team composition changes later.
    const [fromUid, setFromUid] = useState('ITc4VlP0PNeNUetjNxpEyGJOpW32');
    const [toUid, setToUid] = useState('Y9DlGI9kF6dPFPBh4cDvMnxbayB3');
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRun = async () => {
        if (!fromUid.trim() || !toUid.trim() || running) return;
        setRunning(true);
        setResult(null);
        setError(null);
        try {
            const fn = httpsCallable<
                { fromUid: string; toUid: string },
                { ok: boolean; forwardedCount: number; skippedAlreadyForwardedCount: number; sourceTotal: number }
            >(functions, 'forwardMessagesToCoach');
            const res = await fn({ fromUid: fromUid.trim(), toUid: toUid.trim() });
            setResult(JSON.stringify(res.data, null, 2));
        } catch (e: unknown) {
            const code = (e as { code?: string })?.code ?? '(no code)';
            const msg = e instanceof Error ? e.message : String(e);
            setError(`[${code}] ${msg}`);
            // eslint-disable-next-line no-console
            console.error('[forwardMessagesToCoach] failed:', code, e);
        } finally {
            setRunning(false);
        }
    };

    return (
        <section className="bg-surface-container-low rounded-2xl p-8 ghost-border">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                One-shot data fix · Admin only
            </span>
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">Forward old admin messages to coach</h2>
            <p className="text-sm font-body text-on-surface/60 mb-5">
                Copies every message where the <code>FROM</code> UID is sender or receiver, creating
                duplicate coach-side messages for the <code>TO</code> UID. Used after the team-routing
                fix so Coach Zaki can see full historical client conversations that landed in
                admin's inbox by mistake. Idempotent - safe to re-run.
            </p>

            <div className="space-y-4 max-w-md">
                <div>
                    <label className="block text-[10px] font-label font-bold text-on-surface/60 uppercase tracking-widest mb-2">
                        FROM UID (currently receiving)
                    </label>
                    <input
                        type="text"
                        value={fromUid}
                        onChange={e => setFromUid(e.target.value)}
                        className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-primary/40 rounded-xl px-4 py-3 text-sm font-mono text-on-surface"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-label font-bold text-on-surface/60 uppercase tracking-widest mb-2">
                        TO UID (should also receive)
                    </label>
                    <input
                        type="text"
                        value={toUid}
                        onChange={e => setToUid(e.target.value)}
                        className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-primary/40 rounded-xl px-4 py-3 text-sm font-mono text-on-surface"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleRun}
                    disabled={!fromUid.trim() || !toUid.trim() || running}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all gold-gradient text-on-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {running ? 'Forwarding…' : 'Forward messages'}
                </button>
                {result && (
                    <pre className="text-xs font-mono text-on-surface bg-surface-container-lowest rounded-xl p-4 overflow-auto">
                        {result}
                    </pre>
                )}
                {error && (
                    <div className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        {error}
                    </div>
                )}
            </div>
        </section>
    );
}

/**
 * One-shot data fix: mutates receiverId on every admin-addressed
 * message to the coach UID, and deletes the redundant forwarded
 * duplicates created by ForwardMessagesSection above. Pre-filled with
 * the same admin/coach UIDs that prompted the feature — both editable
 * so this stays usable if the team composition changes.
 *
 * Gated by typing CONSOLIDATE so it's harder to fire accidentally.
 */
function ConsolidateMessagesSection() {
    const [fromUid, setFromUid] = useState('ITc4VlP0PNeNUetjNxpEyGJOpW32');
    const [coachUid, setCoachUid] = useState('Y9DlGI9kF6dPFPBh4cDvMnxbayB3');
    const [confirm, setConfirm] = useState('');
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canRun = !!fromUid.trim() && !!coachUid.trim() && confirm === 'CONSOLIDATE' && !running;

    const handleRun = async () => {
        if (!canRun) return;
        setRunning(true);
        setResult(null);
        setError(null);
        try {
            const fn = httpsCallable<
                { fromUid: string; coachUid: string },
                {
                    ok: boolean;
                    migratedCount: number;
                    skippedCoachOutboundCount: number;
                    deletedDuplicateCount: number;
                    scannedTotal: number;
                }
            >(functions, 'consolidateMessagesToCoach');
            const res = await fn({ fromUid: fromUid.trim(), coachUid: coachUid.trim() });
            setResult(JSON.stringify(res.data, null, 2));
            setConfirm('');
        } catch (e: unknown) {
            const code = (e as { code?: string })?.code ?? '(no code)';
            const msg = e instanceof Error ? e.message : String(e);
            setError(`[${code}] ${msg}`);
            // eslint-disable-next-line no-console
            console.error('[consolidateMessagesToCoach] failed:', code, e);
        } finally {
            setRunning(false);
        }
    };

    return (
        <section
            className="bg-surface-container-low rounded-2xl p-8 ghost-border"
            style={{ borderColor: 'rgb(220 38 38 / 0.30)' }}
        >
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-red-400 block mb-2">
                Destructive · Admin Only
            </span>
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">Consolidate messages to coach</h2>
            <p className="text-sm font-body text-on-surface/60 mb-3">
                Rewrites the staff-side UID in place: messages addressed to <code>FROM</code> UID become
                addressed to <code>COACH</code> UID, and messages sent by <code>FROM</code> UID become sent by
                <code>COACH</code> UID. Also deletes the forwarded duplicates that <em>Forward messages</em>
                above created once originals are migrated. Idempotent.
            </p>
            <p className="text-xs font-body text-red-400/80 mb-6">
                Irreversible. Preserves the original staff UID in <code>originalReceiverId</code> or
                <code>originalSenderId</code> for audit, but the active routing field is overwritten.
            </p>

            <div className="space-y-4 max-w-md">
                <div>
                    <label className="block text-[10px] font-label font-bold text-on-surface/60 uppercase tracking-widest mb-2">
                        FROM UID (currently receiving)
                    </label>
                    <input
                        type="text"
                        value={fromUid}
                        onChange={e => setFromUid(e.target.value)}
                        className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-primary/40 rounded-xl px-4 py-3 text-sm font-mono text-on-surface"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-label font-bold text-on-surface/60 uppercase tracking-widest mb-2">
                        COACH UID (should receive everything)
                    </label>
                    <input
                        type="text"
                        value={coachUid}
                        onChange={e => setCoachUid(e.target.value)}
                        className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-primary/40 rounded-xl px-4 py-3 text-sm font-mono text-on-surface"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-label font-bold text-on-surface/60 uppercase tracking-widest mb-2">
                        Type CONSOLIDATE to enable
                    </label>
                    <input
                        type="text"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="CONSOLIDATE"
                        className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-red-500/40 rounded-xl px-4 py-3 text-sm font-mono text-on-surface placeholder-on-surface/30"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleRun}
                    disabled={!canRun}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {running ? 'Consolidating…' : 'Consolidate messages'}
                </button>
                {result && (
                    <pre className="text-xs font-mono text-on-surface bg-surface-container-lowest rounded-xl p-4 overflow-auto">
                        {result}
                    </pre>
                )}
                {error && (
                    <div className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        {error}
                    </div>
                )}
            </div>
        </section>
    );
}

/**
 * Admin-only "Wipe All Legacy Metrics" section. Requires the admin to
 * type the literal word WIPE to enable the destructive button, then
 * calls the `wipeLegacyMetrics` callable Cloud Function. The function
 * itself re-checks admin role server-side — this UI is just the gate +
 * the click.
 */
function WipeLegacyMetricsSection() {
    const { user } = useAuth();
    const [confirm, setConfirm] = useState('');
    const [emailConfirm, setEmailConfirm] = useState('');
    const [clearAnchors, setClearAnchors] = useState(true);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Both gates must pass:
    //  - Type WIPE (existing speedbump)
    //  - Type the caller's own email (matches the server-side
    //    confirmAdminEmail check in functions/src/wipeLegacyMetrics.ts)
    const callerEmail = user?.email?.trim().toLowerCase() ?? '';
    const emailMatches = !!callerEmail && emailConfirm.trim().toLowerCase() === callerEmail;
    const canWipe = confirm === 'WIPE' && emailMatches && !running;

    const handleWipe = async () => {
        if (!canWipe) return;
        setRunning(true);
        setResult(null);
        setError(null);
        try {
            const fn = httpsCallable<
                { all: boolean; clearWeightAnchors: boolean; confirmAdminEmail: string },
                { ok: boolean; count: number; totals: Record<string, number>; weightAnchorsCleared: boolean }
            >(functions, 'wipeLegacyMetrics');
            const res = await fn({
                all: true,
                clearWeightAnchors: clearAnchors,
                confirmAdminEmail: emailConfirm.trim(),
            });
            setResult(JSON.stringify(res.data, null, 2));
            setConfirm('');
            setEmailConfirm('');
        } catch (e: unknown) {
            const code = (e as { code?: string })?.code ?? '(no code)';
            const msg = e instanceof Error ? e.message : String(e);
            setError(`[${code}] ${msg}`);
            // eslint-disable-next-line no-console
            console.error('[WipeLegacyMetrics] failed:', code, e);
        } finally {
            setRunning(false);
        }
    };

    return (
        <section
            className="bg-surface-container-low rounded-2xl p-8 ghost-border"
            style={{ borderColor: 'rgb(220 38 38 / 0.30)' }}
        >
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-red-400 block mb-2">
                Destructive · Admin Only
            </span>
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">Wipe All Legacy Metrics</h2>
            <p className="text-sm font-body text-on-surface/60 mb-5">
                Nukes every user's check-in subcollections (selfLogs, weighIns, metrics, xpEvents)
                so the new weekly check-in schema starts clean. Necessary after the schema split
                because stale <code className="text-xs">locked: true</code> rows from the old
                combined collection block fresh submissions.
            </p>
            <p className="text-xs font-body text-red-400/80 mb-6">
                ⚠ Irreversible. Affects ALL users. Profile data (name, email, role, height, goal)
                is preserved.
            </p>

            <div className="space-y-4 max-w-md">
                <label className="flex items-center gap-3 text-sm font-body text-on-surface cursor-pointer">
                    <input
                        type="checkbox"
                        checked={clearAnchors}
                        onChange={e => setClearAnchors(e.target.checked)}
                        className="w-4 h-4 accent-red-500"
                    />
                    <span>Also clear weight anchors + XP (currentWeightKg, startWeightKg, activityScore, streak)</span>
                </label>

                <div>
                    <label className="block text-[10px] font-label font-bold text-on-surface/60 uppercase tracking-widest mb-2">
                        Type <code className="text-red-400">WIPE</code> to confirm
                    </label>
                    <input
                        type="text"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="WIPE"
                        className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-red-500/50 rounded-xl px-4 py-3 text-sm font-mono text-on-surface placeholder-on-surface/30"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-label font-bold text-on-surface/60 uppercase tracking-widest mb-2">
                        Type your admin email to authorize
                    </label>
                    <input
                        type="email"
                        value={emailConfirm}
                        onChange={e => setEmailConfirm(e.target.value)}
                        placeholder={callerEmail || 'your-email@example.com'}
                        autoComplete="off"
                        className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-red-500/50 rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder-on-surface/30"
                    />
                    <p className="text-[10px] text-on-surface/40 mt-1 font-body">
                        Server requires this match the signed-in admin. A hijacked session token alone won't pass this check.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleWipe}
                    disabled={!canWipe}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        background: canWipe ? 'rgb(220 38 38)' : 'rgb(220 38 38 / 0.25)',
                        color: canWipe ? '#fff' : 'rgb(220 38 38 / 0.6)',
                    }}
                >
                    {running ? 'Wiping…' : 'Wipe All Legacy Metrics'}
                </button>

                {result && (
                    <pre className="text-xs font-mono text-on-surface bg-surface-container-lowest rounded-xl p-4 overflow-auto">
                        {result}
                    </pre>
                )}
                {error && (
                    <div className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        {error}
                    </div>
                )}
            </div>
        </section>
    );
}
