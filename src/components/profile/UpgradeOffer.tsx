/**
 * UpgradeOffer — inline, single-offer coaching pitch for community users.
 *
 * Replaces the older "browse three tiers on a separate /pricing page"
 * model. Founder direction: show the user's CURRENT plan inline, then
 * make ONE sellable coaching offer that explains why coaching beats
 * community. No three-column comparison, no decision paralysis.
 *
 * Visual structure
 * ────────────────
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  YOUR PLAN                                               │
 *   │  Community member (free)                          [pill] │
 *   └──────────────────────────────────────────────────────────┘
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  READY FOR MORE?                                         │
 *   │  Get coached by Med, one-on-one.                         │
 *   │  ──────────────────────────────────────────────────────  │
 *   │  Sales paragraph contrasting community vs coaching.      │
 *   │                                                          │
 *   │  WHAT YOU HAVE       →     WHAT YOU UNLOCK               │
 *   │   • Videos                  • DM with Med                │
 *   │   • Programs                • Custom protocols           │
 *   │   • Weekly logs             • Weekly review              │
 *   │                             • Priority responses         │
 *   │                                                          │
 *   │  $149 / month                                            │
 *   │  Cancel anytime. Platform access included.               │
 *   │                                                          │
 *   │  [   Start coaching with Med   ]                         │
 *   │  ★ Already trusted by clients in 6 countries.            │
 *   └──────────────────────────────────────────────────────────┘
 *
 * The CTA opens the Stripe Payment Link in a new tab. The Stripe URL
 * is the same one wired into the legacy /pricing page so the checkout
 * flow doesn't change — only the entry surface does.
 *
 * Mounted on Profile.tsx for community users only (the sidebar's
 * Upgrade link routes there). Already-paying clients + coaches never
 * see this component.
 */
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    Sparkles, ArrowRight, MessageSquare, ClipboardCheck, Calendar,
} from 'lucide-react';

// Same Stripe Payment Link the legacy /pricing page used. Kept in this
// file as a constant rather than imported from the (now deprecated)
// Pricing page so this component can stand alone.
const STRIPE_COACHING_URL = 'https://buy.stripe.com/9B66oHexr8eOfNraEv0VO07';

const COACHING_PRICE_USD = 149;

function openCheckout() {
    window.open(STRIPE_COACHING_URL, '_blank', 'noopener,noreferrer');
}

export function UpgradeOffer() {
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();

    // Defensive — Profile already gates on user, but this component
    // is reusable, so we re-check.
    if (!user || user.role !== 'community') return null;

    // Three emotional benefits — each frames the unlock as a
    // transformation, not a feature. The 4th "priority response"
    // benefit was intentionally removed per founder direction so the
    // pitch doesn't read as a list of perks but as an offer about
    // who the user becomes once they accept it.
    const benefits = [
        { Icon: MessageSquare,  title: t('upgradeBenefit1Title'), sub: t('upgradeBenefit1Sub') },
        { Icon: ClipboardCheck, title: t('upgradeBenefit2Title'), sub: t('upgradeBenefit2Sub') },
        { Icon: Calendar,       title: t('upgradeBenefit3Title'), sub: t('upgradeBenefit3Sub') },
    ];

    return (
        <section className="space-y-5" aria-label="Coaching upgrade offer">
            {/* ── Current plan strip ────────────────────────────────
                Small, neutral. The point is "you are here" — not a
                victory banner. Founder direction was specifically NOT
                to make the free plan feel celebrated; we want the
                contrast with the offer below to do the persuasion. */}
            <div
                className="rounded-2xl border border-outline-variant/30 bg-surface-container-low px-5 py-4 flex items-center justify-between gap-4"
            >
                <div className="min-w-0">
                    <div className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-on-surface-variant mb-1">
                        {t('upgradeYourPlanEyebrow')}
                    </div>
                    <div className="font-headline font-bold text-on-surface text-[15px] truncate">
                        {t('communityMemberFree')}
                    </div>
                </div>
                <span
                    className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-[0.16em]"
                    style={{
                        background: 'rgb(var(--on-surface) / 0.06)',
                        color: 'rgb(var(--on-surface-variant))',
                        border: '1px solid rgb(var(--outline-variant) / 0.40)',
                    }}
                >
                    $0
                </span>
            </div>

            {/* ── The offer ─────────────────────────────────────────
                Big card. Gold-tinted gradient backdrop + ring to make
                it feel like an upgrade slot, not just another panel.
                All copy resolved through translations so Arabic users
                see Arabic.

                The flex direction stays default — `isRTL` flips it
                naturally via the document `dir`, so the price/CTA
                column sits on the visually-correct side in both
                languages. */}
            <div
                className="relative rounded-3xl overflow-hidden p-7 md:p-9"
                style={{
                    background: 'linear-gradient(135deg, rgb(var(--primary) / 0.16), rgb(var(--primary-container) / 0.08) 60%, rgb(var(--surface-container-low)))',
                    border: '1px solid rgb(var(--primary) / 0.30)',
                    boxShadow: '0 24px 60px -20px rgb(var(--primary) / 0.30), inset 0 1px 0 rgb(255 255 255 / 0.04)',
                }}
            >
                {/* Soft halo behind the heading row — anchors the
                    eye to the title without needing an image asset. */}
                <div
                    aria-hidden
                    className="absolute pointer-events-none"
                    style={{
                        top: -120,
                        [isRTL ? 'left' : 'right']: -80,
                        width: 360, height: 360,
                        background: 'radial-gradient(circle, rgb(var(--primary) / 0.22), transparent 65%)',
                        filter: 'blur(40px)',
                    }}
                />

                <div className="relative">
                    {/* Eyebrow + title ── editorial, deliberately
                        oversized so it doesn't read as "yet another
                        upsell card". */}
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-primary" />
                        <span className="font-label text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                            {t('upgradeOfferEyebrow')}
                        </span>
                    </div>
                    <h2 className="font-headline font-extrabold text-on-surface text-[32px] md:text-[40px] leading-[1.05] tracking-tight mb-5 max-w-2xl">
                        {t('upgradeOfferTitle')}
                    </h2>
                    <p className="font-body text-on-surface/75 text-[15px] md:text-base leading-relaxed mb-7 max-w-2xl">
                        {t('upgradeOfferSub')}
                    </p>

                    {/* Have-vs-unlock split ── a quick mental check so
                        the user sees the gap between their current
                        plan and what coaching adds. NOT a 3-column
                        feature comparison — just a 2-column "before /
                        after" framing. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-7">
                        <div
                            className="rounded-2xl p-4 md:p-5 border"
                            style={{
                                background: 'rgb(var(--surface-container-lowest) / 0.50)',
                                borderColor: 'rgb(var(--outline-variant) / 0.40)',
                            }}
                        >
                            <div className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-on-surface-variant mb-3">
                                {t('upgradeYouHave')}
                            </div>
                            <ul className="space-y-2 text-[13px] font-body text-on-surface/70">
                                <li>· {t('pfFeatLibrary')}</li>
                                <li>· {t('pfFeatPrograms')}</li>
                                <li>· {t('pfFeatProgress')}</li>
                                <li>· {t('pfFeatCommunity')}</li>
                            </ul>
                        </div>
                        <div
                            className="rounded-2xl p-4 md:p-5 border"
                            style={{
                                background: 'rgb(var(--primary) / 0.10)',
                                borderColor: 'rgb(var(--primary) / 0.35)',
                            }}
                        >
                            <div className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-primary mb-3">
                                {t('upgradeYouGet')}
                            </div>
                            <ul className="space-y-2.5">
                                {benefits.map(({ Icon, title }) => (
                                    <li key={title} className="flex items-start gap-2.5 text-[13px] font-body text-on-surface">
                                        <Icon size={14} className="text-primary shrink-0 mt-0.5" strokeWidth={2.4} />
                                        <span className="font-medium">{title}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Detailed benefit rows ── one paragraph per
                        unlock so the user can scan WHY each item
                        matters. This is the persuasive depth that the
                        old 3-column comparison was missing. */}
                    <div className="space-y-3 mb-8">
                        {benefits.map(({ Icon, title, sub }) => (
                            <div
                                key={title}
                                className="rounded-xl border p-4 flex items-start gap-3"
                                style={{
                                    background: 'rgb(var(--surface-container-lowest) / 0.40)',
                                    borderColor: 'rgb(var(--outline-variant) / 0.30)',
                                }}
                            >
                                <span
                                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                                    style={{
                                        background: 'rgb(var(--primary) / 0.14)',
                                        color: 'rgb(var(--primary))',
                                        border: '1px solid rgb(var(--primary) / 0.25)',
                                    }}
                                >
                                    <Icon size={16} strokeWidth={2.4} />
                                </span>
                                <div className="min-w-0">
                                    <div className="font-headline font-bold text-[14px] text-on-surface leading-tight">
                                        {title}
                                    </div>
                                    <p className="font-body text-[12.5px] text-on-surface/65 mt-1 leading-snug">
                                        {sub}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Price + CTA ── the price is shown big, single,
                        and uncomparable. No anchor against a higher
                        crossed-out number — the founder's brief is
                        "one offer, sellable", and price anchoring
                        belongs on the marketing page, not inside the
                        product. The numeral is wrapped in dir="ltr"
                        so "$149" reads correctly in Arabic context. */}
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-5">
                        <div>
                            <div className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-on-surface-variant mb-1.5">
                                {t('tierCoachingEyebrow')}
                            </div>
                            <div className="flex items-baseline gap-1.5" dir="ltr">
                                <span
                                    className="font-display font-extrabold text-on-surface tracking-tighter"
                                    style={{ fontSize: 56, lineHeight: 0.9 }}
                                >
                                    ${COACHING_PRICE_USD}
                                </span>
                                <span className="text-sm text-on-surface-variant font-body">
                                    {t('upgradePriceMonthly')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <p className="text-[12px] font-body text-on-surface/55 mb-5 max-w-md">
                        {t('upgradeBilledNote')}
                    </p>

                    <button
                        onClick={openCheckout}
                        className="bzt-press inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-4 rounded-2xl font-label text-[12px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                        style={{ boxShadow: '0 14px 32px rgb(var(--primary) / 0.34)' }}
                    >
                        {t('upgradeCta')}
                        <ArrowRight size={16} className="-mb-0.5" />
                    </button>

                    <p className="mt-5 text-[12px] font-body text-on-surface/55 flex items-center gap-2">
                        <Sparkles size={12} className="text-primary" />
                        {t('upgradeProofLine')}
                    </p>
                </div>
            </div>
        </section>
    );
}
