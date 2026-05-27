import { Routes, Route, Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './lib/firebase';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CheckIn } from './pages/CheckIn';
import { CoachReview } from './pages/CoachReview';
import { Clients } from './pages/Clients';
import { VideoLibrary } from './pages/VideoLibrary';
import { Workouts } from './pages/Workouts';
import { Diets } from './pages/Diets';
import { PlanDetail } from './pages/PlanDetail';
import { WorkoutDayView } from './components/workouts/WorkoutDayView';
import { ProgramBrowse } from './pages/ProgramBrowse';
import { UserView } from './pages/UserView';
import { Profile } from './pages/Profile';
import { Upgrade } from './pages/Upgrade';
import { Broadcast } from './pages/Broadcast';
import { Notifications } from './pages/Notifications';
import { Welcome } from './pages/Welcome';
import { UpgradeSuccess } from './pages/UpgradeSuccess';
import { Subscriptions } from './pages/Subscriptions';
import { Legal } from './pages/Legal';
import { Messages } from './pages/Messages';
import { Community } from './pages/Community';
import { Leaderboard } from './pages/Leaderboard';
import { Settings } from './pages/Settings';
import { AdminSetup } from './pages/AdminSetup';
import { Pricing } from './pages/Pricing';
import { CardioPlan } from './pages/CardioPlan';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { TosModal } from './components/shared/TosModal';
import { CommunityBaselineForm } from './components/profile/CommunityBaselineForm';
import { hasLocalCommunityBaseline, hasLocalTosAccepted } from './lib/onboardingStorage';
import React, { useState, useEffect } from 'react';

// Branded full-screen loader. Replaces the old `text-gold-400` spinner
// (which fell back to a default blue color because gold-400 isn't a
// defined Tailwind token — `text-primary` is the right gold class).
//
// Two reasons to bother with the polish here:
//   1. This is the very first thing every signed-in user sees on every
//      load — a bare spinner reads as "the app is broken / slow".
//   2. The auth flow legitimately takes ~500ms-2s while the deletion-
//      log + users/{uid} server snapshot resolve. A rotating message
//      makes that feel intentional.
//
// The wordmark is text-based (no logo asset) so this works offline.
// Message cycles every 1.6s; first one shows immediately so the user
// always sees text, not just a blank tagline area.
//
// Translation keys (rotated through useLanguage().t) so Arabic users
// see Arabic copy here too. Falls back to English literal if a key is
// somehow missing.
const LOADER_MESSAGE_KEYS = [
    'loaderPreparing',
    'loaderProgress',
    'loaderAlmost',
    'loaderSyncing',
    'loaderTuning',
] as const;

const FullScreenLoader = () => {
    // useLanguage() is safe here — AppRoutes is always rendered inside
    // <LanguageProvider> (see App.tsx). Translation falls through to
    // the English value automatically if a key happens to be missing.
    const { t: translate } = useLanguage();

    const [messageIndex, setMessageIndex] = useState(0);
    useEffect(() => {
        const id = window.setInterval(() => {
            setMessageIndex((i) => (i + 1) % LOADER_MESSAGE_KEYS.length);
        }, 1600);
        return () => window.clearInterval(id);
    }, []);

    const messageKey = LOADER_MESSAGE_KEYS[messageIndex];
    const currentMessage = translate(messageKey);
    const loadingHeadline = translate('loaderLoading');

    return (
        <div
            className="relative min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center overflow-hidden"
            style={{ background: '#000000' }}
        >
            {/* Gold ambient halos — give the loader an unmistakable
                brand presence from frame 1. Previously the background
                was #060814 (slightly blue-tinted navy) which read as
                "blue" against the brand black + gold the user expects.
                A pair of soft gold radial glows behind the wordmark
                fixes that without needing any image asset. They're
                non-interactive and behind everything else. */}
            <div
                aria-hidden
                className="bzt-halo-drift pointer-events-none absolute"
                style={{
                    top: '20%', left: '50%', transform: 'translateX(-50%)',
                    width: 480, height: 480,
                    background: 'radial-gradient(circle, rgb(230 195 100 / 0.20) 0%, rgb(230 195 100 / 0) 65%)',
                    filter: 'blur(40px)',
                    animationDuration: '24s',
                }}
            />
            <div
                aria-hidden
                className="bzt-halo-drift pointer-events-none absolute"
                style={{
                    bottom: '10%', left: '50%', transform: 'translateX(-50%)',
                    width: 320, height: 320,
                    background: 'radial-gradient(circle, rgb(255 224 143 / 0.10) 0%, rgb(255 224 143 / 0) 70%)',
                    filter: 'blur(50px)',
                    animationDuration: '28s',
                    animationDirection: 'reverse',
                }}
            />

            {/* Wordmark — gold gradient text, anchors the brand even
                before any real UI renders. Text colors are explicit
                rgba literals (NOT theme tokens) because this component
                can render before ThemeProvider boots — using
                text-on-surface here resolves to nothing, leaving the
                label invisible / dark-on-dark.

                Note: the brand-image variant of this loader (img +
                breathe animation) was tried and pulled per founder
                direction — kept the original text wordmark + spinner
                because the typographic version reads cleaner during
                the brief load window. */}
            <div className="flex flex-col items-center gap-3">
                <span
                    className="font-label text-[10px] font-bold uppercase tracking-[0.4em]"
                    style={{ color: 'rgb(255 255 255 / 0.6)' }}
                >
                    BioZackTeam
                </span>
                <h1
                    className="font-display font-extrabold text-3xl md:text-4xl tracking-tighter"
                    style={{
                        background: 'linear-gradient(135deg, rgb(255 224 143), rgb(230 195 100) 60%, rgb(201 168 76))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    {loadingHeadline}
                </h1>
            </div>

            {/* Ring spinner — two concentric arcs in primary gold, sized
                so it reads as "in progress" not "frozen". The outer ring
                is a slow spin, the inner one a faster counter-spin for
                a more deliberate, kinetic feel. */}
            <div className="relative w-16 h-16">
                <div
                    className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                    style={{
                        borderTopColor: 'rgb(230 195 100)',
                        borderRightColor: 'rgb(230 195 100 / 0.4)',
                        animationDuration: '1.4s',
                    }}
                />
                <div
                    className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                    style={{
                        borderBottomColor: 'rgb(255 224 143)',
                        animationDuration: '0.9s',
                        animationDirection: 'reverse',
                    }}
                />
            </div>

            {/* Rotating message. Fixed height so the layout doesn't jump
                between messages of different widths. key forces a small
                fade-in animation on each switch. Color is an explicit
                rgba literal so it remains readable even if theme tokens
                aren't yet applied. */}
            <div className="min-h-[1.5rem]">
                <p
                    key={messageIndex}
                    className="font-body text-sm tracking-wide animate-in fade-in duration-500"
                    style={{ color: 'rgb(255 255 255 / 0.85)' }}
                >
                    {currentMessage}…
                </p>
            </div>
        </div>
    );
};

const LoginRoute = () => {
    const { user, loading, freshUserDocLoaded } = useAuth();

    if (loading || (user && !freshUserDocLoaded)) return <FullScreenLoader />;
    if (user && freshUserDocLoaded) return <Navigate to="/" replace />;
    return <Login />;
};

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    const { user, isAuthenticated, loading, freshUserDocLoaded } = useAuth();

    // Block render until we have *both* an auth resolution AND a fresh
    // Firestore user-doc snapshot. Prevents the cached app shell from
    // showing protected content before the live disabled/role check arrives.
    if (loading || (isAuthenticated && !freshUserDocLoaded)) return <FullScreenLoader />;

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
    return <>{children}</>;
};

// Belt-and-suspenders gate for content routes: even if Firestore rules and
// auth-disable somehow let a banned account through, refuse to render the
// page client-side.
const RequireActive = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    if (user?.disabled === true) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

// Shell that gates the authenticated app behind two onboarding modals:
//   1. ToS acceptance — until tosAcceptedAt is set on the user doc.
//   2. Community Week 0 baseline — community users only, until
//      communityProfileStartedAt is set.
// Both are blocking overlays. ToS comes first; once it's accepted, the
// baseline form takes over for community accounts.
// One-shot, idempotent self-heal: when an admin signs in, verify the
// single coach (Coach Zaki, Y9Dl…) has `role: 'coach'` in Firestore.
// If not, call `setUserRole` so the coach's account regains its
// inbox/staff query access. Why here vs an admin button: the system
// has been silently broken for him — surface the fix automatically
// the moment someone with privilege walks in.
const HARDCODED_COACH_UID = 'Y9DlGI9kF6dPFPBh4cDvMnxbayB3';
const healedCoachSessions = new Set<string>();
const callSetUserRoleHeal = httpsCallable<
    { targetUid: string; role: 'coach' },
    { ok: boolean }
>(functions, 'setUserRole');

const AuthenticatedShell = () => {
    const { user, freshUserDocLoaded, serverProfileConfirmed } = useAuth();
    const [tosAcceptedLocally, setTosAcceptedLocally] = useState(false);
    const [baselineCompletedLocally, setBaselineCompletedLocally] = useState(false);

    useEffect(() => {
        if (!user || !freshUserDocLoaded) return;
        if (user.role !== 'admin') return;
        // Once per session per admin uid — avoids spamming the callable on
        // every route mount.
        if (healedCoachSessions.has(user.id)) return;
        healedCoachSessions.add(user.id);
        (async () => {
            try {
                const snap = await getDoc(doc(db, 'users', HARDCODED_COACH_UID));
                const role = snap.exists() ? snap.data()?.role : null;
                if (role === 'coach' || role === 'admin') return;
                // eslint-disable-next-line no-console
                console.info('[AuthenticatedShell] healing coach role:', role, '→ coach');
                await callSetUserRoleHeal({ targetUid: HARDCODED_COACH_UID, role: 'coach' });
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn('[AuthenticatedShell] coach role heal skipped:', err);
            }
        })();
    }, [user, freshUserDocLoaded]);

    useEffect(() => {
        setTosAcceptedLocally(false);
        setBaselineCompletedLocally(false);
    }, [user?.id]);


    // Local-device hint, set by TosModal on accept. Belt-and-suspenders for
    // when Firestore hasn't replied yet on a returning device — the user has
    // already accepted, so we never want the modal to flash again here.
    const localTosHint = !!user && (tosAcceptedLocally || hasLocalTosAccepted(user.id));
    const localBaselineHint = !!user && (baselineCompletedLocally || hasLocalCommunityBaseline(user.id));
    // Only show ToS once we have a confirmed-fresh user doc AND neither the
    // server field nor the local hint says it was accepted. This prevents
    // every spurious mount (post-foreground, after a route change) from
    // briefly rendering the modal while the snapshot is in-flight.
    //
    // serverProfileConfirmed gate matters: AuthContext now accepts the
    // first cached snap so the dashboard renders fast on slow networks,
    // but cached docs can be missing fields the server has
    // (tosAcceptedAt / communityProfileStartedAt). Gating the gates on
    // a server-confirmed snap means we never decide "show ToS" from
    // stale cache — the modal only appears if the SERVER says the
    // field is missing. Local hints still provide instant continuity
    // for same-device returning users.
    const showTos =
        !!user
        && freshUserDocLoaded
        && serverProfileConfirmed
        && !user.tosAcceptedAt
        && !localTosHint;
    const needsBaseline =
        !!user && freshUserDocLoaded && serverProfileConfirmed && !showTos
        && user.role === 'community'
        && !user.communityProfileStartedAt
        && !localBaselineHint;

    // Controlled by needsBaseline initially; once user submits, the user doc
    // updates → needsBaseline goes false → modal unmounts. We don't expose a
    // close handler here because closing without saving would leave the user
    // staring at a half-onboarded shell.
    const [baselineOpen, setBaselineOpen] = useState(false);
    useEffect(() => { setBaselineOpen(needsBaseline); }, [needsBaseline]);

    return (
        <>
            <Layout />
            {showTos && <TosModal onAccepted={() => setTosAcceptedLocally(true)} />}
            {baselineOpen && (
                <CommunityBaselineForm
                    onClose={() => {
                        setBaselineCompletedLocally(true);
                        setBaselineOpen(false);
                    }}
                />
            )}
        </>
    );
};

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/pricing" element={<ErrorBoundary><Pricing /></ErrorBoundary>} />
            {/* Stripe-redirect destinations — PUBLIC routes. Both are
                landed on directly from Stripe Checkout after payment.
                /welcome is for guest signups (the user doesn't have a
                session yet — they're about to set their password via
                the email link). /upgrade/success is for in-app
                community→coaching upgrades (the user IS signed in but
                we keep it public so a logged-out tab reload after
                Stripe redirect still works). */}
            <Route path="/welcome" element={<ErrorBoundary><Welcome /></ErrorBoundary>} />
            <Route path="/upgrade/success" element={<ErrorBoundary><UpgradeSuccess /></ErrorBoundary>} />
            {/* Legal pages — PUBLIC, no auth. The same component
                renders all three documents; the route determines which
                tab is active on initial load. Linked from Stripe
                Checkout footers + the app's own login footer. */}
            <Route path="/terms" element={<ErrorBoundary><Legal /></ErrorBoundary>} />
            <Route path="/privacy" element={<ErrorBoundary><Legal /></ErrorBoundary>} />
            <Route path="/health-disclaimer" element={<ErrorBoundary><Legal /></ErrorBoundary>} />
            <Route path="/admin/setup" element={<ProtectedRoute allowedRoles={['admin']}><AdminSetup /></ProtectedRoute>} />
            <Route element={<ProtectedRoute><AuthenticatedShell /></ProtectedRoute>}>
                <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/checkin" element={
                    <ProtectedRoute allowedRoles={['client']}>
                        <ErrorBoundary><RequireActive><CheckIn /></RequireActive></ErrorBoundary>
                    </ProtectedRoute>
                } />
                <Route path="/clients/:clientId/review" element={
                    <ProtectedRoute allowedRoles={['coach', 'admin']}>
                        <ErrorBoundary><CoachReview /></ErrorBoundary>
                    </ProtectedRoute>
                } />
                <Route path="/clients" element={
                    <ProtectedRoute allowedRoles={['coach', 'admin']}>
                        <ErrorBoundary><Clients /></ErrorBoundary>
                    </ProtectedRoute>
                } />
                <Route path="/messages" element={
                    <ProtectedRoute allowedRoles={['coach', 'admin', 'client']}>
                        <ErrorBoundary><RequireActive><Messages /></RequireActive></ErrorBoundary>
                    </ProtectedRoute>
                } />
                <Route path="/community" element={<ErrorBoundary><RequireActive><Community /></RequireActive></ErrorBoundary>} />
                <Route path="/library" element={<ErrorBoundary><RequireActive><VideoLibrary /></RequireActive></ErrorBoundary>} />
                <Route path="/workouts" element={<ErrorBoundary><RequireActive><Workouts /></RequireActive></ErrorBoundary>} />
                <Route path="/workouts/day/:dayNumber" element={<ErrorBoundary><RequireActive><WorkoutDayView /></RequireActive></ErrorBoundary>} />
                <Route path="/workouts/program/:programId" element={<ErrorBoundary><RequireActive><ProgramBrowse /></RequireActive></ErrorBoundary>} />
                <Route path="/diets" element={<ErrorBoundary><RequireActive><Diets /></RequireActive></ErrorBoundary>} />
                <Route path="/diets/plan/:id" element={<ErrorBoundary><RequireActive><PlanDetail /></RequireActive></ErrorBoundary>} />
                <Route path="/users/:userId/view" element={
                    <ProtectedRoute allowedRoles={['coach', 'admin']}>
                        <ErrorBoundary><UserView /></ErrorBoundary>
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
                <Route path="/update" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
                <Route path="/cardio" element={<ErrorBoundary><CardioPlan /></ErrorBoundary>} />
                <Route path="/upgrade" element={<ErrorBoundary><Upgrade /></ErrorBoundary>} />
                <Route path="/broadcast" element={<ErrorBoundary><Broadcast /></ErrorBoundary>} />
                <Route path="/notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
                <Route path="/subscriptions" element={
                    <ProtectedRoute allowedRoles={['coach', 'admin']}>
                        <ErrorBoundary><Subscriptions /></ErrorBoundary>
                    </ProtectedRoute>
                } />
                <Route path="/leaderboard" element={
                    <ProtectedRoute allowedRoles={['coach', 'admin']}>
                        <ErrorBoundary><Leaderboard /></ErrorBoundary>
                    </ProtectedRoute>
                } />
                <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
