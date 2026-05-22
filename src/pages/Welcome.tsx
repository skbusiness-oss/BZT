/**
 * Welcome — landing page after Stripe redirects post-payment for new
 * signups.
 *
 * The Stripe Payment Links on the marketing site are configured with
 *   success_url = https://app.biozackteam.com/welcome?session_id={CHECKOUT_SESSION_ID}
 *
 * By the time the user lands here, the webhook has (or will within
 * seconds) created their Firebase Auth account and triggered the
 * password-reset email via the Identity Toolkit API. This page's
 * single job: reassure them they're on the right track and tell them
 * what to do next.
 *
 * We deliberately don't try to look up the session or auto-sign them
 * in — the password-reset link does that for us. Keeping this page
 * dead simple means it can't break.
 */
import { useLanguage } from '../context/LanguageContext';
import { Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Welcome = () => {
    const { t, isRTL } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-surface text-on-surface relative overflow-hidden" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Ambient gold halos — same atmosphere as Login.tsx so the
                transition feels continuous for someone who lands here
                from the marketing site. */}
            <div
                aria-hidden
                className="bzt-halo-drift absolute pointer-events-none"
                style={{
                    top: '-160px', [isRTL ? 'right' : 'left']: '-120px',
                    width: 520, height: 520,
                    background: 'radial-gradient(circle, rgb(var(--primary) / 0.20), transparent 65%)',
                    filter: 'blur(48px)', animationDuration: '24s',
                }}
            />

            <div className="max-w-2xl mx-auto px-6 md:px-10 min-h-screen flex items-center justify-center pt-24 pb-12 relative z-10">
                <div
                    className="rounded-3xl p-8 md:p-12 text-center bzt-rise-in"
                    style={{
                        background: 'linear-gradient(160deg, rgb(var(--primary) / 0.10), rgb(var(--surface-container-low)) 60%)',
                        border: '1px solid rgb(var(--primary) / 0.28)',
                        boxShadow: '0 24px 60px -20px rgb(var(--primary) / 0.30)',
                    }}
                >
                    {/* Big mail icon — visual cue that the next move is in
                        their inbox, not in this tab. */}
                    <div
                        className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                        style={{
                            background: 'rgb(var(--primary) / 0.16)',
                            color: 'rgb(var(--primary))',
                            border: '1px solid rgb(var(--primary) / 0.35)',
                        }}
                    >
                        <Mail size={28} strokeWidth={2.2} />
                    </div>

                    <span className="block text-[10px] font-label font-extrabold uppercase tracking-[0.28em] text-primary mb-3">
                        {t('welcomePostPayEyebrow')}
                    </span>
                    <h1 className="font-display font-extrabold text-on-surface text-[36px] md:text-[44px] leading-[0.98] tracking-tight mb-4">
                        {t('welcomePostPayTitle')}
                    </h1>
                    <p className="font-body text-on-surface/70 text-[15px] md:text-base leading-relaxed mb-6 max-w-md mx-auto">
                        {t('welcomePostPaySub')}
                    </p>

                    {/* Step-by-step micro-instructions so they don't feel
                        lost between leaving Stripe and signing in. */}
                    <ol
                        className="text-start space-y-3 mb-8 max-w-md mx-auto"
                        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                    >
                        {[
                            t('welcomePostPayStep1'),
                            t('welcomePostPayStep2'),
                            t('welcomePostPayStep3'),
                        ].map((line, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span
                                    dir="ltr"
                                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-headline font-extrabold text-[12px]"
                                    style={{
                                        background: 'rgb(var(--primary) / 0.18)',
                                        color: 'rgb(var(--primary))',
                                        border: '1px solid rgb(var(--primary) / 0.35)',
                                    }}
                                >
                                    {i + 1}
                                </span>
                                <span className="font-body text-on-surface/85 text-[14px] leading-relaxed pt-0.5">
                                    {line}
                                </span>
                            </li>
                        ))}
                    </ol>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="bzt-press inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-label text-[11px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary"
                        style={{ boxShadow: '0 14px 32px rgb(var(--primary) / 0.32)' }}
                    >
                        {t('welcomePostPayCta')} <ArrowRight size={14} />
                    </button>

                    <p className="text-[12px] font-body text-on-surface/45 mt-5">
                        {t('welcomePostPaySupport')}
                    </p>
                </div>
            </div>
        </div>
    );
};
