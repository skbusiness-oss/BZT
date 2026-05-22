/**
 * UpgradeSuccess — Stripe's success_url for the in-app community →
 * coaching upgrade flow.
 *
 * By the time the user lands here:
 *   - Their Stripe Checkout session has completed
 *   - The webhook has fired (or is about to within seconds) and flipped
 *     users/{uid}.role from 'community' to 'client'
 *   - AuthContext's onSnapshot to users/{uid} is already updating their
 *     in-memory user object in any other tab they have open
 *
 * This page's job: celebrate the upgrade, then quietly send them to
 * the dashboard so they can see their newly-unlocked coaching surfaces.
 * Auto-redirects after ~3 seconds.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, ArrowRight } from 'lucide-react';

export const UpgradeSuccess = () => {
    const { t, isRTL } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        // Soft auto-redirect — gives them time to read the celebration
        // copy without forcing a manual click.
        const id = window.setTimeout(() => navigate('/'), 3500);
        return () => window.clearTimeout(id);
    }, [navigate]);

    return (
        <div className="max-w-2xl mx-auto pt-24 pb-12 px-6 text-center animate-in fade-in duration-500" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <div
                className="rounded-3xl p-10 md:p-14"
                style={{
                    background: 'linear-gradient(160deg, rgb(var(--primary) / 0.14), rgb(var(--surface-container-low)) 60%)',
                    border: '1px solid rgb(var(--primary) / 0.32)',
                    boxShadow: '0 24px 60px -20px rgb(var(--primary) / 0.32)',
                }}
            >
                <div
                    className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                    style={{
                        background: 'rgb(var(--primary) / 0.18)',
                        color: 'rgb(var(--primary))',
                        border: '1px solid rgb(var(--primary) / 0.35)',
                    }}
                >
                    <Sparkles size={28} strokeWidth={2.2} />
                </div>
                <span className="block text-[10px] font-label font-extrabold uppercase tracking-[0.28em] text-primary mb-3">
                    {t('upgradeSuccessEyebrow')}
                </span>
                <h1 className="font-display font-extrabold text-on-surface text-[36px] md:text-[44px] leading-[0.98] tracking-tight mb-4">
                    {t('upgradeSuccessTitle')}
                </h1>
                <p className="font-body text-on-surface/70 text-[15px] md:text-base leading-relaxed mb-8 max-w-lg mx-auto">
                    {t('upgradeSuccessSub')}
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="bzt-press inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-label text-[11px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary"
                    style={{ boxShadow: '0 14px 32px rgb(var(--primary) / 0.32)' }}
                >
                    {t('upgradeSuccessCta')} <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};
