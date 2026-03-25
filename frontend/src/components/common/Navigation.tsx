import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FaBars, FaTimes, FaSignOutAlt, FaShieldAlt, FaTachometerAlt, FaBell, FaUser, FaEnvelope, FaGem } from 'react-icons/fa';
import { AuthContextType } from '../../contexts/authContext';

interface NavigationProps {
    navigateTo: (path: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const navItems = [
        { id: '', label: 'Accueil' },
        { id: 'forum', label: 'Forum' },
        { id: 'leaderboard', label: 'Classement' },
        { id: 'news', label: 'Nouveautés' }
    ];

    const { currentUser, logout, notifications, markNotificationsSeen } =
        useAuth() as AuthContextType;

    const totalNotif = notifications?.length || 0;
    const unreadNotif = (notifications || []).filter((n: any) => !n.seen).length;
    const totalNotifCount = Math.min(99, totalNotif);
    const unreadNotifCount = Math.min(99, unreadNotif);
    const notifList = [...(notifications || [])].slice(-6).reverse();

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    const markNotifSeen = (id: string) => {
        if (!markNotificationsSeen) return;
        markNotificationsSeen((n: any) => n.id === id);
    };

    const markAllSeen = () => {
        if (!markNotificationsSeen) return;
        markNotificationsSeen();
    };

    const openNotification = (notif: any) => {
        if (!notif) return;
        markNotifSeen(notif.id);
        if (notif.type === 'pm_message' || notif.type === 'pm_mention') {
            if (notif.data?.conversationId) {
                localStorage.setItem(
                    'pm_open_conv',
                    JSON.stringify({
                        conversationId: notif.data.conversationId,
                        messageId: notif.data.messageId
                    })
                );
                window.dispatchEvent(
                    new CustomEvent('pm_open_conv', {
                        detail: {
                            conversationId: notif.data.conversationId,
                            messageId: notif.data.messageId
                        }
                    })
                );
            }
            handleNavigate('/chat');
            return;
        }
        if (notif.type === 'friend_request') {
            handleNavigate('/settings/friends');
            return;
        }
        if (notif.type === 'game_invite') {
            if (notif.data?.code) {
                localStorage.setItem('pokemonInviteCode', notif.data.code);
            }
            handleNavigate('/pokemon');
            return;
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen]);

    const handleNavigate = (path: string) => {
        navigateTo(path);
        setIsSidebarOpen(false);
    };

    const handleLogout = () => {
        logout();
        setIsSidebarOpen(false);
        navigateTo('/login');
    };

    return (
        <>
            <nav
                className="sticky top-0 z-30 w-full p-4 transition-all duration-300 backdrop-blur-lg bg-gray-900/80 border-b border-gray-700/50 rounded-xl mb-6"
                style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(12px)',
                    borderImage: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent) 1'
                }}
            >
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo('/')}></div>

                    <ul className="hidden md:flex flex-1 justify-center space-x-8 text-white">
                        {navItems.map((item) => (
                            <li key={item.label}>
                                <button
                                    onClick={() => navigateTo(`/${item.id}`)}
                                    className="text-lg font-bold px-3 py-2 rounded-md transition-all duration-300 text-gray-300 hover:text-white hover:bg-blue-600"
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center">
                        {!currentUser ? (
                            <button
                                onClick={() => navigateTo('/login')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg"
                            >
                                Connexion
                            </button>
                        ) : (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleSidebar}
                                    className="flex items-center gap-2 focus:outline-none group relative"
                                >
                                    <span className="hidden md:block font-semibold text-gray-200 group-hover:text-white transition">
                                        {currentUser.name}
                                    </span>
                                    <div className="relative">
                                        <img
                                            src={currentUser.avatar}
                                            alt="avatar"
                                            className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover group-hover:border-blue-400 transition"
                                        />
                                        {totalNotifCount > 0 && (
                                            <span
                                                className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-gray-900 ${unreadNotifCount > 0 ? 'bg-red-600' : 'bg-gray-600'}`}
                                            >
                                                {unreadNotifCount > 0 ? unreadNotifCount : totalNotifCount}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            </div>
                        )}

                        <button className="md:hidden text-white ml-4 text-2xl" onClick={toggleSidebar}>
                            <FaBars />
                        </button>
                    </div>
                </div>
            </nav>

            <div
                className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div
                    ref={sidebarRef}
                    className={`fixed top-0 right-0 h-full w-80 bg-gray-900 shadow-2xl border-l border-gray-700/50 transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Menu</h2>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="text-gray-400 hover:text-white text-xl"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {currentUser && (
                            <div className="flex flex-col items-center mb-8">
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="w-24 h-24 rounded-full border-4 border-blue-600 mb-4 object-cover shadow-lg"
                                />
                                <h3 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h3>
                                <p className="text-gray-400 text-sm truncate max-w-full">{currentUser.mail}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="md:hidden space-y-2 mb-6 border-b border-gray-800 pb-6">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavigate(`/${item.id}`)}
                                        className="w-full text-left px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white font-semibold transition"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {currentUser && (
                                <>
                                    <button
                                        onClick={() => handleNavigate(`/user/${currentUser.name}`)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white font-semibold transition"
                                    >
                                        <span className="flex items-center gap-3">
                                            <FaUser className="text-emerald-400" /> Mon profil
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleNavigate('/settings')}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white font-semibold transition"
                                    >
                                        <span className="flex items-center gap-3">
                                            <FaTachometerAlt className="text-blue-400" /> Paramètres
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleNavigate('/chat')}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white font-semibold transition"
                                    >
                                        <span className="flex items-center gap-3">
                                            <FaEnvelope className="text-cyan-400" /> Messages
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleNavigate('/premium')}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white font-semibold transition"
                                    >
                                        <span className="flex items-center gap-3">
                                            <FaGem className="text-pink-400" /> Premium
                                        </span>
                                    </button>

                                    <div
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-300 bg-gray-900/30 font-semibold"
                                    >
                                        <span className="flex items-center gap-3">
                                            <FaBell className="text-yellow-400" /> Notifications
                                        </span>
                                        {totalNotif > 0 && (
                                            <span
                                                className={`min-w-[20px] h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${unreadNotif > 0 ? 'bg-red-600' : 'bg-gray-600'}`}
                                            >
                                                {unreadNotif > 0 ? unreadNotifCount : totalNotifCount}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3 rounded-2xl border border-gray-800/70 bg-gray-900/40 p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Dernieres</span>
                                            {unreadNotif > 0 && (
                                                <button
                                                    onClick={markAllSeen}
                                                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300"
                                                >
                                                    Tout marquer vu
                                                </button>
                                            )}
                                        </div>
                                        {notifList.length === 0 ? (
                                            <div className="text-xs text-gray-500 italic">Aucune notification</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {notifList.map((notif: any) => (
                                                    <button
                                                        key={notif.id}
                                                        onClick={() => openNotification(notif)}
                                                        className={`w-full text-left px-3 py-2 rounded-xl border transition ${notif.seen ? 'border-gray-800 bg-gray-900/30 text-gray-400' : 'border-blue-500/40 bg-blue-500/10 text-gray-200'}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-xs font-semibold truncate">{notif.title}</span>
                                                            <span className={`text-[9px] font-bold ${notif.seen ? 'text-gray-500' : 'text-red-400'}`}>
                                                                {notif.seen ? 'VU' : 'NOUVEAU'}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] mt-1 line-clamp-2">{notif.message}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {(currentUser.badges?.admin || currentUser.badges?.owner) && (
                                        <button
                                            onClick={() => handleNavigate('/admin')}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white font-semibold transition"
                                        >
                                            <FaShieldAlt className="text-red-400" /> Administration
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {currentUser && (
                        <div className="p-6 border-t border-gray-800">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white font-bold transition duration-300"
                            >
                                <FaSignOutAlt /> Se deconnecter
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Navigation;






