// TosModal.tsx
// Render-blocking ToS acceptance gate. Shown to any signed-in user whose
// users/{uid}.tosAcceptedAt is missing. On accept, writes serverTimestamp()
// + tosVersion = 'v1' to Firestore; the AuthContext onSnapshot then reflows
// the user state and the modal disappears.

import { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const TOS_VERSION = 'v1';

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
        try {
            await updateDoc(doc(db, 'users', user.id), {
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

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
            }}
            dir={isRTL ? 'rtl' : 'ltr'}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bzt-tos-title"
        >
            <div
                className="clay-card max-w-lg w-full p-6 md:p-8 animate-in zoom-in-95 duration-200"
                style={{
                    background: 'linear-gradient(180deg, rgba(14,19,56,0.98), rgba(6,8,20,1))',
                    border: '1px solid rgba(255,215,64,0.18)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #ffd740, #d4a017)' }}
                    >
                        <ShieldAlert size={20} className="text-navy-950" />
                    </div>
                    <h2
                        id="bzt-tos-title"
                        className="text-xl md:text-2xl font-bold text-white"
                    >
                        {t('tosTitle')}
                    </h2>
                </div>

                <p className="text-sm md:text-base text-navy-200 leading-relaxed mb-6">
                    {t('tosBody')}
                </p>

                <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded accent-gold-500"
                        disabled={submitting}
                    />
                    <span className="text-sm text-white">{t('tosAgreeCheckbox')}</span>
                </label>

                {error && (
                    <p className="text-xs text-rose-400 mb-4 break-words">{error}</p>
                )}

                <button
                    type="button"
                    onClick={handleAccept}
                    disabled={!accepted || submitting}
                    className="clay-button w-full py-3 font-bold text-navy-950 bg-gradient-to-r from-gold-400 to-gold-600 disabled:from-navy-700 disabled:to-navy-700 disabled:text-navy-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {t('tosAcceptCta')}
                </button>
            </div>
        </div>
    );
};

export default TosModal;
