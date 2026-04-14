import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CommunityDashboard } from '../components/dashboard/CommunityDashboard';
import { ClientDashboard } from '../components/dashboard/ClientDashboard';
import { CoachDashboard } from '../components/dashboard/CoachDashboard';

export const Dashboard = () => {
    const { user } = useAuth();

    if (!user) return null;

    switch (user.role) {
        case 'coach':
        case 'admin':
            return <CoachDashboard />;
        case 'client':
            return <ClientDashboard />;
        case 'community':
        default:
            return <CommunityDashboard />;
    }
};
