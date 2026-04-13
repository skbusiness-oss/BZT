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
import { Profile } from './pages/Profile';
import { Messages } from './pages/Messages';
import { Community } from './pages/Community';
import { AdminSetup } from './pages/AdminSetup';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import React from 'react';

import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#060814' }}>
            <Loader2 size={32} className="animate-spin text-gold-400" />
        </div>
    );

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
    return <>{children}</>;
};

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/setup" element={<ProtectedRoute allowedRoles={['admin']}><AdminSetup /></ProtectedRoute>} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/checkin" element={
                    <ProtectedRoute allowedRoles={['coaching']}>
                        <ErrorBoundary><CheckIn /></ErrorBoundary>
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
                    <ProtectedRoute allowedRoles={['coach', 'admin', 'coaching']}>
                        <ErrorBoundary><Messages /></ErrorBoundary>
                    </ProtectedRoute>
                } />
                <Route path="/community" element={<ErrorBoundary><Community /></ErrorBoundary>} />
                <Route path="/library" element={<ErrorBoundary><VideoLibrary /></ErrorBoundary>} />
                <Route path="/workouts" element={<ErrorBoundary><Workouts /></ErrorBoundary>} />
                <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
