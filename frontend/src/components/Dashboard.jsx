import React, { useState, useEffect } from 'react';
import DashboardHeader from './profile/DashboardHeader';
import DashboardSidebar from './profile/DashboardSidebar';
import DashboardFriends from './profile/DashboardFriends';
import DashboardProfile from './profile/DashboardProfile';
import DashboardStats from './profile/DashboardStats';
import DashboardFooter from './profile/DashboardFooter';
import { useAuth } from '../hooks/useAuth';

const Dashboard = ({ navigateTo }) => {
    const { isAuthenticated } = useAuth();
    const [activeSection, setActiveSection] = useState('stats');

    useEffect(() => {
        if (!isAuthenticated) {
            navigateTo('/login');
        }
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (['stats', 'friends', 'profile'].includes(lastPart)) {
            setActiveSection(lastPart);
        } else if (lastPart === 'profile') {
            setActiveSection('stats');
        }
    }, [isAuthenticated, navigateTo]);

    const renderContent = () => {
        switch (activeSection) {
            case 'stats':
                return <DashboardStats />;
            case 'friends':
                return <DashboardFriends />;
            case 'profile':
                return <DashboardProfile />;
            default:
                return <DashboardStats />;
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-950 text-white font-inter">
            <DashboardHeader navigateTo={navigateTo} setActiveSection={setActiveSection} />
            <div className="flex flex-1">
                <DashboardSidebar
                    navigateTo={navigateTo}
                    setActiveSection={setActiveSection}
                    activeSection={activeSection}
                />
                <main className="flex-1 p-8 overflow-auto">
                    <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 p-6 md:p-8">
                        {renderContent()}
                    </div>
                </main>
            </div>
            <DashboardFooter navigateTo={navigateTo} />
        </div>
    );
};

export default Dashboard;
