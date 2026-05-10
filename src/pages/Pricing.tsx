/**
 * Pricing — launch-day landing for the 3 active Stripe Payment Links.
 *
 *   - Platform Monthly      $35/mo  → Stripe Payment Link (always available)
 *   - Yearly Founding Rate  $199/yr → Stripe Payment Link (48-hour launch window)
 *   - Coaching with Med     $149/mo → Stripe Payment Link (always available)
 *
 * Each "Subscribe" button opens the Stripe-hosted checkout in a new tab.
 * After the customer pays, Stripe emails the team and a coach manually
 * upgrades `users/{uid}.role` in Firestore. Phase 2 (post-launch) wires a
 * webhook to do this automatically.
 *
 * The $299/yr tier is intentionally hidden — it only goes live AFTER the
 * 48-hour window closes, replacing the $199 tier.
 *
 * Bilingual (EN/AR). Uses `useLanguage()` for both copy + dir attribute.
 */
import { Sparkles, Check, Clock, Flame, Zap, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const STRIPE_LINKS = {
    monthly: 'https://buy.stripe.com/4gMdR99d78eO6cR4g70VO05',
    yearlyLaunch: 'https://buy.stripe.com/8x228rfBvdz8eJn13V0VO06',
    coaching: 'https://buy.stripe.com/9B66oHexr8eOfNraEv0VO07',
} as const;

const PLATFORM_FEATURE_KEYS = [
    'pfFeatLibrary',
    'pfFeatLiveCalls',
    'pfFeatCommunity',
    'pfFeatPrograms',
    'pfFeatDietCalc',
    'pfFeatProgress',
] as const;

const COACHING_FEATURE_KEYS = [
    'coFeatDM',
    'coFeatProtocols',
    'coFeatAccountability',
    'coFeatPlatform',
    'coFeatPriority',
] as const;

function openCheckout(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

export const Pricing = () => {
    const { user } = useAuth();
    const { t, lang, isRTL, setLang } = useLanguage();
    const isLoggedIn = !!user;

    return (
        <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className="animate-in fade-in duration-500 pb-24 max-w-7xl mx-auto px-4 md:px-0 relative"
        >

            {/* ── Big language toggle — prominent in the top corner so any
                visitor (Arabic-default) can flip to English instantly.
                The button label is always the OTHER language so the
                action is unambiguous: 'English' when on AR,
                'العربية' when on EN. */}
            <div className="flex justify-end pt-5 mb-4">
                <button
                    onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                    className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-gradient-to-r from-primary/20 to-primary-container/15 hover:from-primary/30 hover:to-primary-container/25 border-2 border-primary/50 hover:border-primary text-on-surface font-label text-[14px] font-extrabold uppercase tracking-[0.18em] shadow-lg shadow-primary/10 transition-all active:scale-[0.97]"
                    aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
                >
                    <Languages size={18} className="text-primary" />
                    {lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
                </button>
            </div>

            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="text-center mb-14 mt-4">
                <span className="text-primary font-headline font-bold text-xs tracking-[0.3em] uppercase mb-3 block">
                    {t('pricingEyebrow')}
                </span>
                <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tighter leading-none text-on-surface mb-5">
                    {t('pricingHeroLine1')}
                    <span className="text-primary-container">.</span>
                    <br />
                    <span className="text-primary">{t('pricingHeroLine2')}</span>
                </h1>
                <p className="text-on-surface-variant font-body leading-relaxed max-w-xl mx-auto text-base md:text-lg mb-2">
                    {t('pricingHeroSub')}
                </p>
                <p className="text-on-surface/50 font-body text-xs uppercase tracking-[0.18em]">
                    {t('pricingHeroFinePrint')}
                </p>

                {/* Launch window callout */}
                <div className="inline-flex items-center gap-2 mt-7 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-label text-[11px] font-bold uppercase tracking-[0.18em]">
                    <Clock size={14} />
                    {t('pricingLaunchBadge')}
                </div>
            </section>

            {/* ── Three tiers ─────────────────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">

                {/* MONTHLY ── $35 */}
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-7 flex flex-col">
                    <div>
                        <span className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-on-surface-variant block mb-3">
                            {t('tierMonthlyEyebrow')}
                        </span>
                        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-1">{t('tierMonthlyTitle')}</h2>
                        <p className="text-xs text-on-surface-variant font-body mb-5">
                            {t('tierMonthlyBlurb')}
                        </p>
                        <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="font-display font-extrabold text-5xl text-on-surface tracking-tighter">$35</span>
                            <span className="text-sm text-on-surface-variant font-body">{t('tierMonthlyUnit')}</span>
                        </div>
                        <div className="text-[11px] text-on-surface/40 font-body mb-6">{t('tierMonthlyBilling')}</div>

                        <ul className="space-y-2.5 mb-7">
                            {PLATFORM_FEATURE_KEYS.map(k => (
                                <li key={k} className="flex items-start gap-2.5 text-sm font-body text-on-surface/85">
                                    <Check size={15} className="text-primary shrink-0 mt-0.5" />
                                    <span>{t(k)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => openCheckout(STRIPE_LINKS.monthly)}
                        className="mt-auto w-full py-3.5 rounded-xl font-label text-[11px] font-bold uppercase tracking-[0.18em] bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 transition-all active:scale-[0.99]"
                    >
                        {t('tierMonthlyCta')}
                    </button>
                </div>

                {/* YEARLY LAUNCH ── $199 ── HERO */}
                <div className="relative rounded-2xl p-7 flex flex-col overflow-hidden md:scale-[1.04] md:-mt-2 md:mb-2">
                    {/* Gold gradient + glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary-container/10 to-transparent" />
                    <div className="absolute inset-0 ring-2 ring-primary rounded-2xl pointer-events-none shadow-[0_0_60px_-15px_rgba(230,195,100,0.5)]" />

                    {/* Badge */}
                    <div className="relative -mt-1 -mx-1 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-label text-[10px] font-extrabold uppercase tracking-[0.18em]">
                            <Flame size={11} /> {t('tierFoundingBadge')}
                        </span>
                    </div>

                    <div className="relative">
                        <span className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-primary block mb-3">
                            {t('tierFoundingEyebrow')}
                        </span>
                        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-1">{t('tierFoundingTitle')}</h2>
                        <p className="text-xs text-on-surface-variant font-body mb-5">
                            {t('tierFoundingBlurb')}
                        </p>
                        <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="font-display font-extrabold text-5xl text-primary tracking-tighter">$199</span>
                            <span className="text-sm text-on-surface-variant font-body">{t('tierFoundingUnit')}</span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant font-body mb-1">
                            {t('tierFoundingDailyPrefix')} <span className="text-primary font-bold">{t('tierFoundingDailyUsd')}</span> {t('tierFoundingDailyJoin')} <span className="text-primary font-bold">{t('tierFoundingDailyMad')}</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-body font-bold mb-6">
                            {t('tierFoundingSavings')}
                        </div>

                        <ul className="space-y-2.5 mb-7">
                            {PLATFORM_FEATURE_KEYS.map(k => (
                                <li key={k} className="flex items-start gap-2.5 text-sm font-body text-on-surface/85">
                                    <Check size={15} className="text-primary shrink-0 mt-0.5" />
                                    <span>{t(k)}</span>
                                </li>
                            ))}
                            <li className="flex items-start gap-2.5 text-sm font-body text-primary font-bold">
                                <Sparkles size={15} className="text-primary shrink-0 mt-0.5" />
                                <span>{t('tierFoundingLockedBullet')}</span>
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => openCheckout(STRIPE_LINKS.yearlyLaunch)}
                        className="relative mt-auto w-full py-3.5 rounded-xl font-label text-[11px] font-bold uppercase tracking-[0.18em] bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-[0.99]"
                    >
                        {t('tierFoundingCta')}
                    </button>
                </div>

                {/* COACHING ── $149 */}
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-7 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />

                    <div className="relative">
                        <span className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-purple-400 block mb-3">
                            {t('tierCoachingEyebrow')}
                        </span>
                        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-1">{t('tierCoachingTitle')}</h2>
                        <p className="text-xs text-on-surface-variant font-body mb-5">
                            {t('tierCoachingBlurb')}
                        </p>
                        <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="font-display font-extrabold text-5xl text-on-surface tracking-tighter">$149</span>
                            <span className="text-sm text-on-surface-variant font-body">{t('tierCoachingUnit')}</span>
                        </div>
                        <div className="text-[11px] text-on-surface/40 font-body mb-6">
                            {t('tierCoachingBundled')}
                        </div>

                        <ul className="space-y-2.5 mb-7">
                            {COACHING_FEATURE_KEYS.map(k => (
                                <li key={k} className="flex items-start gap-2.5 text-sm font-body text-on-surface/85">
                                    <Check size={15} className="text-purple-400 shrink-0 mt-0.5" />
                                    <span>{t(k)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => openCheckout(STRIPE_LINKS.coaching)}
                        className="relative mt-auto w-full py-3.5 rounded-xl font-label text-[11px] font-bold uppercase tracking-[0.18em] bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-400/40 transition-all active:scale-[0.99]"
                    >
                        {t('tierCoachingCta')}
                    </button>
                </div>
            </section>

            {/* ── How activation works ─────────────────────────── */}
            <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant/25 p-6 md:p-8 mb-10">
                <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                        <Zap size={20} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-headline font-extrabold text-lg text-on-surface mb-2">{t('pricingHowTitle')}</h3>
                        <ol className={`space-y-2 text-sm font-body text-on-surface/80 list-decimal ${isRTL ? 'pr-5' : 'pl-5'}`}>
                            <li>{t('pricingHowStep1')}</li>
                            <li>{t('pricingHowStep2')}</li>
                            <li>{isLoggedIn ? t('pricingHowStep3LoggedIn') : t('pricingHowStep3Guest')}</li>
                            <li>{t('pricingHowStep4')}</li>
                        </ol>
                        <p className="mt-4 text-[12px] text-on-surface/50 font-body">
                            {t('pricingHowSupport')} <a href="mailto:zack@biozack.com" className="text-primary hover:underline">zack@biozack.com</a>{lang === 'ar' ? '' : ' '}{t('pricingHowSupportSuffix')}
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Footer fine print ────────────────────────────── */}
            <p className="text-center text-[11px] font-body text-on-surface/40 leading-relaxed max-w-2xl mx-auto">
                {t('pricingFinePrint')}
            </p>
        </div>
    );
};
