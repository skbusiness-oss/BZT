// TosModal.tsx
// Render-blocking ToS acceptance gate. Shown ONLY when:
//   - users/{uid}.tosAcceptedAt is missing AND
//   - localStorage has no `bzt-tos-accepted-{uid}` flag for this device.
//
// On accept, writes BOTH:
//   - users/{uid}.tosAcceptedAt as a client ISO string (immediate, no waiting
//     for serverTimestamp() to resolve) plus tosAcceptedAtServer for analytics
//   - localStorage flag, so the modal stays dismissed even if Firestore is
//     slow on the next foreground / cross-device sync hasn't landed yet.
// The AuthContext onSnapshot then reflows the user state and the modal
// disappears.

import { useState } from 'react';
import { ShieldAlert, Loader2, X, Eye, Check } from 'lucide-react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const TOS_VERSION = 'v1';
export const tosAcceptedKey = (uid: string) => `bzt-tos-accepted-${uid}`;

export const TosModal = () => {
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();
    const [accepted, setAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        if (!user || !accepted || submitting) return;
        setSubmitting(true);
        setError(null);
        // Set the local hint FIRST so the modal cannot reappear on this device
        // even if the Firestore write is slow / fails / rules reject. The
        // legal acceptance is recorded server-side; the local flag is purely a
        // "don't blink the dialog at this user again" hint.
        try { localStorage.setItem(tosAcceptedKey(user.id), new Date().toISOString()); } catch { /* private mode */ }
        try {
            await updateDoc(doc(db, 'users', user.id), {
                // serverTimestamp() — resolved to request.time on the
                // server. Previously this was `new Date().toISOString()`
                // (client clock) which the firestore.rules layer now
                // rejects because a client can back-date the acceptance
                // via a direct REST write. AuthContext.tsToIso handles
                // the Firestore Timestamp object so the UI still reads
                // it as an ISO string downstream.
                tosAcceptedAt: serverTimestamp(),
                tosVersion: TOS_VERSION,
            });
            // The onSnapshot in AuthContext will pick up the change and
            // unmount this modal. No local state update needed.
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            setSubmitting(false);
        }
    };

    // Theme-aware. Bold, structured. Reads as: lead → restrictions list →
    // watermark fact → consequence → consent → CTA. The forbidden actions are
    // a list with X icons; the watermark is a quiet eye-icon row; the
    // consequence is an outlined caution row in stronger weight.
    const forbids = [
        { key: 'tosForbidShare' },
        { key: 'tosForbidRecord' },
        { key: 'tosForbidRedistribute' },
    ] as const;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bzt-fade-in"
            style={{
                background: 'rgb(0 0 0 / 0.72)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
            }}
            dir={isRTL ? 'rtl' : 'ltr'}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bzt-tos-title"
        >
            <div
                className="bzt-rise-in max-w-lg w-full rounded-3xl bg-surface-container-high border border-outline-variant/40 overflow-hidden"
                style={{ boxShadow: '0 32px 80px rgb(0 0 0 / 0.55)' }}
            >
                {/* Header — stronger gold band, badge, eyebrow + headline */}
                <div
                    className="px-6 md:px-8 pt-7 pb-6 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgb(var(--primary) / 0.18), transparent 65%)',
                        borderBottom: '1px solid rgb(var(--primary) / 0.22)',
                    }}
                >
                    {/* Subtle drifting halo behind the badge */}
                    <div
                        className="bzt-halo-drift absolute -top-12 -right-8 w-40 h-40 rounded-full pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgb(var(--primary) / 0.22), transparent 70%)',
                            animationDuration: '18s',
                        }}
                    />
                    <div className="flex items-center gap-4 relative">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                                boxShadow: '0 8px 24px rgb(var(--primary) / 0.35)',
                            }}
                        >
                            <ShieldAlert size={26} className="text-on-primary" strokeWidth={2.4} />
                        </div>
                        <div>
                            <span className="block text-[10px] font-label font-extrabold uppercase tracking-[0.2em] text-primary">
                                BioZackTeam
                            </span>
                            <h2
                                id="bzt-tos-title"
                                className="text-2xl md:text-[28px] font-headline font-extrabold text-on-surface tracking-tight mt-1.5 leading-tight"
                            >
                                {t('tosTitle')}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 md:px-8 py-7">
                    {/* Lead — bold so the first sentence reads */}
                    <p className="text-[15px] md:text-base text-on-surface font-body font-semibold leading-relaxed mb-6">
                        {t('tosLead')}
                    </p>

                    {/* Forbidden list — three crisp rows with red X badges */}
                    <ul className="space-y-2.5 mb-6">
                        {forbids.map(({ key }) => (
                            <li
                                key={key}
                                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/25"
                            >
                                <span
                                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                                    style={{
                                        background: 'rgb(239 68 68 / 0.12)',
                                        border: '1px solid rgb(239 68 68 / 0.28)',
                                    }}
                                >
                                    <X size={14} className="text-red-400" strokeWidth={3} />
                                </span>
                                <span className="text-[14px] md:text-[15px] text-on-surface font-body font-semibold leading-snug">
                                    {t(key)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    {/* Watermark fact — quieter row, eye icon */}
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 mb-4">
                        <Eye size={16} className="text-primary shrink-0 mt-0.5" strokeWidth={2.2} />
                        <p className="text-[13px] md:text-sm text-on-surface-variant font-body leading-snug">
                            {t('tosWatermarkNote')}
                        </p>
                    </div>

                    {/* Consequence — bolder, primary-tinted, stands apart */}
                    <div
                        className="px-4 py-3 rounded-xl mb-7"
                        style={{
                            background: 'rgb(var(--primary) / 0.08)',
                            border: '1px solid rgb(var(--primary) / 0.30)',
                        }}
                    >
                        <p className="text-[13px] md:text-sm text-on-surface font-body font-bold leading-snug tracking-tight">
                            {t('tosConsequenceNote')}
                        </p>
                    </div>

                    {/* Consent — chunkier checkbox row */}
                    <label
                        className="flex items-center gap-3 mb-5 cursor-pointer select-none px-4 py-3.5 rounded-2xl border bg-surface-container transition-all"
                        style={{
                            borderColor: accepted ? 'rgb(var(--primary) / 0.6)' : 'rgb(var(--outline-variant) / 0.5)',
                            background: accepted ? 'rgb(var(--primary) / 0.06)' : undefined,
                        }}
                    >
                        <span
                            className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all"
                            style={{
                                background: accepted ? 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))' : 'transparent',
                                border: accepted ? 'none' : '1.5px solid rgb(var(--outline) / 0.6)',
                            }}
                        >
                            {accepted && <Check size={13} className="text-on-primary" strokeWidth={3.5} />}
                        </span>
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                            className="sr-only"
                            disabled={submitting}
                        />
                        <span className="text-sm text-on-surface font-body font-semibold">
                            {t('tosAgreeCheckbox')}
                        </span>
                    </label>

                    {error && (
                        <p className="text-xs text-red-400 mb-4 break-words bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 font-body">
                            {error}
                        </p>
                    )}

                    {/* CTA */}
                    <button
                        type="button"
                        onClick={handleAccept}
                        disabled={!accepted || submitting}
                        className="bzt-press w-full py-4 rounded-2xl font-label font-extrabold text-[12px] uppercase tracking-[0.18em] disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                        style={{
                            background: !accepted || submitting
                                ? 'rgb(var(--surface-container-highest))'
                                : 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                            color: !accepted || submitting ? 'rgb(var(--on-surface) / 0.45)' : 'rgb(var(--on-primary))',
                            boxShadow: !accepted || submitting ? 'none' : '0 10px 28px rgb(var(--primary) / 0.35)',
                        }}
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {t('tosAcceptCta')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TosModal;
