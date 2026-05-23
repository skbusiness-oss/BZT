/**
 * Subscriptions — coach-only admin page.
 *
 * One row per paying member. Live-snapshot the `users` collection
 * filtered to docs with a stripeCustomerId. Shows: name, email, tier,
 * status, started, next billing, actions.
 *
 * Actions per row
 *   - View in Stripe → opens the customer's profile in Stripe dashboard
 *   - Disable / Re-enable → flips users/{uid}.disabled (existing
 *     mechanism; AuthContext kicks them out within seconds)
 *
 * The page is a Firestore-backed view — no Cloud Function involved.
 * The webhook keeps every field in sync (status / currentPeriodEnd /
 * canceledAt / etc.) so what's rendered here is always live.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable, FunctionsError } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { describePriceId, STRIPE_PRICE_META } from '../lib/stripePrices';
import {
    CreditCard, ExternalLink, Lock, Unlock, Filter, Loader2,
    Link as LinkIcon, X, Copy, Check, Calendar,
} from 'lucide-react';

interface SubscriberRow {
    uid: string;
    name: string;
    email: string;
    role: string;
    stripeCustomerId: string;
    stripePriceId?: string;
    subscriptionStatus?: string;
    disabled?: boolean;
    cancelAtPeriodEnd?: boolean;
    createdAt?: unknown;
    currentPeriodEnd?: unknown;
    canceledAt?: unknown;
    lastPaymentFailedAt?: unknown;
}

type StatusFilter = 'all' | 'active' | 'past_due' | 'canceled' | 'disabled';

export const Subscriptions = () => {
    const { user } = useAuth();
    const { t, isRTL, lang } = useLanguage();
    const navigate = useNavigate();
    const [rows, setRows] = useState<SubscriberRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [pendingToggle, setPendingToggle] = useState<string | null>(null);
    const [showLinkModal, setShowLinkModal] = useState(false);

    // Coach-only gate. Non-coach hitting /subscriptions directly →
    // bounce home.
    useEffect(() => {
        if (user && user.role !== 'coach' && user.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    // Real-time subscription list. Filtered to users with a
    // stripeCustomerId because that's the "ever paid" predicate —
    // accounts created by the AddClient flow but never paid through
    // Stripe don't have one and aren't subscribers in this sense.
    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            where('stripeCustomerId', '!=', null),
        );
        const unsub = onSnapshot(q,
            (snap) => {
                const next: SubscriberRow[] = snap.docs.map((d) => {
                    const data = d.data() as Record<string, unknown>;
                    return {
                        uid: d.id,
                        name: (data.name as string) || (data.displayName as string) || '(no name)',
                        email: (data.email as string) || '',
                        role: (data.role as string) || 'community',
                        stripeCustomerId: data.stripeCustomerId as string,
                        stripePriceId: data.stripePriceId as string | undefined,
                        subscriptionStatus: data.subscriptionStatus as string | undefined,
                        disabled: data.disabled as boolean | undefined,
                        cancelAtPeriodEnd: data.cancelAtPeriodEnd as boolean | undefined,
                        createdAt: data.createdAt,
                        currentPeriodEnd: data.currentPeriodEnd,
                        canceledAt: data.canceledAt,
                        lastPaymentFailedAt: data.lastPaymentFailedAt,
                    };
                });
                // Sort: newest first by createdAt (Firestore can't sort
                // when filtering by inequality on another field, so we
                // do it client-side).
                next.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt));
                setRows(next);
                setLoading(false);
            },
            (err) => {
                // eslint-disable-next-line no-console
                console.error('[Subscriptions] snapshot error:', err);
                setLoading(false);
            },
        );
        return unsub;
    }, []);

    // Apply the status-filter chip.
    const visible = useMemo(() => {
        if (filter === 'all') return rows;
        if (filter === 'disabled') return rows.filter((r) => r.disabled === true);
        return rows.filter((r) => r.subscriptionStatus === filter && !r.disabled);
    }, [rows, filter]);

    const counts = useMemo(() => ({
        all:       rows.length,
        active:    rows.filter((r) => r.subscriptionStatus === 'active' && !r.disabled).length,
        past_due:  rows.filter((r) => r.subscriptionStatus === 'past_due' && !r.disabled).length,
        canceled:  rows.filter((r) => r.subscriptionStatus === 'canceled' && !r.disabled).length,
        disabled:  rows.filter((r) => r.disabled === true).length,
    }), [rows]);

    if (!user || (user.role !== 'coach' && user.role !== 'admin')) return null;

    const handleToggleDisabled = async (row: SubscriberRow) => {
        const next = !row.disabled;
        setPendingToggle(row.uid);
        try {
            await updateDoc(doc(db, 'users', row.uid), {
                disabled: next,
                ...(next
                    ? { disabledAt: serverTimestamp(), disabledBy: user.id }
                    : { disabledAt: null, disabledBy: null }),
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[Subscriptions] toggle disabled failed:', err);
            alert(t('subActionFailed') || 'Action failed. See console.');
        } finally {
            setPendingToggle(null);
        }
    };

    const fmtDate = (ts: unknown): string => {
        const ms = tsToMillis(ts);
        if (!ms) return '—';
        const d = new Date(ms);
        const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
        return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const statusBadge = (row: SubscriberRow) => {
        // Disabled trumps everything else — once we set disabled=true
        // they can't sign in regardless of the underlying Stripe status.
        if (row.disabled) {
            return { label: t('subStatusDisabled'), bg: 'rgb(244 63 94 / 0.18)', fg: '#fda4af', border: 'rgb(244 63 94 / 0.45)' };
        }
        switch (row.subscriptionStatus) {
            case 'active':   return { label: t('subStatusActive'),   bg: 'rgb(16 185 129 / 0.18)', fg: '#6ee7b7', border: 'rgb(16 185 129 / 0.45)' };
            case 'past_due': return { label: t('subStatusPastDue'),  bg: 'rgb(245 158 11 / 0.18)', fg: '#fcd34d', border: 'rgb(245 158 11 / 0.45)' };
            case 'trialing': return { label: t('subStatusTrialing'), bg: 'rgb(96 165 250 / 0.18)', fg: '#93c5fd', border: 'rgb(96 165 250 / 0.45)' };
            case 'canceled': return { label: t('subStatusCanceled'), bg: 'rgb(148 163 184 / 0.18)', fg: '#cbd5e1', border: 'rgb(148 163 184 / 0.45)' };
            default:         return { label: row.subscriptionStatus ?? '—', bg: 'rgb(148 163 184 / 0.12)', fg: '#cbd5e1', border: 'rgb(148 163 184 / 0.30)' };
        }
    };

    const filterChips: { key: StatusFilter; label: string; count: number }[] = [
        { key: 'all',      label: t('subFilterAll'),      count: counts.all },
        { key: 'active',   label: t('subStatusActive'),   count: counts.active },
        { key: 'past_due', label: t('subStatusPastDue'),  count: counts.past_due },
        { key: 'canceled', label: t('subStatusCanceled'), count: counts.canceled },
        { key: 'disabled', label: t('subStatusDisabled'), count: counts.disabled },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4 pb-20" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <header className="mb-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                        {t('subEyebrow')}
                    </span>
                    <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface tracking-tighter mb-3">
                        {t('subPageTitle')}
                    </h1>
                    <p className="text-on-surface/60 font-body text-sm md:text-base leading-relaxed max-w-2xl">
                        {t('subPageSub')}
                    </p>
                </div>
                {/* Link-existing-client button — opens a modal that
                    calls the `linkClientToStripe` function. Used to
                    migrate clients who paid in cash externally onto
                    Stripe auto-billing with a trial-end set to the
                    cash-paid period's expiry date. */}
                <button
                    type="button"
                    onClick={() => setShowLinkModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary/10 text-primary border border-primary/30 font-label text-[11px] font-bold uppercase tracking-widest hover:bg-primary/15 hover:border-primary/50 transition-all"
                >
                    <LinkIcon size={14} />
                    {t('subLinkCashClient')}
                </button>
            </header>

            {/* Status filter chips */}
            <div className="flex flex-wrap items-center gap-2">
                <Filter size={14} className="text-on-surface/45" />
                {filterChips.map((chip) => {
                    const active = filter === chip.key;
                    return (
                        <button
                            key={chip.key}
                            type="button"
                            onClick={() => setFilter(chip.key)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-body font-medium transition-all"
                            style={{
                                background: active ? 'rgb(var(--primary) / 0.18)' : 'rgb(var(--surface-container-low) / 0.65)',
                                color: active ? 'rgb(var(--primary))' : 'rgb(var(--on-surface-variant))',
                                border: active ? '1px solid rgb(var(--primary) / 0.40)' : '1px solid rgb(var(--outline-variant) / 0.30)',
                            }}
                        >
                            {chip.label}
                            <span
                                className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                                style={{
                                    background: active ? 'rgb(var(--primary) / 0.30)' : 'rgb(var(--surface-container-highest) / 0.50)',
                                    color: 'inherit',
                                }}
                            >
                                {chip.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* The table itself. Card-on-dark visual language so it
                matches the rest of the app, but uses a CSS Grid table
                layout that's far more scannable than a true <table>. */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-primary" />
                </div>
            ) : visible.length === 0 ? (
                <div
                    className="rounded-2xl p-10 text-center"
                    style={{
                        background: 'rgb(var(--surface-container-low) / 0.65)',
                        border: '1px solid rgb(var(--outline-variant) / 0.30)',
                    }}
                >
                    <CreditCard size={32} className="mx-auto mb-3 text-on-surface/30" />
                    <p className="text-on-surface/60 font-body text-sm">{t('subEmptyState')}</p>
                </div>
            ) : (
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgb(var(--surface-container-low) / 0.65)',
                        border: '1px solid rgb(var(--outline-variant) / 0.30)',
                    }}
                >
                    {/* Header row */}
                    <div
                        className="hidden md:grid gap-4 px-5 py-3 text-[10px] font-label font-bold uppercase tracking-[0.18em] text-on-surface/55"
                        style={{
                            gridTemplateColumns: '1.6fr 1.4fr 1fr 0.9fr 0.9fr 1.1fr',
                            background: 'rgb(var(--surface-container) / 0.50)',
                            borderBottom: '1px solid rgb(var(--outline-variant) / 0.30)',
                        }}
                    >
                        <span>{t('subColMember')}</span>
                        <span>{t('subColTier')}</span>
                        <span>{t('subColStatus')}</span>
                        <span>{t('subColStarted')}</span>
                        <span>{t('subColNextBill')}</span>
                        <span className="text-end">{t('subColActions')}</span>
                    </div>

                    {visible.map((row) => {
                        const badge = statusBadge(row);
                        const isToggling = pendingToggle === row.uid;
                        return (
                            <div
                                key={row.uid}
                                // Mobile-first: stacked card. md+: 6-column grid.
                                // The inline `gridTemplateColumns` only takes
                                // effect once md:grid switches display to grid;
                                // below md it's display:block (Tailwind default
                                // when no explicit display class) and the cells
                                // flow vertically as block-level children.
                                //
                                // Each cell uses md:hidden labels so on mobile
                                // the row reads as "Tier: Community / Status:
                                // Active / Started: …" instead of a cryptic
                                // strip of unlabeled values. Date cells get
                                // whitespace-nowrap so "May 2026" can't wrap
                                // mid-pair.
                                className="block md:grid md:gap-4 px-5 py-5 md:py-4 md:items-center text-[13px] font-body"
                                style={{
                                    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 0.9fr) minmax(0, 1.1fr)',
                                    borderBottom: '1px solid rgb(var(--outline-variant) / 0.20)',
                                }}
                            >
                                {/* Member */}
                                <div className="min-w-0 mb-3 md:mb-0">
                                    <div className="font-headline font-bold text-on-surface text-[15px] md:text-[14px] truncate">{row.name}</div>
                                    <div className="text-on-surface/55 text-[12px] truncate">{row.email}</div>
                                </div>

                                {/* Tier */}
                                <div className="flex items-center justify-between md:block py-1.5 md:py-0 border-t md:border-t-0 border-outline-variant/15">
                                    <span className="text-on-surface/45 text-[10px] font-label font-bold uppercase tracking-widest md:hidden">
                                        {t('subColTier')}
                                    </span>
                                    <span className="text-on-surface/80 truncate text-[13px] md:max-w-full max-w-[60%] text-end md:text-start">
                                        {describePriceId(row.stripePriceId)}
                                    </span>
                                </div>

                                {/* Status badge */}
                                <div className="flex items-center justify-between md:block py-1.5 md:py-0 border-t md:border-t-0 border-outline-variant/15">
                                    <span className="text-on-surface/45 text-[10px] font-label font-bold uppercase tracking-widest md:hidden">
                                        {t('subColStatus')}
                                    </span>
                                    <div className="text-end md:text-start">
                                        <span
                                            className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-[0.12em]"
                                            style={{ background: badge.bg, color: badge.fg, border: `1px solid ${badge.border}` }}
                                        >
                                            {badge.label}
                                        </span>
                                        {row.cancelAtPeriodEnd && !row.disabled && (
                                            <div className="text-[10px] text-on-surface/45 mt-1 italic">
                                                {t('subCancelsAtPeriodEnd')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Started */}
                                <div className="flex items-center justify-between md:block py-1.5 md:py-0 border-t md:border-t-0 border-outline-variant/15">
                                    <span className="text-on-surface/45 text-[10px] font-label font-bold uppercase tracking-widest md:hidden">
                                        {t('subColStarted')}
                                    </span>
                                    <span className="text-on-surface/70 whitespace-nowrap">{fmtDate(row.createdAt)}</span>
                                </div>

                                {/* Next bill */}
                                <div className="flex items-center justify-between md:block py-1.5 md:py-0 border-t md:border-t-0 border-outline-variant/15">
                                    <span className="text-on-surface/45 text-[10px] font-label font-bold uppercase tracking-widest md:hidden">
                                        {t('subColNextBill')}
                                    </span>
                                    <span className="text-on-surface/70 whitespace-nowrap">{fmtDate(row.currentPeriodEnd)}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center md:justify-end gap-2 pt-3 md:pt-0 mt-2 md:mt-0 border-t md:border-t-0 border-outline-variant/20">
                                    <a
                                        href={`https://dashboard.stripe.com/customers/${row.stripeCustomerId}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg text-[11px] font-label font-bold uppercase tracking-widest bg-surface-container-low border border-outline-variant/40 text-on-surface/70 hover:text-on-surface hover:bg-surface-container transition-all"
                                        title={t('subActionStripe')}
                                    >
                                        <ExternalLink size={11} />
                                        Stripe
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleDisabled(row)}
                                        disabled={isToggling}
                                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg text-[11px] font-label font-bold uppercase tracking-widest border transition-all"
                                        style={row.disabled
                                            ? { background: 'rgb(16 185 129 / 0.12)', color: '#6ee7b7', borderColor: 'rgb(16 185 129 / 0.35)' }
                                            : { background: 'rgb(244 63 94 / 0.10)', color: '#fda4af', borderColor: 'rgb(244 63 94 / 0.35)' }}
                                        title={row.disabled ? t('subActionReenable') : t('subActionDisable')}
                                    >
                                        {isToggling ? <Loader2 size={11} className="animate-spin" /> : (row.disabled ? <Unlock size={11} /> : <Lock size={11} />)}
                                        {row.disabled ? t('subActionReenable') : t('subActionDisable')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showLinkModal && (
                <LinkCashClientModal
                    onClose={() => setShowLinkModal(false)}
                    existingSubscribers={rows}
                />
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────
// LinkCashClientModal — coach-only flow to migrate a cash-paying
// client onto Stripe auto-billing. Calls the linkClientToStripe
// Cloud Function, gets back a Checkout URL, presents it for the
// coach to copy + share with the client (WhatsApp / SMS / in-app
// message).
// ─────────────────────────────────────────────────────────────────
interface CandidateClient {
    uid: string;
    name: string;
    email: string;
    role: string;
}

function LinkCashClientModal({
    onClose,
    existingSubscribers,
}: {
    onClose: () => void;
    existingSubscribers: SubscriberRow[];
}) {
    const { t } = useLanguage();
    const [candidates, setCandidates] = useState<CandidateClient[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(true);
    const [search, setSearch] = useState('');
    const [pickedUid, setPickedUid] = useState<string>('');
    const [priceId, setPriceId] = useState<string>('');
    // Default billing start = 30 days from now. Coach can edit.
    const [billingStartDate, setBillingStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().slice(0, 10);
    });
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Build a "subscribers I shouldn't double-link" set — anyone
    // already on an active/trialing sub gets filtered from the
    // candidate dropdown so the coach can't accidentally create a
    // parallel subscription.
    const activeSubUids = useMemo(() => {
        const s = new Set<string>();
        for (const r of existingSubscribers) {
            if (r.subscriptionStatus === 'active' || r.subscriptionStatus === 'trialing') s.add(r.uid);
        }
        return s;
    }, [existingSubscribers]);

    // Real-time list of all users so coach can pick a target. We
    // skip ones with an active sub. Coaches/admins also filtered
    // since they're staff, not customers.
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'),
            (snap) => {
                const next: CandidateClient[] = [];
                snap.forEach((d) => {
                    const data = d.data() as Record<string, unknown>;
                    const role = (data.role as string) || 'community';
                    if (role === 'coach' || role === 'admin') return;
                    if (activeSubUids.has(d.id)) return;
                    next.push({
                        uid: d.id,
                        name: (data.displayName as string) || (data.name as string) || '(no name)',
                        email: (data.email as string) || '',
                        role,
                    });
                });
                next.sort((a, b) => a.name.localeCompare(b.name));
                setCandidates(next);
                setLoadingCandidates(false);
            },
            (err) => {
                // eslint-disable-next-line no-console
                console.error('[LinkCashClientModal] users snapshot error:', err);
                setLoadingCandidates(false);
            },
        );
        return unsub;
    }, [activeSubUids]);

    // Filter candidates by the typed search string. Case-insensitive
    // on both name and email.
    const filteredCandidates = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return candidates.slice(0, 50);
        return candidates.filter(c =>
            c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
        ).slice(0, 50);
    }, [candidates, search]);

    const handleSubmit = async () => {
        if (!pickedUid || !priceId || !billingStartDate) {
            setError(t('subLinkAllFieldsRequired') || 'Pick a client, a plan, and a start date.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const call = httpsCallable<
                { clientUid: string; priceId: string; billingStartDate: string; note?: string },
                { url: string; customerId: string; expiresAt: number }
            >(functions, 'linkClientToStripe');
            const res = await call({
                clientUid: pickedUid,
                priceId,
                billingStartDate,
                ...(note.trim() ? { note: note.trim() } : {}),
            });
            const url = res.data?.url;
            if (!url) throw new Error('Function returned no URL.');
            setResultUrl(url);
        } catch (err) {
            const fnErr = err as FunctionsError;
            // eslint-disable-next-line no-console
            console.error('[LinkCashClientModal] link failed:', err);
            setError(fnErr?.message || (t('subLinkFailed') || 'Could not generate link. Try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopy = async () => {
        if (!resultUrl) return;
        try {
            await navigator.clipboard.writeText(resultUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Some browsers / PWAs reject clipboard writes — fall back
            // to selecting the input so the coach can copy manually.
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full md:max-w-lg bg-surface-container rounded-t-3xl md:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
                style={{ border: '1px solid rgb(var(--outline-variant) / 0.4)' }}
            >
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">
                            {t('subLinkEyebrow')}
                        </span>
                        <h2 className="font-headline font-extrabold text-xl text-on-surface tracking-tight">
                            {t('subLinkTitle')}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface/60 hover:text-on-surface flex items-center justify-center shrink-0"
                        aria-label={t('cancel') || 'Close'}
                    >
                        <X size={16} />
                    </button>
                </div>

                {resultUrl ? (
                    /* Success view — show the URL with copy button +
                       a quick intro paragraph the coach can paste
                       alongside the link. */
                    <div className="space-y-4">
                        <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                            <p className="text-[13px] font-body">
                                {t('subLinkSuccessBlurb')}
                            </p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55 mb-2">
                                {t('subLinkCheckoutUrl')}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={resultUrl}
                                    onFocus={(e) => e.currentTarget.select()}
                                    className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-[13px] font-mono text-on-surface"
                                />
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label text-[11px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 shrink-0"
                                >
                                    {copied ? <><Check size={12} /> {t('copied')}</> : <><Copy size={12} /> {t('copy')}</>}
                                </button>
                            </div>
                            <p className="text-[11px] text-on-surface/50 mt-2 font-body leading-relaxed">
                                {t('subLinkExpiresHint')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full mt-2 px-4 py-3 rounded-xl bg-surface-container-high text-on-surface font-label text-[11px] font-bold uppercase tracking-widest"
                        >
                            {t('done')}
                        </button>
                    </div>
                ) : (
                    /* Form view */
                    <div className="space-y-5">
                        {/* Client picker */}
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55 mb-2">
                                {t('subLinkPickClient')}
                            </label>
                            <input
                                type="text"
                                placeholder={t('subLinkSearchPlaceholder') || 'Search by name or email…'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm font-body text-on-surface placeholder-on-surface/30 focus:border-primary outline-none mb-2"
                            />
                            <div className="max-h-48 overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
                                {loadingCandidates ? (
                                    <div className="p-4 text-center text-on-surface/40 text-sm">
                                        <Loader2 size={16} className="animate-spin mx-auto" />
                                    </div>
                                ) : filteredCandidates.length === 0 ? (
                                    <div className="p-4 text-center text-on-surface/50 text-sm font-body">
                                        {t('subLinkNoCandidates')}
                                    </div>
                                ) : (
                                    filteredCandidates.map(c => (
                                        <button
                                            key={c.uid}
                                            type="button"
                                            onClick={() => setPickedUid(c.uid)}
                                            className={`w-full text-start px-3 py-2.5 border-b border-outline-variant/15 last:border-b-0 transition-colors ${
                                                pickedUid === c.uid
                                                    ? 'bg-primary/12 text-on-surface'
                                                    : 'hover:bg-surface-container text-on-surface/85'
                                            }`}
                                        >
                                            <div className="font-headline font-bold text-[14px] truncate">{c.name}</div>
                                            <div className="text-[12px] text-on-surface/55 truncate">{c.email} · {c.role}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Plan picker */}
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55 mb-2">
                                {t('subLinkPickPlan')}
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {Object.entries(STRIPE_PRICE_META).map(([pid, meta]) => (
                                    <button
                                        key={pid}
                                        type="button"
                                        onClick={() => setPriceId(pid)}
                                        className={`text-start px-4 py-3 rounded-xl border transition-all ${
                                            priceId === pid
                                                ? 'bg-primary/12 border-primary text-on-surface'
                                                : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface/85 hover:border-primary/30'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-headline font-bold text-sm">{meta.label}</div>
                                            <div className="font-body text-sm tabular-nums">
                                                ${meta.amountUsd}/{meta.interval === 'month' ? 'mo' : 'yr'}
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-on-surface/45 font-body mt-0.5">
                                            {meta.tier === 'client' ? t('subLinkPlanCoaching') : t('subLinkPlanCommunity')}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Billing start date */}
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55 mb-2 flex items-center gap-1.5">
                                <Calendar size={12} />
                                {t('subLinkBillingStartDate')}
                            </label>
                            <input
                                type="date"
                                value={billingStartDate}
                                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                                onChange={(e) => setBillingStartDate(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm font-body text-on-surface focus:border-primary outline-none"
                            />
                            <p className="text-[11px] text-on-surface/50 mt-2 font-body leading-relaxed">
                                {t('subLinkBillingStartHint')}
                            </p>
                        </div>

                        {/* Optional note */}
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55 mb-2">
                                {t('subLinkNoteOptional')}
                            </label>
                            <input
                                type="text"
                                placeholder={t('subLinkNotePlaceholder') || 'e.g. paid 500 USD cash for 3 months'}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={480}
                                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm font-body text-on-surface placeholder-on-surface/30 focus:border-primary outline-none"
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-[13px] font-body">
                                {error}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || !pickedUid || !priceId || !billingStartDate}
                            className="w-full px-4 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label text-[11px] font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(230,195,100,0.30)]"
                        >
                            {submitting
                                ? <Loader2 size={14} className="animate-spin" />
                                : <><LinkIcon size={14} /> {t('subLinkGenerate')}</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/** Convert a Firestore Timestamp / ISO string / Date to millis. */
function tsToMillis(ts: unknown): number {
    if (!ts) return 0;
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
        return (ts as { toDate: () => Date }).toDate().getTime();
    }
    if (typeof ts === 'string') {
        const d = new Date(ts);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    return 0;
}
