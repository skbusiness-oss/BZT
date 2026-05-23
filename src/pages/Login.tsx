/**
 * Login — pre-auth landing + sign-in.
 *
 * Founder direction (this revision): SHORT and exciting. Keep the
 * toggles, keep the form, drop the long marketing scroll. A returning
 * member should see one hero, four feature pills, a one-line stats
 * strip, and the sign-in panel — no scrolling required on desktop.
 *
 * Layout
 * ──────
 * Desktop:  2 columns — hero+pills+stats | sign-in panel
 * Mobile:   stacks, sign-in below hero
 *
 * Motion is intentionally light:
 *   - bzt-rise-in for the hero block + sign-in panel
 *   - bzt-halo-drift on the ambient gold halos behind everything
 *   - Hover lift on the pills
 *
 * Bilingual EN/AR. Numerals stay LTR even in Arabic via dir="ltr".
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { rateLimits } from '../lib/validation';
import { Link } from 'react-router-dom';
import {
    Lock, Mail, Globe, Loader2, LogIn, ArrowLeft, Sun, Moon,
    GraduationCap, Dumbbell, Utensils, MessageSquare,
    ArrowRight, type LucideIcon,
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
        if (result.error) setError(result.error);
        else setResetSent(true);
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

    // Four feature pills — icon + one-word label. The full descriptions
    // live inside the app (academy, workouts, diets, messages pages),
    // so the welcome page doesn't repeat them — it just teases.
    const pills: { Icon: LucideIcon; labelKey: string; accent: string }[] = [
        { Icon: GraduationCap, labelKey: 'navVideoLibrary', accent: 'rgb(16 185 129)'      /* emerald */ },
        { Icon: Dumbbell,      labelKey: 'navWorkouts',     accent: 'rgb(245 158 11)'      /* amber */ },
        { Icon: Utensils,      labelKey: 'navDiets',        accent: 'rgb(244 63 94)'       /* rose */ },
        { Icon: MessageSquare, labelKey: 'navMessages',     accent: 'rgb(var(--primary))'  /* gold */ },
    ];

    return (
        <div className="min-h-screen bg-surface text-on-surface relative overflow-hidden" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Ambient gold halos — just enough atmosphere */}
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

            {/* Top toolbar — language + theme toggles (same corner as before) */}
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

            {/* Main grid — single-screen experience on desktop */}
            <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14 min-h-screen flex items-center pt-24 pb-12 relative z-10">
                <div className="w-full grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-14">

                    {/* HERO + PILLS + STATS — left column */}
                    <div className="bzt-rise-in" style={{ animationDelay: '40ms' }}>
                        {/* Eyebrow */}
                        <div className="flex items-center gap-3 mb-5">
                            <span
                                aria-hidden
                                className="block w-8 h-px"
                                style={{ background: 'linear-gradient(90deg, rgb(var(--primary)), transparent)' }}
                            />
                            <span className="font-label text-[10px] font-extrabold uppercase tracking-[0.36em] text-primary">
                                {t('welcomeEyebrow')}
                            </span>
                        </div>

                        {/* Headline */}
                        <h1
                            className="font-display font-extrabold leading-[0.94] tracking-[-0.035em] text-on-surface mb-5"
                            style={{ fontSize: 'clamp(2.5rem, 6.4vw, 4.75rem)' }}
                        >
                            {t('welcomeHeroTitle')}
                        </h1>

                        {/* One-line tagline (replaces the long sub paragraph) */}
                        <p className="font-body text-on-surface/65 text-base md:text-lg leading-relaxed max-w-xl mb-8">
                            {t('welcomeTagline')}
                        </p>

                        {/* Four feature pills — single horizontal row, icons + labels.
                            Hovers lift them slightly. Wraps on small screens. */}
                        <div className="flex flex-wrap gap-2.5 mb-8">
                            {pills.map(({ Icon, labelKey, accent }) => (
                                <div
                                    key={labelKey}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full transition-transform duration-200 hover:-translate-y-0.5"
                                    style={{
                                        background: accent.replace(')', ' / 0.10)'),
                                        border: `1px solid ${accent.replace(')', ' / 0.30)')}`,
                                    }}
                                >
                                    <Icon size={14} style={{ color: accent }} strokeWidth={2.4} />
                                    <span
                                        className="font-label text-[11px] font-extrabold uppercase tracking-[0.16em]"
                                        style={{ color: accent }}
                                    >
                                        {t(labelKey)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Tight stats line — three numerals separated by gold dots.
                            Single row, no padding-heavy card. */}
                        <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-on-surface/70" dir="ltr">
                            <Stat num="100+" label={t('welcomeStatMembers')} />
                            <span aria-hidden className="w-1 h-1 rounded-full bg-primary/60" />
                            <Stat num="6"    label={t('welcomeStatCountries')} />
                            <span aria-hidden className="w-1 h-1 rounded-full bg-primary/60" />
                            <Stat num="100+" label={t('welcomeStatPrograms')} />
                        </div>
                    </div>

                    {/* SIGN-IN PANEL — right column on desktop, below on mobile */}
                    <aside
                        className="bzt-rise-in self-start"
                        style={{ animationDelay: '160ms' }}
                    >
                        <div
                            className="rounded-3xl p-7 md:p-8 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(160deg, rgb(var(--primary) / 0.12), rgb(var(--surface-container-low)) 55%)',
                                border: '1px solid rgb(var(--primary) / 0.30)',
                                boxShadow: '0 24px 60px -20px rgb(var(--primary) / 0.30), inset 0 1px 0 rgb(255 255 255 / 0.04)',
                            }}
                        >
                            <div
                                aria-hidden
                                className="absolute pointer-events-none"
                                style={{
                                    top: -80, [isRTL ? 'left' : 'right']: -80,
                                    width: 240, height: 240,
                                    background: 'radial-gradient(circle, rgb(var(--primary) / 0.32), transparent 65%)',
                                    filter: 'blur(30px)',
                                }}
                            />

                            <div className="relative">
                                {showReset ? (
                                    <div className="bzt-slide-in-right">
                                        <button
                                            onClick={() => { setShowReset(false); setError(''); setResetSent(false); }}
                                            className="bzt-press flex items-center gap-2 text-on-surface/55 hover:text-primary text-[10px] mb-6 transition-colors font-label uppercase tracking-[0.18em] font-extrabold"
                                        >
                                            <ArrowLeft size={14} /> {t('backToSignIn')}
                                        </button>
                                        <h2 className="font-display font-extrabold text-on-surface text-[28px] tracking-tight leading-[1] mb-3">
                                            {t('resetPassword')}
                                        </h2>
                                        <p className="text-on-surface/55 font-body text-sm leading-relaxed mb-6">
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
                                                <form className="space-y-4" onSubmit={handlePasswordReset}>
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
                                                        className="bzt-press w-full px-6 py-3.5 rounded-2xl font-label text-[12px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-all"
                                                        style={{ boxShadow: '0 12px 28px rgb(var(--primary) / 0.32)' }}
                                                    >
                                                        {resetLoading ? <Loader2 size={18} className="animate-spin" /> : t('sendResetLink')}
                                                    </button>
                                                </form>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bzt-slide-in-left">
                                        <div className="mb-6">
                                            <span className="block text-[10px] font-label font-extrabold uppercase tracking-[0.26em] text-primary mb-3">
                                                {t('welcomeReadyEyebrow')}
                                            </span>
                                            <h2 className="font-display font-extrabold text-on-surface text-[34px] md:text-[40px] tracking-tight leading-[0.95]">
                                                {t('welcomeReadyTitle')}
                                            </h2>
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

                                        <button
                                            type="button"
                                            onClick={() => navigate('/pricing')}
                                            className="bzt-press w-full mt-4 px-6 py-3 rounded-2xl font-label text-[11px] font-extrabold uppercase tracking-[0.18em] bg-surface-container border border-outline-variant/40 text-on-surface hover:bg-surface-container-high hover:border-primary/30 transition-all inline-flex items-center justify-center gap-2"
                                        >
                                            {t('welcomeCtaSeePlans')} <ArrowRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>

                {/* ── Legal footer ─────────────────────────────────────
                    Required link from the Stripe Checkout / payment-link
                    footers, and just good practice — first-time visitors
                    who paste the URL into a browser need to be one click
                    away from the policies they agreed to at checkout.
                    Sits at the very bottom of the page; muted styling so
                    it never competes with the sign-in CTA above. */}
                <footer className="mt-16 pb-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-on-surface/40 text-[11px] font-label font-bold uppercase tracking-[0.18em]">
                    <Link to="/terms" className="hover:text-primary transition-colors">{t('legalTermsLink')}</Link>
                    <span aria-hidden className="w-1 h-1 rounded-full bg-on-surface/20" />
                    <Link to="/privacy" className="hover:text-primary transition-colors">{t('legalPrivacyLink')}</Link>
                    <span aria-hidden className="w-1 h-1 rounded-full bg-on-surface/20" />
                    <Link to="/health-disclaimer" className="hover:text-primary transition-colors">{t('legalHealthLink')}</Link>
                </footer>
            </div>
        </div>
    );
};

// ─── Stat — single numeral + label, single line ─────────────────────────
function Stat({ num, label }: { num: string; label: string }) {
    return (
        <div className="inline-flex items-baseline gap-2">
            <span
                className="font-display font-extrabold tracking-tighter"
                style={{
                    fontSize: 28, lineHeight: 1,
                    background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
            >
                {num}
            </span>
            <span className="font-label text-[10px] uppercase tracking-[0.22em] text-on-surface/55 font-bold">
                {label}
            </span>
        </div>
    );
}

// ─── Form input primitive ─────────────────────────────────────────────────
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
