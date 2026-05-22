/**
 * Settings — account-shaped surface. Where Profile is "your data + your
 * progress", Settings is "you, your preferences, your session".
 *
 * Sections (in order):
 *   1. Identity card — avatar, name, email, role badge.
 *      Moved here from Profile so the user can edit "themselves" in one
 *      place without confusion about which page is which.
 *   2. Preferences — language, theme, notifications.
 *      Theme + language are also in the sidebar footer; duplicating them
 *      here keeps the canonical control accessible from the menu, since
 *      a fresh user looking for "settings" will check this page first.
 *   3. Account — member since · "Edit profile info" (opens the same
 *      CommunityBaselineForm) · Sign out.
 *
 * The previous version of Settings had a "View profile" link to /profile.
 * Removed — the identity card here makes it redundant, and Profile now
 * means "progress + details", not "your account".
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
    Globe, Bell, LogOut, Shield, Sun, Moon, Edit2, Calendar, UserRound, Activity, Target, Award,
    CheckCircle2, AlertCircle, Loader2, Send, Check, X as XIcon, CreditCard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { registerFcmToken, wipeAllFcmTokensAndRegister } from '../lib/fcm';
import { CommunityBaselineForm } from '../components/profile/CommunityBaselineForm';

function calculateAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

export const Settings = () => {
    const { user, signOut } = useAuth();
    const { clients } = useData();
    const { t, lang, setLang } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showBaseline, setShowBaseline] = useState(false);

    // Inline display-name editor. Lets any user (including the coach
    // who was stuck with the auto-derived "Medzakc90" handle) rename
    // themselves without a Cloud Function round-trip — Firestore rules
    // already permit owner writes to users/{uid}.name.
    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState('');
    const [nameSaving, setNameSaving] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    useEffect(() => {
        if (user && !editingName) setNameDraft(user.name);
    }, [user, editingName]);

    const handleSaveName = async () => {
        if (!user) return;
        const next = nameDraft.trim();
        if (!next) {
            setNameError(t('editNameEmptyError') || 'Name cannot be empty.');
            return;
        }
        if (next === user.name) {
            setEditingName(false);
            return;
        }
        if (next.length > 60) {
            setNameError(t('editNameTooLongError') || 'Name is too long.');
            return;
        }
        setNameSaving(true);
        setNameError(null);
        try {
            // Write to BOTH `displayName` AND `name`.
            //   - `displayName` is what AuthContext reads when building
            //     the in-memory user object (see AuthContext.tsx line ~393:
            //     `name: data.displayName || firebaseUser.displayName || …`).
            //     Without this, the rename silently lands in a field
            //     AuthContext never reads, and the displayed name falls
            //     back to the email handle ("Medzakc90" for the coach).
            //     That was the founder-reported bug — "name doesn't change".
            //   - `name` is kept in sync so any UI code that reads
            //     users/{uid}.name directly (Messages contact list,
            //     broadcast senderName fallback) sees the new value too.
            await updateDoc(doc(db, 'users', user.id), {
                displayName: next,
                name: next,
            });
            setEditingName(false);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[settings] rename failed:', err);
            setNameError(t('editNameFailedError') || 'Could not save. Try again.');
        } finally {
            setNameSaving(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (!user) return null;

    const isCommunity = user.role === 'community';
    const hasBaseline = Boolean(user.communityProfileStartedAt);
    const client = clients.find(c => c.userId === user.id);

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4 pb-20">
            {/* ── Editorial header ─────────────────────────────────── */}
            <header className="mb-2">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                    {t('preferences')}
                </span>
                <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface tracking-tighter">
                    {t('settingsTitle')}<span className="text-primary-container">.</span>
                </h1>
                <p className="text-on-surface/60 mt-3 font-body">
                    {t('settingsSubtitle')}
                </p>
            </header>

            {/* ── Identity card ────────────────────────────────────── */}
            <section className="bg-surface-container-low rounded-2xl p-8 ghost-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-primary to-primary-container ring-1 ring-primary/20 shadow-[0_8px_24px_rgba(230,195,100,0.18)] shrink-0">
                        <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center overflow-hidden">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-headline font-extrabold text-on-surface">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        {/* Display name — click the pencil to edit in
                            place. On save, writes users/{uid}.name.
                            Rules already allow owner-writes to that
                            field. */}
                        {editingName ? (
                            <div className="mb-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={nameDraft}
                                        onChange={(e) => setNameDraft(e.target.value.slice(0, 60))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') { e.preventDefault(); void handleSaveName(); }
                                            if (e.key === 'Escape') { setEditingName(false); setNameError(null); }
                                        }}
                                        maxLength={60}
                                        autoFocus
                                        className="flex-1 min-w-0 bg-surface-container-lowest border border-primary/40 outline-none focus:border-primary rounded-xl px-3 py-2 text-xl md:text-2xl font-headline font-extrabold text-on-surface"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void handleSaveName()}
                                        disabled={nameSaving}
                                        aria-label={t('editNameSave') || 'Save'}
                                        className="bzt-press w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center disabled:opacity-50"
                                    >
                                        {nameSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingName(false); setNameError(null); }}
                                        disabled={nameSaving}
                                        aria-label={t('cancel') || 'Cancel'}
                                        className="bzt-press w-9 h-9 rounded-xl bg-surface-container-highest text-on-surface flex items-center justify-center"
                                    >
                                        <XIcon size={16} />
                                    </button>
                                </div>
                                {nameError && (
                                    <p className="mt-2 text-[12px] text-rose-400 font-body">{nameError}</p>
                                )}
                            </div>
                        ) : (
                            <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight truncate flex items-center gap-2.5">
                                <span className="truncate">{user.name}</span>
                                <button
                                    type="button"
                                    onClick={() => { setEditingName(true); setNameDraft(user.name); setNameError(null); }}
                                    aria-label={t('editName') || 'Edit name'}
                                    className="bzt-press shrink-0 w-7 h-7 rounded-lg bg-surface-container-highest text-on-surface/60 hover:text-primary hover:bg-surface-bright flex items-center justify-center transition-colors"
                                >
                                    <Edit2 size={13} />
                                </button>
                            </h2>
                        )}
                        <p className="text-on-surface/60 font-body text-sm mb-3 truncate">{user.email}</p>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest text-primary text-[10px] font-label font-bold uppercase tracking-widest border border-primary/20">
                            <Shield size={12} /> {t(user.role)}
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Preferences card ─────────────────────────────────── */}
            {(isCommunity || client) && (
                <section className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden">
                    <div className="px-6 pt-6 pb-3">
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/55">
                            {t('personalInfo')}
                        </span>
                    </div>

                    {isCommunity && user.age !== undefined && (
                        <Row icon={<Calendar size={18} className="text-on-surface-variant" />} label={t('age')} control={<InfoValue>{user.age} {t('yearsOld')}</InfoValue>} />
                    )}
                    {isCommunity && user.heightCm !== undefined && (
                        <Row icon={<UserRound size={18} className="text-on-surface-variant" />} label={t('height')} control={<InfoValue>{user.heightCm} cm</InfoValue>} />
                    )}
                    {isCommunity && user.goal && (
                        <Row
                            icon={<Target size={18} className="text-on-surface-variant" />}
                            label={t('goal')}
                            control={<InfoValue>{t(`goal${user.goal.charAt(0).toUpperCase()}${user.goal.slice(1).replace(/_(\w)/g, (_, c) => c.toUpperCase())}`)}</InfoValue>}
                        />
                    )}
                    {isCommunity && user.currentWeightKg !== undefined && (
                        <Row icon={<Activity size={18} className="text-on-surface-variant" />} label={t('currentWeight')} control={<InfoValue>{user.currentWeightKg} kg</InfoValue>} />
                    )}
                    {isCommunity && user.targetWeightKg !== undefined && (
                        <Row icon={<Award size={18} className="text-on-surface-variant" />} label={t('targetWeight') || 'Target'} control={<InfoValue>{user.targetWeightKg} kg</InfoValue>} />
                    )}
                    {client?.birthdate && (
                        <Row icon={<Calendar size={18} className="text-on-surface-variant" />} label={t('age')} control={<InfoValue>{calculateAge(client.birthdate)} {t('yearsOld')}</InfoValue>} />
                    )}
                    {client?.gender && (
                        <Row icon={<UserRound size={18} className="text-on-surface-variant" />} label={t('gender')} control={<InfoValue>{t(client.gender)}</InfoValue>} />
                    )}
                    {client?.fitnessLevel && (
                        <Row icon={<Award size={18} className="text-on-surface-variant" />} label={t('fitnessLevel')} control={<InfoValue>{t(client.fitnessLevel === 'pro_competitions' ? 'proCompetitions' : client.fitnessLevel)}</InfoValue>} />
                    )}
                </section>
            )}

            <section className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden">
                <div className="px-6 pt-6 pb-3">
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/55">
                        {t('preferences')}
                    </span>
                </div>

                <Row
                    icon={<Globe size={18} className="text-on-surface-variant" />}
                    label={t('language')}
                    control={
                        <button
                            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                            className="bzt-press px-4 py-1.5 text-sm rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-label uppercase tracking-widest"
                        >
                            {lang === 'en' ? 'العربية' : 'English'}
                        </button>
                    }
                />
                <Row
                    icon={theme === 'dark'
                        ? <Moon size={18} className="text-on-surface-variant" />
                        : <Sun size={18} className="text-on-surface-variant" />
                    }
                    label={t('theme')}
                    control={
                        <button
                            onClick={toggleTheme}
                            className="bzt-press px-4 py-1.5 text-sm rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-label uppercase tracking-widest"
                        >
                            {theme === 'dark' ? t('lightTheme') : t('darkTheme')}
                        </button>
                    }
                />
                <Row
                    icon={<Bell size={18} className="text-on-surface-variant" />}
                    label={t('notifications')}
                    control={
                        <button
                            onClick={() => setNotificationsEnabled(v => !v)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${notificationsEnabled ? 'gold-gradient' : 'bg-surface-container-highest'}`}
                            aria-pressed={notificationsEnabled}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-on-surface transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    }
                    last
                />
            </section>

            {/* ── Manage subscription (Stripe Customer Portal) ──────
                Only shown for users who actually have a Stripe customer
                (the webhook seeds stripeCustomerId on the user doc when
                they first paid). Coaches don't see this — they don't
                pay through Stripe themselves. */}
            <ManageSubscriptionCard />

            {/* ── Push notifications diagnostic ─────────────────────── */}
            <NotificationsDiagnostic uid={user.id} />

            {/* ── Account card ─────────────────────────────────────── */}
            <section className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden">
                <div className="px-6 pt-6 pb-3">
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/55">
                        {t('accountSection')}
                    </span>
                </div>

                <Row
                    icon={<Calendar size={18} className="text-on-surface-variant" />}
                    label={t('memberSince')}
                    control={
                        <span className="text-sm font-headline font-bold text-on-surface">Feb 2026</span>
                    }
                />

                {/* Edit profile info — only meaningful for community users
                    (clients update via the coach-driven check-in flow). */}
                {isCommunity && hasBaseline && (
                    <Row
                        icon={<Edit2 size={18} className="text-on-surface-variant" />}
                        label={t('editProfileInfo')}
                        control={
                            <button
                                onClick={() => setShowBaseline(true)}
                                className="bzt-press px-4 py-1.5 text-sm rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-label uppercase tracking-widest"
                            >
                                {t('edit')}
                            </button>
                        }
                    />
                )}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-5 text-rose-400 hover:bg-rose-500/5 transition-colors border-t border-outline-variant/30"
                >
                    <LogOut size={18} />
                    <span className="font-body">{t('signOut')}</span>
                </button>
            </section>

            <div className="text-center text-on-surface/30 text-[10px] font-label font-bold uppercase tracking-widest pt-4">
                BioZackTeam · v1.0.0
            </div>

            {showBaseline && (
                <CommunityBaselineForm
                    onClose={() => setShowBaseline(false)}
                    initial={{
                        age: user.age,
                        heightCm: user.heightCm,
                        goal: user.goal,
                        currentWeightKg: user.currentWeightKg,
                        targetWeightKg: user.targetWeightKg,
                        phone: user.phone,
                    }}
                />
            )}
        </div>
    );
};

// Compact row for the preferences/account cards.
function Row({ icon, label, control, last }: {
    icon: React.ReactNode;
    label: string;
    control: React.ReactNode;
    last?: boolean;
}) {
    return (
        <div className={`flex items-center justify-between gap-4 px-6 py-4 ${last ? '' : 'border-b border-outline-variant/30'}`}>
            <div className="flex items-center gap-3 text-on-surface min-w-0">
                <span className="shrink-0">{icon}</span>
                <span className="font-body truncate">{label}</span>
            </div>
            <div className="shrink-0">{control}</div>
        </div>
    );
}

function InfoValue({ children }: { children: React.ReactNode }) {
    return <span className="text-sm font-headline font-bold text-on-surface">{children}</span>;
}

// ── Push notifications diagnostic ────────────────────────────────────
// Reads four signals so the user can self-diagnose "I'm not getting
// pushes" without DevTools:
//   1. Browser-level Notification.permission (granted / default / denied)
//   2. Service-worker registration status
//   3. fcmTokens.length on users/{uid}  ← live snapshot
//   4. Round-trip test push that calls sendTestPush callable
//
// If (1) or (2) fail → user must act in browser settings.
// If (3) is 0 → registration never persisted (rules / VAPID / browser).
// If (1-3) good but (4) returns successCount=0 → tokens stale, the
// function prunes them and the next sign-in re-registers.
// If (4) succeeds but no OS notification appears → OS-level mute / DnD.
/**
 * ManageSubscriptionCard — "Manage subscription" button card.
 *
 * Visible only for users with a stripeCustomerId on their user doc.
 * Tapping the button calls our `createCustomerPortalSession` Cloud
 * Function which returns a one-shot URL to Stripe's hosted Customer
 * Portal. The user can cancel, update card, view invoices there, then
 * Stripe redirects them back to /settings.
 *
 * Self-gates on stripeCustomerId — community members who pay through
 * the landing page or upgrade flow get this; coaches and the legacy
 * AddClient-created accounts (no payment) don't see the card.
 */
function ManageSubscriptionCard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [stripeCustomerId, setStripeCustomerId] = useState<string | null | undefined>(undefined);
    const [opening, setOpening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'users', user.id),
            (snap) => {
                const data = snap.data();
                setStripeCustomerId((data?.stripeCustomerId as string | undefined) ?? null);
            },
            () => setStripeCustomerId(null),
        );
        return () => unsub();
    }, [user]);

    if (!user) return null;
    if (stripeCustomerId === undefined) return null; // initial load
    if (!stripeCustomerId) return null;              // never paid → no portal

    const handleManage = async () => {
        setOpening(true);
        setError(null);
        try {
            const call = httpsCallable<Record<string, never>, { url: string }>(functions, 'createCustomerPortalSession');
            const res = await call({});
            const url = res.data?.url;
            if (!url) throw new Error('No portal URL returned.');
            window.location.assign(url);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[ManageSubscriptionCard] portal open failed:', err);
            setError(t('subPortalOpenFailed') || 'Could not open subscription manager. Try again.');
            setOpening(false);
        }
    };

    return (
        <section className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden">
            <div className="px-6 pt-6 pb-3">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/55">
                    {t('subPortalEyebrow')}
                </span>
                <p className="text-xs text-on-surface/55 mt-1 font-body leading-relaxed">
                    {t('subPortalBlurb')}
                </p>
            </div>
            <div className="px-6 pb-6">
                <button
                    type="button"
                    onClick={handleManage}
                    disabled={opening}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-highest text-on-surface text-sm font-label font-bold uppercase tracking-widest hover:bg-surface-bright disabled:opacity-40 disabled:cursor-wait transition-all"
                >
                    {opening
                        ? <Loader2 size={14} className="animate-spin" />
                        : <CreditCard size={14} />}
                    {opening ? t('subPortalOpening') : t('subPortalCta')}
                </button>
                {error && (
                    <p className="mt-3 text-[12px] font-body text-rose-400">{error}</p>
                )}
            </div>
        </section>
    );
}

function NotificationsDiagnostic({ uid }: { uid: string }) {
    const { t } = useLanguage();
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
        typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
    );
    const [swRegistered, setSwRegistered] = useState<boolean | null>(null);
    const [tokenCount, setTokenCount] = useState<number | null>(null);
    const [registering, setRegistering] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);
    const [testOk, setTestOk] = useState<boolean | null>(null);
    const [regResult, setRegResult] = useState<{ ok: boolean; detail: string } | null>(null);

    // iOS PWA hint — on iPhone, web push only works when launched
    // from a Home Screen-installed PWA (iOS 16.4+). Detect tab-on-iOS
    // here so we can surface the install hint inline instead of
    // letting the user mash "Register" with no chance of success.
    const iosTabNotPwa = (() => {
        if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
        const ua = navigator.userAgent;
        const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
        if (!isIOS) return false;
        const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches
            || (navigator as Navigator & { standalone?: boolean }).standalone === true;
        return !standalone;
    })();

    useEffect(() => {
        if (!('serviceWorker' in navigator)) {
            setSwRegistered(false);
            return;
        }
        navigator.serviceWorker
            .getRegistration('/firebase-messaging-sw.js')
            .then(reg => setSwRegistered(!!reg))
            .catch(() => setSwRegistered(false));
    }, []);

    // Live-watch fcmTokens so re-registration is reflected without reload.
    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'users', uid),
            (snap) => {
                const tokens = (snap.data()?.fcmTokens as string[] | undefined) ?? [];
                setTokenCount(tokens.length);
            },
            () => setTokenCount(null),
        );
        return () => unsub();
    }, [uid]);

    const doRegister = async (forceRefresh: boolean) => {
        setRegistering(true);
        setTestResult(null);
        setTestOk(null);
        try {
            const result = await registerFcmToken(uid, { forceRefresh });
            setRegResult({
                ok: result.ok,
                detail: result.ok
                    ? `Token registered (${result.tokenPreview})`
                    : `Step "${result.step}": ${result.detail ?? 'no detail'}`,
            });
            if (typeof Notification !== 'undefined') setPermission(Notification.permission);
            // Re-check SW registration status (it may have just registered).
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js').catch(() => null);
                setSwRegistered(!!reg);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setRegResult({ ok: false, detail: `Unexpected error: ${msg}` });
        } finally {
            setRegistering(false);
        }
    };

    // Hard-clean recovery: wipes the entire fcmTokens array on the user
    // doc and re-registers only this device. The 14-day token-rotation
    // behavior + the older "Reset" bug let stale tokens accumulate; this
    // gives the user a one-tap reset to a known-good state.
    const doWipeAndRegister = async () => {
        setRegistering(true);
        setTestResult(null);
        setTestOk(null);
        try {
            const result = await wipeAllFcmTokensAndRegister(uid);
            setRegResult({
                ok: result.ok,
                detail: result.ok
                    ? `Cleared all old tokens. Only this device is now registered (${result.tokenPreview}).`
                    : `Step "${result.step}": ${result.detail ?? 'no detail'}`,
            });
            if (typeof Notification !== 'undefined') setPermission(Notification.permission);
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js').catch(() => null);
                setSwRegistered(!!reg);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setRegResult({ ok: false, detail: `Unexpected error: ${msg}` });
        } finally {
            setRegistering(false);
        }
    };

    const handleSendTest = async () => {
        setTesting(true);
        setTestResult(null);
        setTestOk(null);
        try {
            const fn = httpsCallable<
                Record<string, never>,
                {
                    ok: boolean;
                    tokenCount: number;
                    successCount: number;
                    failureCount: number;
                    failures: { code: string; message: string }[];
                    reason?: string;
                }
            >(functions, 'sendTestPush');
            const res = await fn({});
            const { ok, tokenCount: tc, successCount, failureCount, failures, reason } = res.data;
            setTestOk(ok);
            if (reason) {
                setTestResult(reason);
            } else if (ok) {
                setTestResult(
                    `Sent to ${tc} device${tc === 1 ? '' : 's'}: ${successCount} success, ${failureCount} failed.` +
                    (failures.length > 0 ? ` First failure: ${failures[0].code}` : '')
                );
            } else {
                setTestResult(
                    `Send completed but FCM rejected all tokens. ${failures.length > 0 ? `First failure: ${failures[0].code} — ${failures[0].message}` : ''}`
                );
            }
        } catch (err) {
            setTestOk(false);
            const msg = err instanceof Error ? err.message : String(err);
            setTestResult(`Call failed: ${msg}`);
        } finally {
            setTesting(false);
        }
    };

    const StatusPill = ({ ok, label }: { ok: boolean | null; label: string }) => (
        <div className="flex items-center gap-2 text-sm">
            {ok === null ? (
                <Loader2 size={14} className="text-on-surface/40 animate-spin" />
            ) : ok ? (
                <CheckCircle2 size={14} className="text-emerald-400" />
            ) : (
                <AlertCircle size={14} className="text-amber-400" />
            )}
            <span className="text-on-surface font-body">{label}</span>
        </div>
    );

    return (
        <section className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden">
            <div className="px-6 pt-6 pb-3">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/55">
                    {t('pushPanelHeader')}
                </span>
                <p className="text-xs text-on-surface/55 mt-1 font-body leading-relaxed">
                    {t('pushPanelBlurb')}
                </p>
            </div>

            <div className="px-6 pb-4 space-y-2.5">
                <StatusPill
                    ok={permission === 'granted'}
                    label={
                        permission === 'granted' ? t('pushPermissionGranted') :
                        permission === 'denied' ? t('pushPermissionDenied') :
                        permission === 'unsupported' ? t('pushPermissionUnsupported') :
                        t('pushPermissionDefault')
                    }
                />
                <StatusPill
                    ok={swRegistered}
                    label={swRegistered === false ? t('pushSwNotRegistered') : t('pushSwRegistered')}
                />
                <StatusPill
                    ok={tokenCount === null ? null : tokenCount > 0}
                    label={
                        tokenCount === null ? '…' :
                        tokenCount === 0 ? t('pushNoDevices') :
                        `${tokenCount} ${tokenCount === 1 ? t('pushDeviceCountSingular') : t('pushDeviceCountPlural')}`
                    }
                />
                {testOk !== null && (
                    <StatusPill
                        ok={testOk}
                        label={testOk ? t('pushTestOk') : t('pushTestFail')}
                    />
                )}
            </div>

            {iosTabNotPwa && (
                <div className="mx-6 mb-4 rounded-xl px-4 py-3 text-xs font-body leading-relaxed bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    <strong className="block font-headline font-bold mb-1">iPhone tab won't get push.</strong>
                    iOS only delivers web push when the site is installed as a PWA. Tap the
                    Share button in Safari, then "Add to Home Screen", then open BioZackTeam
                    from your Home Screen icon and come back here.
                </div>
            )}

            <div className="px-6 pb-6 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => doRegister(false)}
                    disabled={registering || permission === 'unsupported'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-highest text-on-surface text-sm font-label font-bold uppercase tracking-widest hover:bg-surface-bright disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    {registering ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                    {registering ? t('pushBtnRegistering') : t('pushBtnRegister')}
                </button>
                <button
                    type="button"
                    onClick={() => doRegister(true)}
                    disabled={registering || permission === 'unsupported'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-highest text-on-surface text-sm font-label font-bold uppercase tracking-widest hover:bg-surface-bright disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    {registering ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                    {t('pushBtnResetReregister')}
                </button>
                <button
                    type="button"
                    onClick={doWipeAndRegister}
                    disabled={registering || permission === 'unsupported'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-sm font-label font-bold uppercase tracking-widest hover:bg-rose-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    {registering ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                    {t('pushBtnWipeRegister')}
                </button>
                <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={testing || tokenCount === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-on-primary-fixed text-sm font-label font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {testing ? t('pushBtnSending') : t('pushBtnSendTest')}
                </button>
            </div>

            {regResult && (
                <div className="px-6 pb-3">
                    <div className={`rounded-xl px-4 py-3 text-xs font-mono leading-relaxed ${regResult.ok ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'}`}>
                        <strong className="block mb-1">Register: {regResult.ok ? 'OK' : 'FAILED'}</strong>
                        {regResult.detail}
                    </div>
                </div>
            )}
            {testResult && (
                <div className="px-6 pb-3">
                    <div className={`rounded-xl px-4 py-3 text-xs font-mono leading-relaxed ${testOk ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'}`}>
                        <strong className="block mb-1">Test push: {testOk ? 'OK' : 'FAILED'}</strong>
                        {testResult}
                    </div>
                </div>
            )}

            {/* mismatched-credential is the FCM error code that means the
                Cloud Function's service account doesn't have permission
                to send via FCM v1. Show a directive fix here instead of
                making the user google the message. */}
            {testResult && /mismatched-credential|cloudmessaging\.messages\.create/i.test(testResult) && (
                <div className="px-6 pb-6">
                    <div className="rounded-xl px-4 py-3 text-xs font-body leading-relaxed bg-rose-500/10 text-rose-300 border border-rose-500/30">
                        <strong className="block font-headline font-bold mb-2">Fix: grant FCM permission to the function</strong>
                        <ol className="space-y-1 list-decimal list-inside">
                            <li>
                                Open{' '}
                                <a
                                    href="https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=biozackteam-3d593"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline"
                                >
                                    Firebase Cloud Messaging API
                                </a>{' '}
                                in Google Cloud Console and click <strong>Enable</strong> if not already enabled.
                            </li>
                            <li>
                                Open{' '}
                                <a
                                    href="https://console.cloud.google.com/iam-admin/iam?project=biozackteam-3d593"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline"
                                >
                                    IAM &amp; Admin
                                </a>{' '}
                                and find principal{' '}
                                <code className="text-[10px]">51844467480-compute@developer.gserviceaccount.com</code>.
                            </li>
                            <li>
                                Click <strong>Edit</strong>, <strong>Add Another Role</strong>,
                                pick <strong>Firebase Cloud Messaging API Admin</strong>, save.
                            </li>
                            <li>
                                Wait ~60 seconds, then hit <strong>Send test push</strong> again.
                            </li>
                        </ol>
                    </div>
                </div>
            )}
        </section>
    );
}
