import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { rateLimits } from '../lib/validation';
import { Lock, Mail, ChevronRight, Dumbbell, Users, Globe, Loader2, LogIn, ArrowLeft, Sun, Moon } from 'lucide-react';

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
            if (result.error) {
                setError(result.error);
            } else {
                navigate('/');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Show coach-disabled message above any local form error
    const displayError = authError || error;

    return (
        <div className="min-h-screen flex bg-surface text-on-surface" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Left Side - Branding */}
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative overflow-hidden bg-surface-container-lowest">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-surface to-surface" />
                {/* Slow ambient drift — feels alive without ever demanding attention. */}
                <div className="bzt-halo-drift absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" style={{ animationDuration: '22s' }} />
                <div className="bzt-halo-drift absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[80px]" style={{ animationDuration: '28s', animationDirection: 'reverse' }} />

                {/* Pre-login Language + Theme toggles */}
                <div
                    className="absolute top-6 z-20 flex items-center gap-2"
                    style={{ [isRTL ? 'left' : 'right']: 24, [isRTL ? 'right' : 'left']: 'auto' }}
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
                        className="bzt-press flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 hover:text-on-surface hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all shadow-sm"
                    >
                        <Globe size={16} />
                        <span>{lang === 'en' ? 'العربية' : 'English'}</span>
                    </button>
                </div>

                <div className="relative z-10 max-w-lg mx-auto w-full">
                    {/* Editorial wordmark + lockup */}
                    <div className="mb-14 bzt-rise-in">
                        <div className="flex items-center gap-3 mb-6">
                            <span
                                className="block w-8 h-px"
                                style={{ background: 'linear-gradient(90deg, rgb(var(--primary)), transparent)' }}
                            />
                            <p className="text-primary font-label uppercase tracking-[0.32em] text-[11px] font-extrabold">
                                BioZackTeam
                            </p>
                        </div>
                        <h1 className="text-[clamp(2.5rem,6vw,4.25rem)] font-headline font-extrabold text-on-surface tracking-[-0.035em] mb-5 leading-[0.95]">
                            {t('loginWelcome')}{' '}
                            <span className="text-gradient-gold">{t('appName')}</span>
                        </h1>
                        <p className="text-on-surface/65 text-lg md:text-xl font-body leading-relaxed max-w-md">
                            {t('loginSubtitle')}
                        </p>
                    </div>

                    {/* Editorial feature list — numbered, no decorative icon circles.
                        Numbers function as visual anchors; descriptions scan in <2s. */}
                    <ul className="space-y-1">
                        {[
                            { icon: Dumbbell, title: 'featureCoaching',  desc: 'featureCoachingDesc'  },
                            { icon: Users,    title: 'featureCommunity', desc: 'featureCommunityDesc' },
                            { icon: ChevronRight, title: 'featurePrograms', desc: 'featureProgramsDesc' },
                        ].map(({ icon: Icon, title, desc }, i) => (
                            <li
                                key={title}
                                className="bzt-rise-in flex items-start gap-5 py-4 group"
                                style={{ animationDelay: `${120 + i * 80}ms` }}
                            >
                                <span
                                    aria-hidden
                                    className="font-headline font-extrabold text-primary/70 group-hover:text-primary transition-colors text-[28px] leading-none tracking-tight tabular-nums shrink-0 w-12"
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <div className="flex-1 pt-3 border-t border-outline-variant/20">
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <Icon size={15} className="text-primary/80" />
                                        <h3 className="text-on-surface font-headline text-[19px] font-bold tracking-tight">
                                            {t(title)}
                                        </h3>
                                    </div>
                                    <p className="text-[13px] text-on-surface/55 leading-relaxed font-body">
                                        {t(desc)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Mobile-only sign in form (mirrors the desktop right panel) */}
                    <div className="md:hidden mt-12 bzt-rise-in" style={{ animationDelay: '320ms' }}>
                        <div
                            className="rounded-3xl bg-surface-container-high border border-outline-variant/40 p-6"
                            style={{ boxShadow: '0 24px 48px rgb(0 0 0 / 0.25)' }}
                        >
                            {displayError && (
                                <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-body font-medium leading-snug">
                                    {displayError}
                                </div>
                            )}

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <FieldInput icon={Mail}  type="email"    value={email}    onChange={setEmail}    placeholder="name@example.com" required />
                                <FieldInput icon={Lock}  type="password" value={password} onChange={setPassword} placeholder="••••••••"          required minLength={6} />

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bzt-press w-full px-6 py-4 rounded-2xl font-label text-[12px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-all"
                                    style={{ boxShadow: '0 12px 28px rgb(var(--primary) / 0.32)' }}
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={18} /> {t('signInButton')}</>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Sign In / Reset Form (Desktop) */}
            <div
                className="hidden md:flex w-1/2 p-8 items-center justify-center bg-surface relative"
                style={{
                    borderLeft: isRTL ? 'none' : '1px solid rgb(var(--outline-variant) / 0.30)',
                    borderRight: isRTL ? '1px solid rgb(var(--outline-variant) / 0.30)' : 'none',
                }}
            >
                {/* Quiet ambient halo on the form side, balances the left halos */}
                <div
                    className="bzt-halo-drift absolute -bottom-32 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
                    style={{ background: 'rgb(var(--primary) / 0.06)', animationDuration: '32s' }}
                />

                <div className="w-full max-w-sm relative z-10">
                    {showReset ? (
                        /* ── Password Reset Panel ── */
                        <div className="bzt-slide-in-right">
                            <button
                                onClick={() => { setShowReset(false); setError(''); setResetSent(false); }}
                                className="bzt-press flex items-center gap-2 text-on-surface/55 hover:text-primary text-[10px] mb-10 transition-colors font-label uppercase tracking-[0.18em] font-extrabold"
                            >
                                <ArrowLeft size={14} /> {t('backToSignIn')}
                            </button>
                            <div className="mb-10">
                                <h2 className="text-[40px] font-headline font-extrabold text-on-surface tracking-[-0.025em] leading-[1] mb-3">
                                    {t('resetPassword')}
                                </h2>
                                <p className="text-on-surface/55 font-body leading-relaxed">
                                    {t('resetPasswordDesc')}
                                </p>
                            </div>
                            {resetSent ? (
                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm text-center font-body font-medium">
                                    {t('resetEmailSent')}
                                </div>
                            ) : (
                                <>
                                    {error && <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-body font-medium">{error}</div>}
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
                                            className="bzt-press w-full px-6 py-4 rounded-2xl font-label text-[12px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-all"
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
                            <div className="mb-10">
                                <span className="block text-[10px] font-label font-extrabold uppercase tracking-[0.22em] text-primary mb-3">
                                    {t('signInButton')}
                                </span>
                                <h2 className="text-[40px] font-headline font-extrabold text-on-surface tracking-[-0.025em] leading-[1] mb-3">
                                    {t('loginSignIn')}
                                </h2>
                                <p className="text-on-surface/55 font-body leading-relaxed">
                                    {t('signInCredentials')}
                                </p>
                            </div>

                            {displayError && (
                                <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-body font-medium leading-snug">
                                    {displayError}
                                </div>
                            )}

                            <form className="space-y-5" onSubmit={handleSubmit}>
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
                                    className="bzt-press w-full px-6 py-4 rounded-2xl font-label text-[12px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-all"
                                    style={{ boxShadow: '0 12px 28px rgb(var(--primary) / 0.32)' }}
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={18} /> {t('signInButton')}</>}
                                </button>
                            </form>

                            <div className="mt-10 flex items-center gap-3">
                                <span className="flex-1 h-px bg-outline-variant/30" />
                                <span className="text-[10px] font-label font-bold uppercase tracking-[0.18em] text-on-surface/40">
                                    {t('noAccount')}
                                </span>
                                <span className="flex-1 h-px bg-outline-variant/30" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Form input primitives ─────────────────────────────────────────────────
// Two variants: simple (mobile, no label) and labeled (desktop). Both share
// the same focus treatment — gold border + subtle gold glow.
function FieldInput({ icon: Icon, type, value, onChange, placeholder, required, minLength }: {
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    type: 'email' | 'password';
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    required?: boolean;
    minLength?: number;
}) {
    return (
        <div className="relative">
            <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/55" />
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                minLength={minLength}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary focus:bg-surface-container rounded-xl py-3.5 pl-11 pr-4 text-[15px] font-body text-on-surface placeholder-on-surface/30 transition-all"
                style={{
                    // Match focus glow to brand gold without a heavy ring
                    boxShadow: undefined,
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 4px rgb(var(--primary) / 0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = ''; }}
            />
        </div>
    );
}

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
