/**
 * Welcome — landing page after Stripe redirects post-payment for new
 * signups.
 *
 * The Stripe Payment Links on the marketing site are configured with
 *   success_url = https://app.biozackteam.com/welcome
 *
 * By the time the user lands here, the webhook has (or will within
 * seconds) created their Firebase Auth account and triggered the
 * password-reset email via the Identity Toolkit API.
 *
 * Founder direction: the page should walk a brand-new customer
 * through the 4 steps that get them from "just paid" to "logged
 * into the dashboard" — clear enough that they never have to email
 * support to ask "what do I do now?" Each step has:
 *   - A bold action line ("Check your inbox")
 *   - A body paragraph explaining what to look for / do
 *   - A muted hint with troubleshooting nuance (spam folder, link
 *     expiration, notification permission, etc.)
 *
 * Bilingual EN/AR — every line flows through useLanguage().t and
 * respects dir="rtl" on the document element.
 *
 * Step icons map to the action: Mail (inbox) → Key (password) →
 * LogIn (sign in) → Sparkles (you're in).
 */
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Key, LogIn, Sparkles, ArrowRight, LifeBuoy, type LucideIcon } from 'lucide-react';

interface Step {
    Icon: LucideIcon;
    titleKey: string;
    bodyKey: string;
    hintKey: string;
}

const STEPS: Step[] = [
    { Icon: Mail,     titleKey: 'welcomeStep1Title', bodyKey: 'welcomeStep1Body', hintKey: 'welcomeStep1Hint' },
    { Icon: Key,      titleKey: 'welcomeStep2Title', bodyKey: 'welcomeStep2Body', hintKey: 'welcomeStep2Hint' },
    { Icon: LogIn,    titleKey: 'welcomeStep3Title', bodyKey: 'welcomeStep3Body', hintKey: 'welcomeStep3Hint' },
    { Icon: Sparkles, titleKey: 'welcomeStep4Title', bodyKey: 'welcomeStep4Body', hintKey: 'welcomeStep4Hint' },
];

export const Welcome = () => {
    const { t, isRTL } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-surface text-on-surface relative overflow-hidden" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Ambient gold halos — same atmosphere as Login.tsx so the
                transition from marketing site → app feels continuous
                for someone who lands here straight from Stripe. */}
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
            <div
                aria-hidden
                className="bzt-halo-drift absolute pointer-events-none"
                style={{
                    bottom: '-100px', [isRTL ? 'left' : 'right']: '-80px',
                    width: 360, height: 360,
                    background: 'radial-gradient(circle, rgb(var(--primary-container) / 0.16), transparent 70%)',
                    filter: 'blur(40px)', animationDuration: '32s', animationDirection: 'reverse',
                }}
            />

            <div className="max-w-3xl mx-auto px-5 md:px-10 pt-16 md:pt-24 pb-16 relative z-10">

                {/* ── Hero ─────────────────────────────────────────── */}
                <div className="text-center mb-12 bzt-rise-in">
                    <div
                        className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                        style={{
                            background: 'rgb(var(--primary) / 0.16)',
                            color: 'rgb(var(--primary))',
                            border: '1px solid rgb(var(--primary) / 0.35)',
                        }}
                    >
                        <Sparkles size={28} strokeWidth={2.2} />
                    </div>
                    <span className="block text-[10px] font-label font-extrabold uppercase tracking-[0.28em] text-primary mb-3">
                        {t('welcomePostPayEyebrow')}
                    </span>
                    <h1 className="font-display font-extrabold text-on-surface text-[36px] md:text-[48px] leading-[0.98] tracking-tight mb-4">
                        {t('welcomePostPayTitle')}
                    </h1>
                    <p className="font-body text-on-surface/70 text-[15px] md:text-base leading-relaxed max-w-xl mx-auto">
                        {t('welcomePostPaySub')}
                    </p>
                </div>

                {/* ── Step list ──────────────────────────────────────
                    Each step is its own card with a numbered chip on
                    the start edge so the reader's eye lands on
                    1 → 2 → 3 → 4 sequentially. Cards rise-in on a
                    staggered delay so the page assembles itself
                    instead of dumping everything at once. */}
                <div className="space-y-4 mb-12">
                    {STEPS.map((step, i) => {
                        const { Icon } = step;
                        return (
                            <div
                                key={step.titleKey}
                                className="bzt-rise-in rounded-3xl p-5 md:p-6 flex items-start gap-4 md:gap-5"
                                style={{
                                    background: 'rgb(var(--surface-container-low) / 0.75)',
                                    border: '1px solid rgb(var(--outline-variant) / 0.30)',
                                    boxShadow: '0 14px 36px -20px rgba(0,0,0,0.30)',
                                    animationDelay: `${120 + i * 70}ms`,
                                }}
                            >
                                {/* Numbered + iconed chip — gold tint, big
                                    enough to read at a glance on mobile.
                                    Numerals stay LTR even in Arabic. */}
                                <div
                                    className="shrink-0 flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgb(var(--primary) / 0.18), rgb(var(--primary-container) / 0.10))',
                                        border: '1px solid rgb(var(--primary) / 0.35)',
                                        color: 'rgb(var(--primary))',
                                    }}
                                >
                                    <span
                                        dir="ltr"
                                        className="font-display font-extrabold text-[18px] leading-none mb-0.5"
                                    >
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <Icon size={14} strokeWidth={2.4} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h3 className="font-headline font-extrabold text-on-surface text-[17px] md:text-[19px] tracking-tight leading-tight mb-1.5">
                                        {t(step.titleKey)}
                                    </h3>
                                    <p className="font-body text-on-surface/75 text-[14px] leading-relaxed mb-2">
                                        {t(step.bodyKey)}
                                    </p>
                                    {/* Hint line — muted, smaller. Carries
                                        the troubleshooting detail (spam,
                                        expiration, notification ask). */}
                                    <p
                                        className="font-body text-on-surface/45 text-[12.5px] leading-relaxed italic"
                                        style={{
                                            paddingInlineStart: 10,
                                            borderInlineStart: '2px solid rgb(var(--primary) / 0.30)',
                                        }}
                                    >
                                        {t(step.hintKey)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Primary CTA — go to sign in ──────────────────── */}
                <div className="text-center mb-10 bzt-rise-in" style={{ animationDelay: '450ms' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="bzt-press inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-label text-[12px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary"
                        style={{ boxShadow: '0 14px 32px rgb(var(--primary) / 0.32)' }}
                    >
                        {t('welcomePostPayCta')} <ArrowRight size={14} />
                    </button>
                </div>

                {/* ── Support footer ──────────────────────────────────
                    Below the CTA so it doesn't compete with the main
                    action. Anyone who scrolls past the steps and the
                    sign-in button has hit a problem — give them an
                    email to write to. */}
                <div
                    className="rounded-2xl p-5 flex items-start gap-3 bzt-rise-in"
                    style={{
                        animationDelay: '550ms',
                        background: 'rgb(var(--surface-container-lowest) / 0.60)',
                        border: '1px solid rgb(var(--outline-variant) / 0.25)',
                    }}
                >
                    <span
                        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                            background: 'rgb(var(--primary) / 0.14)',
                            color: 'rgb(var(--primary))',
                            border: '1px solid rgb(var(--primary) / 0.30)',
                        }}
                    >
                        <LifeBuoy size={15} strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0">
                        <div className="font-label text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary mb-1">
                            {t('welcomePostPaySupportTitle')}
                        </div>
                        <p className="font-body text-on-surface/70 text-[13px] leading-relaxed">
                            {t('welcomePostPaySupport')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
