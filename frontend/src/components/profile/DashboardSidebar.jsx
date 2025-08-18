import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const DashboardSidebar = ({ navigateTo, setActiveSection, activeSection }) => {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigateTo('/login');
    };

    const navItems = [
        { id: 'stats', label: 'Consulter vos stats' },
        { id: 'friends', label: 'Gérer vos amis' },
        { id: 'profile', label: 'Gérer votre profil' }
    ];

    return (
        <>
            <aside
                className={`hidden md:flex w-64 p-6 bg-gray-900 rounded-tr-xl shadow-2xl border-r border-gray-700/50 flex-col justify-between
                        transition-all duration-300 ease-in-out transform md:translate-x-0`}
                style={{
                    background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
                    boxShadow: '10px 0 30px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.05)'
                }}
            >
                <nav className="space-y-4">
                    {navItems.map((item) => (
                        <a
                            key={item.id}
                            href="#"
                            onClick={() => {
                                setActiveSection(item.id);
                                navigateTo(`/profile/${item.id}`);
                            }}
                            className={`flex items-center p-3 rounded-lg text-lg font-medium transition-colors duration-300
                                    ${activeSection === item.id ? 'bg-blue-800 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-blue-400'}`}
                        >
                            <span className="ml-3">{item.label}</span>
                        </a>
                    ))}
                </nav>
                <div className="mt-auto pt-6 border-t border-gray-700/50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center p-3 rounded-lg text-lg font-medium transition-colors duration-300
                               bg-red-700 hover:bg-red-800 text-white shadow-lg transform"
                    >
                        Déconnexion
                    </button>
                </div>
            </aside>
            <nav
                className="md:hidden fixed bottom-0 left-0 w-full bg-gray-900 rounded-t-xl shadow-2xl border-t border-gray-700/50 flex flex-row justify-between px-2 py-2 z-40"
                style={{
                    background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
                    boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
            >
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveSection(item.id);
                            navigateTo(`/profil/${item.id}`);
                        }}
                        className={`flex-1 flex flex-col items-center justify-center mx-1 p-2 rounded-lg text-base font-medium transition-colors duration-300
                        ${activeSection === item.id ? 'bg-blue-800 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-blue-400'}`}
                    >
                        <span>{item.label}</span>
                    </button>
                ))}
                <button
                    onClick={handleLogout}
                    className="flex-1 flex flex-col items-center justify-center mx-1 p-2 rounded-lg text-base font-medium transition-colors duration-300
                    bg-red-700 hover:bg-red-800 text-white shadow-lg"
                >
                    Déconnexion
                </button>
            </nav>
        </>
    );
};

export default DashboardSidebar;
