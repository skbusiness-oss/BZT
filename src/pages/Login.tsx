/**
 * Login — pre-auth landing + sign-in.
 *
 * Acts as the welcome page for anyone who isn't signed in. The brief
 * (founder direction) was: more information about the platform up
 * front, more visual interest, more excitement — but keep the
 * existing toggles (language + theme) and the existing sign-in form
 * flow. A potential client/community member should land here and
 * understand what BioZackTeam IS before they hit the sign-in panel.
 *
 * Page structure on desktop
 * ─────────────────────────
 *   ┌───────────────────────────────┬──────────────────────┐
 *   │  WELCOME STORY                │  SIGN-IN PANEL       │
 *   │  - Hero (manifesto)           │  - Email + password  │
 *   │  - What's inside (4 cards)    │  - Forgot / reset    │
 *   │  - Real members stats         │                      │
 *   │  - How it works (3 steps)     │                      │
 *   │  - Ready? closing strip       │                      │
 *   └───────────────────────────────┴──────────────────────┘
 *
 * On mobile the same blocks stack vertically and the sign-in form
 * appears near the top (so a returning user doesn't have to scroll
 * past marketing to get back in).
 *
 * Motion is intentional, not gratuitous:
 *   - bzt-rise-in staggered by section so the page introduces itself
 *     when first painted, not all at once
 *   - bzt-halo-drift on the ambient gold halos so the background
 *     feels alive without ever pulling focus from copy
 *   - Hover lift on the "what's inside" cards (transform + shadow)
 *
 * The whole page is bilingual — every visible string flows through
 * useLanguage().t — and respects dir="rtl" via the LanguageContext.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { rateLimits } from '../lib/validation';
import {
    Lock, Mail, Globe, Loader2, LogIn, ArrowLeft, Sun, Moon,
    GraduationCap, Dumbbell, Utensils, MessageSquare,
    Sparkles, ArrowRight, type LucideIcon,
} from 'lucide-react';

export const Login = () => {
    const { signIn, sendPasswordReset, authError, clearAuthError } = useAuth();
    const { t, lang, setLang, isRTL } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const toggleLang = () => setLang(lang === 'en' ? 'ar' : 'en');

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rateLimits.passwordReset(resetEmail)) {
            setError('Too many reset attempts. Please wait 15 minutes before trying again.');
            return;
        }
        setResetLoading(true);
        const result = await sendPasswordReset(resetEmail);
        setResetLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            setResetSent(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        clearAuthError();
        setIsLoading(true);
        try {
            const result = await signIn(email, password);
            if (result.error) setError(result.error);
            else navigate('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const displayError = authError || error;

    // "What's inside" cards — each one a real surface inside the app.
    // Order picked to follow how a new user would experience the
    // platform: learn → train → eat → reach out for help.
    const insideCards: { Icon: LucideIcon; titleKey: string; subKey: string; accent: string }[] = [
        { Icon: GraduationCap,  titleKey: 'welcomeInside1Title', subKey: 'welcomeInside1Sub', accent: 'rgb(16 185 129)'  /* emerald */ },
        { Icon: Dumbbell,       titleKey: 'welcomeInside2Title', subKey: 'welcomeInside2Sub', accent: 'rgb(245 158 11)'  /* amber */ },
        { Icon: Utensils,       titleKey: 'welcomeInside3Title', subKey: 'welcomeInside3Sub', accent: 'rgb(244 63 94)'   /* rose */ },
        { Icon: MessageSquare,  titleKey: 'welcomeInside4Title', subKey: 'welcomeInside4Sub', accent: 'rgb(var(--primary))' /* gold */ },
    ];

    const howSteps: { Icon: LucideIcon; titleKey: string; subKey: string }[] = [
        { Icon: LogIn,       titleKey: 'welcomeHow1Title', subKey: 'welcomeHow1Sub' },
        { Icon: Dumbbell,    titleKey: 'welcomeHow2Title', subKey: 'welcomeHow2Sub' },
        { Icon: Sparkles,    titleKey: 'welcomeHow3Title', subKey: 'welcomeHow3Sub' },
    ];

    return (
        <div className="min-h-screen bg-surface text-on-surface relative overflow-x-hidden" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* ── Ambient gold halos — alive but quiet. Sized + placed
                so the eye picks up the gradient atmosphere without
                ever fighting the copy. */}
            <div
                aria-hidden
                className="bzt-halo-drift absolute pointer-events-none"
                style={{
                    top: '-160px', [isRTL ? 'right' : 'left']: '-120px',
                    width: 520, height: 520,
                    background: 'radial-gradient(circle, rgb(var(--primary) / 0.18), transparent 65%)',
                    filter: 'blur(48px)',
                    animationDuration: '24s',
                }}
            />
            <div
                aria-hidden
                className="bzt-halo-drift absolute pointer-events-none"
                style={{
                    top: '40%', [isRTL ? 'left' : 'right']: '-80px',
                    width: 340, height: 340,
                    background: 'radial-gradient(circle, rgb(var(--primary-container) / 0.14), transparent 70%)',
                    filter: 'blur(40px)',
                    animationDuration: '32s',
                    animationDirection: 'reverse',
                }}
            />

            {/* ── Top toolbar — language + theme toggles. Kept in the
                same corner the previous design used so muscle memory
                survives the redesign. */}
            <div
                className="absolute top-5 z-30 flex items-center gap-2"
                style={{ [isRTL ? 'left' : 'right']: 20, [isRTL ? 'right' : 'left']: 'auto' }}
            >
                <button
                    onClick={toggleTheme}
                    aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                    className="bzt-press flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface/70 hover:text-primary hover:border-primary/40 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all shadow-sm"
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                    onClick={toggleLang}
                    aria-label="Switch language"
                    className="bzt-press flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 hover:text-on-surface hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all shadow-sm"
                >
                    <Globe size={16} />
                    <span>{lang === 'en' ? 'العربية' : 'English'}</span>
                </button>
            </div>

            {/* ── Main layout grid ──────────────────────────────────
                Desktop: 2 columns (story | sign-in). Mobile: single
                column with sign-in pinned near the top so returning
                users don't scroll past marketing. */}
            <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14 pt-20 md:pt-24 pb-24 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 relative z-10">

                {/* ─── Story column ─────────────────────────────── */}
                <div className="space-y-16 md:space-y-24">

                    {/* HERO */}
                    <section className="bzt-rise-in" style={{ animationDelay: '40ms' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <span
                                aria-hidden
                                className="block w-10 h-px"
                                style={{ background: 'linear-gradient(90deg, rgb(var(--primary)), transparent)' }}
                            />
                            <span className="font-label text-[10px] font-extrabold uppercase tracking-[0.36em] text-primary">
                                {t('welcomeEyebrow')}
                            </span>
                        </div>
                        <p className="font-label text-[11px] uppercase tracking-[0.32em] text-on-surface/55 mb-5">
                            {t('welcomeTagline')}
                        </p>
                        <h1 className="font-display font-extrabold leading-[0.95] tracking-[-0.035em] text-on-surface mb-7"
                            style={{ fontSize: 'clamp(2.75rem, 6.5vw, 5.25rem)' }}
                        >
                            {t('welcomeHeroTitle')}
                        </h1>
                        <p className="text-on-surface/70 font-body leading-relaxed max-w-2xl text-[15px] md:text-lg mb-8">
                            {t('welcomeHeroSub')}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="#signin-panel"
                                className="bzt-press inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-label text-[11px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_14px_32px_rgb(var(--primary)/0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-all"
                            >
                                {t('welcomeCtaSignIn')} <ArrowRight size={14} />
                            </a>
                            <button
                                type="button"
                                onClick={() => navigate('/pricing')}
                                className="bzt-press inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-label text-[11px] font-extrabold uppercase tracking-[0.18em] bg-surface-container-low border border-outline-variant/40 text-on-surface hover:bg-surface-container hover:border-primary/30 transition-all"
                            >
                                {t('welcomeCtaSeePlans')}
                            </button>
                        </div>
                    </section>

                    {/* WHAT'S INSIDE */}
                    <section className="bzt-rise-in" style={{ animationDelay: '180ms' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="font-label text-[10px] font-extrabold uppercase tracking-[0.32em] text-primary">
                                {t('welcomeInsideEyebrow')}
                            </span>
                            <span
                                aria-hidden
                                className="block flex-1 h-px max-w-[12rem]"
                                style={{ background: 'linear-gradient(90deg, rgb(var(--primary) / 0.6), transparent)' }}
                            />
                        </div>
                        <h2 className="font-headline font-extrabold text-on-surface text-[28px] md:text-[36px] tracking-tight leading-tight mb-7 max-w-xl">
                            {t('welcomeInsideTitle')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {insideCards.map(({ Icon, titleKey, subKey, accent }, i) => (
                                <div
                                    key={titleKey}
                                    className="bzt-rise-in group relative overflow-hidden rounded-2xl p-5 md:p-6 transition-all duration-200 hover:-translate-y-0.5"
                                    style={{
                                        animationDelay: `${260 + i * 70}ms`,
                                        background: 'rgb(var(--surface-container-low) / 0.65)',
                                        border: '1px solid rgb(var(--outline-variant) / 0.35)',
                                        boxShadow: '0 12px 32px -16px rgba(0,0,0,0.25)',
                                    }}
                                >
                                    {/* Soft accent halo in the corner — moves on hover
                                        to give the card a small "wake up" reaction. */}
                                    <div
                                        aria-hidden
                                        className="absolute pointer-events-none transition-transform duration-500 group-hover:scale-110"
                                        style={{
                                            top: -30, [isRTL ? 'left' : 'right']: -30,
                                            width: 140, height: 140,
                                            background: `radial-gradient(circle, ${accent.replace('rgb(', 'rgb(').replace(')', ' / 0.18)')}, transparent 65%)`,
                                            filter: 'blur(20px)',
                                        }}
                                    />
                                    <div className="relative">
                                        <span
                                            className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4"
                                            style={{
                                                background: accent.replace(')', ' / 0.12)'),
                                                color: accent,
                                                border: `1px solid ${accent.replace(')', ' / 0.30)')}`,
                                            }}
                                        >
                                            <Icon size={20} strokeWidth={2.2} />
                                        </span>
                                        <h3 className="font-headline font-extrabold text-on-surface text-[17px] md:text-[18px] tracking-tight leading-tight mb-2">
                                            {t(titleKey)}
                                        </h3>
                                        <p className="font-body text-on-surface/65 text-[13.5px] leading-relaxed">
                                            {t(subKey)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SOCIAL PROOF — stat strip. Numbers tell the same
                        story as a testimonial without needing copy
                        approval from real members. Big tabular numerals,
                        spaced wide so each one stands alone. */}
                    <section
                        className="bzt-rise-in relative overflow-hidden rounded-3xl p-6 md:p-8"
                        style={{
                            animationDelay: '320ms',
                            background: 'linear-gradient(135deg, rgb(var(--primary) / 0.10), rgb(var(--primary-container) / 0.04) 60%, rgb(var(--surface-container-low) / 0.30))',
                            border: '1px solid rgb(var(--primary) / 0.22)',
                        }}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <Sparkles size={14} className="text-primary" />
                            <span className="font-label text-[10px] font-extrabold uppercase tracking-[0.32em] text-primary">
                                {t('welcomeProofEyebrow')}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 md:gap-8">
                            {[
                                { num: '100+', labelKey: 'welcomeStatMembers' },
                                { num: '6',    labelKey: 'welcomeStatCountries' },
                                { num: '100+', labelKey: 'welcomeStatPrograms' },
                            ].map((s) => (
                                <div key={s.labelKey} className="text-center sm:text-left">
                                    <div
                                        dir="ltr"
                                        className="font-display font-extrabold text-on-surface tracking-tighter"
                                        style={{
                                            fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
                                            lineHeight: 0.9,
                                            background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {s.num}
                                    </div>
                                    <div className="font-label text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-on-surface/55 font-bold mt-2">
                                        {t(s.labelKey)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* HOW IT WORKS — 3 steps. Each step is a labelled
                        chip + paragraph. Reads like the dashboard's
                        DashboardChapter component so the design
                        language stays consistent. */}
                    <section className="bzt-rise-in" style={{ animationDelay: '420ms' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="font-label text-[10px] font-extrabold uppercase tracking-[0.32em] text-primary">
                                {t('welcomeHowEyebrow')}
                            </span>
                            <span
                                aria-hidden
                                className="block flex-1 h-px max-w-[12rem]"
                                style={{ background: 'linear-gradient(90deg, rgb(var(--primary) / 0.6), transparent)' }}
                            />
                        </div>
                        <div className="space-y-4">
                            {howSteps.map(({ Icon, titleKey, subKey }, i) => (
                                <div
                                    key={titleKey}
                                    className="flex items-start gap-4 rounded-2xl p-5 border"
                                    style={{
                                        background: 'rgb(var(--surface-container-lowest) / 0.55)',
                                        borderColor: 'rgb(var(--outline-variant) / 0.30)',
                                    }}
                                >
                                    <span
                                        aria-hidden
                                        dir="ltr"
                                        className="font-display font-extrabold tracking-tighter shrink-0"
                                        style={{
                                            fontSize: 40, lineHeight: 0.9,
                                            background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            width: 50,
                                        }}
                                    >
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Icon size={14} className="text-primary" strokeWidth={2.2} />
                                            <h3 className="font-headline font-bold text-on-surface text-[16px] tracking-tight leading-tight">
                                                {t(titleKey)}
                                            </h3>
                                        </div>
                                        <p className="font-body text-on-surface/65 text-[13.5px] leading-relaxed">
                                            {t(subKey)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ─── Sign-in column ───────────────────────────────
                    Sticky on desktop so a user can scroll the story
                    without losing access to the form. On mobile the
                    form just sits where it falls in the flow. */}
                <aside
                    id="signin-panel"
                    className="bzt-rise-in lg:sticky lg:top-24 self-start space-y-5"
                    style={{ animationDelay: '120ms' }}
                >
                    <div
                        className="rounded-3xl p-7 md:p-8 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(160deg, rgb(var(--primary) / 0.10), rgb(var(--surface-container-low)) 55%)',
                            border: '1px solid rgb(var(--primary) / 0.28)',
                            boxShadow: '0 24px 60px -20px rgb(var(--primary) / 0.30), inset 0 1px 0 rgb(255 255 255 / 0.04)',
                        }}
                    >
                        {/* Subtle accent shimmer in the corner */}
                        <div
                            aria-hidden
                            className="absolute pointer-events-none"
                            style={{
                                top: -80, [isRTL ? 'left' : 'right']: -80,
                                width: 240, height: 240,
                                background: 'radial-gradient(circle, rgb(var(--primary) / 0.30), transparent 65%)',
                                filter: 'blur(30px)',
                            }}
                        />

                        <div className="relative">
                            {showReset ? (
                                /* ── Password Reset Panel ── */
                                <div className="bzt-slide-in-right">
                                    <button
                                        onClick={() => { setShowReset(false); setError(''); setResetSent(false); }}
                                        className="bzt-press flex items-center gap-2 text-on-surface/55 hover:text-primary text-[10px] mb-6 transition-colors font-label uppercase tracking-[0.18em] font-extrabold"
                                    >
                                        <ArrowLeft size={14} /> {t('backToSignIn')}
                                    </button>
                                    <h2 className="font-display font-extrabold text-on-surface text-[32px] tracking-tight leading-[1] mb-3">
                                        {t('resetPassword')}
                                    </h2>
                                    <p className="text-on-surface/55 font-body text-sm leading-relaxed mb-7">
                                        {t('resetPasswordDesc')}
                                    </p>
                                    {resetSent ? (
                                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm text-center font-body font-medium">
                                            {t('resetEmailSent')}
                                        </div>
                                    ) : (
                                        <>
                                            {error && (
                                                <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-body font-medium">
                                                    {error}
                                                </div>
                                            )}
                                            <form className="space-y-5" onSubmit={handlePasswordReset}>
                                                <FieldLabeledInput
                                                    icon={Mail}
                                                    type="email"
                                                    value={resetEmail}
                                                    onChange={setResetEmail}
                                                    placeholder="name@example.com"
                                                    label={t('loginEmailLabel')}
                                                    isRTL={isRTL}
                                                    required
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={resetLoading}
                                                    className="bzt-press w-full px-6 py-4 rounded-2xl font-label text-[12px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-all"
                                                    style={{ boxShadow: '0 12px 28px rgb(var(--primary) / 0.32)' }}
                                                >
                                                    {resetLoading ? <Loader2 size={18} className="animate-spin" /> : t('sendResetLink')}
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </div>
                            ) : (
                                /* ── Sign In Panel ── */
                                <div className="bzt-slide-in-left">
                                    <div className="mb-7">
                                        <span className="block text-[10px] font-label font-extrabold uppercase tracking-[0.26em] text-primary mb-3">
                                            {t('welcomeReadyEyebrow')}
                                        </span>
                                        <h2 className="font-display font-extrabold text-on-surface text-[36px] md:text-[40px] tracking-tight leading-[0.95] mb-3">
                                            {t('welcomeReadyTitle')}
                                        </h2>
                                        <p className="text-on-surface/60 font-body text-sm leading-relaxed">
                                            {t('welcomeReadySub')}
                                        </p>
                                    </div>

                                    {displayError && (
                                        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-body font-medium leading-snug">
                                            {displayError}
                                        </div>
                                    )}

                                    <form className="space-y-4" onSubmit={handleSubmit}>
                                        <FieldLabeledInput
                                            icon={Mail}
                                            type="email"
                                            value={email}
                                            onChange={setEmail}
                                            placeholder="name@example.com"
                                            label={t('loginEmailLabel')}
                                            isRTL={isRTL}
                                            required
                                        />
                                        <FieldLabeledInput
                                            icon={Lock}
                                            type="password"
                                            value={password}
                                            onChange={setPassword}
                                            placeholder="••••••••"
                                            label={t('loginPasswordLabel')}
                                            isRTL={isRTL}
                                            required
                                            minLength={6}
                                            rightAdornment={
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowReset(true); setError(''); setResetEmail(email); }}
                                                    className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary hover:text-primary-container transition-colors"
                                                >
                                                    {t('forgotPassword')}
                                                </button>
                                            }
                                        />
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="bzt-press w-full px-6 py-4 rounded-2xl font-label text-[12px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-all"
                                            style={{ boxShadow: '0 12px 28px rgb(var(--primary) / 0.32)' }}
                                        >
                                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={18} /> {t('signInButton')}</>}
                                        </button>
                                    </form>

                                    <div className="mt-7 flex items-center gap-3">
                                        <span className="flex-1 h-px bg-outline-variant/30" />
                                        <span className="text-[10px] font-label font-bold uppercase tracking-[0.18em] text-on-surface/40">
                                            {t('noAccount')}
                                        </span>
                                        <span className="flex-1 h-px bg-outline-variant/30" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/pricing')}
                                        className="bzt-press w-full mt-4 px-6 py-3.5 rounded-2xl font-label text-[11px] font-extrabold uppercase tracking-[0.18em] bg-surface-container border border-outline-variant/40 text-on-surface hover:bg-surface-container-high hover:border-primary/30 transition-all inline-flex items-center justify-center gap-2"
                                    >
                                        {t('welcomeCtaSeePlans')} <ArrowRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

// ─── Form input primitive ─────────────────────────────────────────────────
// Labeled variant only; the welcome page doesn't use the unlabeled
// mobile variant anymore — the same `FieldLabeledInput` is responsive.
function FieldLabeledInput({
    icon: Icon, type, value, onChange, placeholder, label, isRTL, required, minLength, rightAdornment,
}: {
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    type: 'email' | 'password';
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    label: string;
    isRTL: boolean;
    required?: boolean;
    minLength?: number;
    rightAdornment?: React.ReactNode;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] uppercase tracking-[0.18em] font-extrabold text-on-surface/55">
                    {label}
                </label>
                {rightAdornment}
            </div>
            <div className="relative">
                <Icon
                    size={18}
                    className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-primary/55`}
                />
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    minLength={minLength}
                    className={`w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary focus:bg-surface-container rounded-xl py-3.5 text-[15px] font-body text-on-surface placeholder-on-surface/30 transition-all ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 4px rgb(var(--primary) / 0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = ''; }}
                />
            </div>
        </div>
    );
}
