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
 * Messaging & savings calculations follow `Pricing Spec Final.pdf` exactly.
 */
import { Sparkles, Check, Clock, Flame, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STRIPE_LINKS = {
    monthly: 'https://buy.stripe.com/4gMdR99d78eO6cR4g70VO05',
    yearlyLaunch: 'https://buy.stripe.com/8x228rfBvdz8eJn13V0VO06',
    coaching: 'https://buy.stripe.com/9B66oHexr8eOfNraEv0VO07',
} as const;

const PLATFORM_FEATURES = [
    'Full Zero-to-Hero Academy library',
    'Weekly live group calls',
    'Community + monthly Q&A',
    '100+ training programs',
    'Diet calculator + meal plans',
    'Progress tracking + check-ins',
];

const COACHING_FEATURES = [
    'Direct messaging with Dr. Med',
    'Custom training + diet protocols',
    'Ongoing accountability',
    'Platform access included — no extra fee',
    'Priority response window',
];

function openCheckout(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

export const Pricing = () => {
    const { user } = useAuth();
    const isLoggedIn = !!user;

    return (
        <div className="animate-in fade-in duration-500 pb-24 max-w-7xl mx-auto px-4 md:px-0">

            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="text-center mb-14 mt-4">
                <span className="text-primary font-headline font-bold text-xs tracking-[0.3em] uppercase mb-3 block">
                    Founding Member Launch
                </span>
                <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tighter leading-none text-on-surface mb-5">
                    Just 5 dirhams
                    <span className="text-primary-container">.</span>
                    <br />
                    <span className="text-primary">A day.</span>
                </h1>
                <p className="text-on-surface-variant font-body leading-relaxed max-w-xl mx-auto text-base md:text-lg mb-2">
                    Everything Dr. Med has built — the full system, his community, and the protocols
                    that built 200+ champions.
                </p>
                <p className="text-on-surface/50 font-body text-xs uppercase tracking-[0.18em]">
                    Cancel anytime · 7-day refund · Stripe checkout
                </p>

                {/* Launch window callout */}
                <div className="inline-flex items-center gap-2 mt-7 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-label text-[11px] font-bold uppercase tracking-[0.18em]">
                    <Clock size={14} />
                    48-hour founding rate · locked for life
                </div>
            </section>

            {/* ── Three tiers ─────────────────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">

                {/* MONTHLY ── $35 */}
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-7 flex flex-col">
                    <div>
                        <span className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-on-surface-variant block mb-3">
                            Pay as you go
                        </span>
                        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-1">Monthly</h2>
                        <p className="text-xs text-on-surface-variant font-body mb-5">
                            Recurring monthly. Cancel anytime.
                        </p>
                        <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="font-display font-extrabold text-5xl text-on-surface tracking-tighter">$35</span>
                            <span className="text-sm text-on-surface-variant font-body">/ month</span>
                        </div>
                        <div className="text-[11px] text-on-surface/40 font-body mb-6">USD · billed monthly</div>

                        <ul className="space-y-2.5 mb-7">
                            {PLATFORM_FEATURES.map(f => (
                                <li key={f} className="flex items-start gap-2.5 text-sm font-body text-on-surface/85">
                                    <Check size={15} className="text-primary shrink-0 mt-0.5" />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => openCheckout(STRIPE_LINKS.monthly)}
                        className="mt-auto w-full py-3.5 rounded-xl font-label text-[11px] font-bold uppercase tracking-[0.18em] bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 transition-all active:scale-[0.99]"
                    >
                        Start monthly
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
                            <Flame size={11} /> Founding rate · 48h only
                        </span>
                    </div>

                    <div className="relative">
                        <span className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-primary block mb-3">
                            Yearly · Founding rate
                        </span>
                        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-1">Yearly Founding</h2>
                        <p className="text-xs text-on-surface-variant font-body mb-5">
                            Locked for life. As long as you stay subscribed, you keep $199/yr forever.
                        </p>
                        <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="font-display font-extrabold text-5xl text-primary tracking-tighter">$199</span>
                            <span className="text-sm text-on-surface-variant font-body">/ year</span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant font-body mb-1">
                            ≈ <span className="text-primary font-bold">$0.55 / day</span> · just <span className="text-primary font-bold">5 MAD / day</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-body font-bold mb-6">
                            Save $221 vs monthly · 53% off
                        </div>

                        <ul className="space-y-2.5 mb-7">
                            {PLATFORM_FEATURES.map(f => (
                                <li key={f} className="flex items-start gap-2.5 text-sm font-body text-on-surface/85">
                                    <Check size={15} className="text-primary shrink-0 mt-0.5" />
                                    <span>{f}</span>
                                </li>
                            ))}
                            <li className="flex items-start gap-2.5 text-sm font-body text-primary font-bold">
                                <Sparkles size={15} className="text-primary shrink-0 mt-0.5" />
                                <span>Founding-member rate locked for life</span>
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => openCheckout(STRIPE_LINKS.yearlyLaunch)}
                        className="relative mt-auto w-full py-3.5 rounded-xl font-label text-[11px] font-bold uppercase tracking-[0.18em] bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-[0.99]"
                    >
                        Lock in $199 · 48h only
                    </button>
                </div>

                {/* COACHING ── $149 */}
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-7 flex flex-col relative overflow-hidden">
                    {/* Subtle accent for coaching */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />

                    <div className="relative">
                        <span className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-purple-400 block mb-3">
                            Personal Coaching
                        </span>
                        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-1">Coaching with Med</h2>
                        <p className="text-xs text-on-surface-variant font-body mb-5">
                            Direct messages, custom protocols, ongoing accountability.
                        </p>
                        <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="font-display font-extrabold text-5xl text-on-surface tracking-tighter">$149</span>
                            <span className="text-sm text-on-surface-variant font-body">/ month</span>
                        </div>
                        <div className="text-[11px] text-on-surface/40 font-body mb-6">
                            Platform access included · no extra fee
                        </div>

                        <ul className="space-y-2.5 mb-7">
                            {COACHING_FEATURES.map(f => (
                                <li key={f} className="flex items-start gap-2.5 text-sm font-body text-on-surface/85">
                                    <Check size={15} className="text-purple-400 shrink-0 mt-0.5" />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => openCheckout(STRIPE_LINKS.coaching)}
                        className="relative mt-auto w-full py-3.5 rounded-xl font-label text-[11px] font-bold uppercase tracking-[0.18em] bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-400/40 transition-all active:scale-[0.99]"
                    >
                        Start coaching
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
                        <h3 className="font-headline font-extrabold text-lg text-on-surface mb-2">How it works</h3>
                        <ol className="space-y-2 text-sm font-body text-on-surface/80 list-decimal pl-5">
                            <li>Click your tier above → Stripe checkout opens in a new tab.</li>
                            <li>Pay with card, Apple Pay, or Google Pay — Stripe handles everything secure.</li>
                            <li>{isLoggedIn
                                ? 'Your account is upgraded by the team within 1 hour. You\'ll get an email confirming access.'
                                : 'Create your account at /login first, then come back. Your account is upgraded within 1 hour of payment.'}</li>
                            <li>Sign in to the platform — full access unlocked.</li>
                        </ol>
                        <p className="mt-4 text-[12px] text-on-surface/50 font-body">
                            7-day no-questions refund. Email <a href="mailto:zack@biozack.com" className="text-primary hover:underline">zack@biozack.com</a> for support.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Footer fine print ────────────────────────────── */}
            <p className="text-center text-[11px] font-body text-on-surface/40 leading-relaxed max-w-2xl mx-auto">
                Prices in USD. Stripe Tax automatically handles VAT for international buyers.
                Yearly subscribers can cancel anytime — access continues until the end of the paid period.
                Founding-member rate persists on every renewal as long as the subscription stays active.
            </p>
        </div>
    );
};
