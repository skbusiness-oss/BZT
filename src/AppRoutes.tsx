import { Routes, Route, Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './lib/firebase';
import { useAuth } from './context/AuthContext';
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
import { Messages } from './pages/Messages';
import { Community } from './pages/Community';
import { Leaderboard } from './pages/Leaderboard';
import { Settings } from './pages/Settings';
import { AdminSetup } from './pages/AdminSetup';
import { Pricing } from './pages/Pricing';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { TosModal } from './components/shared/TosModal';
import { CommunityBaselineForm } from './components/profile/CommunityBaselineForm';
import { hasLocalCommunityBaseline, hasLocalTosAccepted } from './lib/onboardingStorage';
import React, { useState, useEffect } from 'react';

import { Loader2 } from 'lucide-react';

const FullScreenLoader = () => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#060814' }}>
        <Loader2 size={32} className="animate-spin text-gold-400" />
    </div>
);

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
    const { user, freshUserDocLoaded } = useAuth();
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
    const showTos =
        !!user
        && freshUserDocLoaded
        && !user.tosAcceptedAt
        && !localTosHint;
    const needsBaseline =
        !!user && freshUserDocLoaded && !showTos
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
