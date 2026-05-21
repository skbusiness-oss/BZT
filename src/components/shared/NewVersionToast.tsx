/**
 * NewVersionToast — fixed-bottom banner that surfaces when the service
 * worker activates a new version, prompting the user to reload.
 *
 * The problem this solves
 * ───────────────────────
 * Every deploy ships a new JS bundle with a content-hashed filename
 * (so it doesn't collide in the cache) and bumps the SW VERSION. The
 * SW handles cache busting fine — but the CURRENTLY-RUNNING page in
 * the user's tab keeps using the OLD bundle until they reload. On a
 * PWA people leave open for days, that means we could ship 5 deploys
 * and the user wouldn't see any of them until something prompted a
 * full refresh. Bug reports of "I don't see the new feature" are
 * really "I never reloaded the tab."
 *
 * How this works
 * ──────────────
 * Two signals are watched:
 *
 *   1. `serviceWorker.controllerchange` — fires after the NEW SW
 *      takes control of the page (because our SW calls clients.claim
 *      on activate). This is the moment we know the page is now
 *      backed by a different SW version.
 *
 *   2. `registration.updatefound` + `installing.statechange` —
 *      fires earlier in the lifecycle, when the new SW is downloaded
 *      but not yet activated. We use this as a hint to start showing
 *      the toast SOONER on slow networks where activation is delayed.
 *
 * Either signal flips a dismissable banner into view. The user taps
 * "Reload" → window.location.reload() — fresh bundle on the next
 * paint.
 *
 * Why a banner and not auto-reload
 * ────────────────────────────────
 * Auto-reload mid-interaction is hostile: it discards form input,
 * scroll position, an in-flight chat message draft, etc. Letting the
 * user choose when to reload is the polite default. The banner is
 * non-modal — they can keep using the old bundle indefinitely if they
 * want.
 *
 * Skipped on first SW registration
 * ────────────────────────────────
 * `controllerchange` also fires the very first time a SW takes
 * control of a page that had no SW before. We don't want to show
 * "App updated" on first install — only on subsequent updates. The
 * `installedAtMountRef` guard handles that: if there was no
 * controller when the component mounted, this is the install, not an
 * update.
 *
 * Only renders on the login screen
 * ────────────────────────────────
 * Founder direction: a "reload to update" banner interrupting a
 * signed-in user mid-task is bad UX — they're already deep in a
 * workout / chat / check-in. Now we gate visibility on the user
 * being logged OUT, so the banner only appears on the Login route.
 * Users see new-version prompts the moment they open the app to
 * sign in, never while they're working inside it.
 */
import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const NewVersionToast = () => {
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const [show, setShow] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

        // Snapshot the controller state at mount. If there was no
        // controller, this is the first SW install for this page —
        // any controllerchange we see later is the initial setup,
        // not a version update we should prompt about.
        const hadControllerAtMount = !!navigator.serviceWorker.controller;

        const onControllerChange = () => {
            if (!hadControllerAtMount) return; // first install, not an update
            setShow(true);
        };
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

        // Secondary path: watch the registration for a newly-installed
        // worker that hasn't activated yet. Showing the toast slightly
        // earlier gives the user a heads-up before the actual swap.
        let unsubFromUpdateFound: (() => void) | null = null;
        navigator.serviceWorker.getRegistration()
            .then((reg) => {
                if (!reg) return;
                const onUpdateFound = () => {
                    const installing = reg.installing;
                    if (!installing) return;
                    const onStateChange = () => {
                        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                            // New worker is installed AND we already have a
                            // controller — that means this is an UPDATE,
                            // not the first install. Safe to prompt.
                            setShow(true);
                        }
                    };
                    installing.addEventListener('statechange', onStateChange);
                };
                reg.addEventListener('updatefound', onUpdateFound);
                unsubFromUpdateFound = () => reg.removeEventListener('updatefound', onUpdateFound);
            })
            .catch(() => { /* registration unavailable — fine */ });

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            unsubFromUpdateFound?.();
        };
    }, []);

    // Only ever surface this banner pre-auth. Mid-task interrupts are
    // hostile — users get the update prompt the next time they land
    // on the sign-in screen.
    if (isAuthenticated) return null;
    if (!show || dismissed) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300"
            style={{ maxWidth: 'min(92vw, 28rem)' }}
        >
            <div
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl"
                style={{
                    background: 'rgb(20 24 38 / 0.96)',
                    border: '1px solid rgb(230 195 100 / 0.35)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgb(230 195 100 / 0.10)',
                }}
            >
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                        background: 'linear-gradient(135deg, rgb(255 224 143), rgb(230 195 100))',
                    }}
                >
                    <RefreshCw size={18} className="text-on-primary-fixed" strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm font-headline font-bold leading-tight"
                        style={{ color: 'rgb(255 255 255 / 0.96)' }}
                    >
                        {t('newVersionTitle')}
                    </p>
                    <p
                        className="text-xs font-body mt-0.5"
                        style={{ color: 'rgb(255 255 255 / 0.65)' }}
                    >
                        {t('newVersionSub')}
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-full text-[10px] font-label font-bold uppercase tracking-widest shrink-0 transition-transform active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, rgb(255 224 143), rgb(230 195 100))',
                        color: 'rgb(36 26 0)',
                        boxShadow: '0 4px 12px rgb(230 195 100 / 0.25)',
                    }}
                >
                    {t('newVersionReload')}
                </button>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    aria-label={t('newVersionDismiss')}
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    style={{ color: 'rgb(255 255 255 / 0.50)' }}
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
