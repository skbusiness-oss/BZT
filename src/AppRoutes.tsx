import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CheckIn } from './pages/CheckIn';
import { CoachReview } from './pages/CoachReview';
import { Clients } from './pages/Clients';
import { VideoLibrary } from './pages/VideoLibrary';
import { Workouts } from './pages/Workouts';
import { WorkoutDayView } from './components/workouts/WorkoutDayView';
import { ProgramBrowse } from './pages/ProgramBrowse';
import { UserView } from './pages/UserView';
import { Profile } from './pages/Profile';
import { Messages } from './pages/Messages';
import { Community } from './pages/Community';
import { Leaderboard } from './pages/Leaderboard';
import { Settings } from './pages/Settings';
import { AdminSetup } from './pages/AdminSetup';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { TosModal } from './components/shared/TosModal';
import { CommunityBaselineForm } from './components/profile/CommunityBaselineForm';
import React, { useState, useEffect } from 'react';

import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    const { user, isAuthenticated, loading, freshUserDocLoaded } = useAuth();

    // Block render until we have *both* an auth resolution AND a fresh
    // Firestore user-doc snapshot. Prevents the cached app shell from
    // showing protected content before the live disabled/role check arrives.
    if (loading || (isAuthenticated && !freshUserDocLoaded)) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#060814' }}>
            <Loader2 size={32} className="animate-spin text-gold-400" />
        </div>
    );

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
const AuthenticatedShell = () => {
    const { user } = useAuth();
    const showTos = !!user && !user.tosAcceptedAt;
    const needsBaseline =
        !!user && !showTos
        && user.role === 'community'
        && !user.communityProfileStartedAt;

    // Controlled by needsBaseline initially; once user submits, the user doc
    // updates → needsBaseline goes false → modal unmounts. We don't expose a
    // close handler here because closing without saving would leave the user
    // staring at a half-onboarded shell.
    const [baselineOpen, setBaselineOpen] = useState(false);
    useEffect(() => { setBaselineOpen(needsBaseline); }, [needsBaseline]);

    return (
        <>
            <Layout />
            {showTos && <TosModal />}
            {baselineOpen && <CommunityBaselineForm onClose={() => setBaselineOpen(false)} />}
        </>
    );
};

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
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
                <Route path="/users/:userId/view" element={
                    <ProtectedRoute allowedRoles={['coach', 'admin']}>
                        <ErrorBoundary><UserView /></ErrorBoundary>
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
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
