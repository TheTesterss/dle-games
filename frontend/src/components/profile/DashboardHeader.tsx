import React from 'react';
import FloatingIcons from '../subcomponents/FloatingIcons';
import { useAuth } from '../../hooks/useAuth';

interface DashboardHeaderProps {
    navigateTo: (path: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ navigateTo }) => {
    const navItems = [
        { id: '', label: 'Accueil' },
        { id: 'forum', label: 'Forum' },
        { id: 'leaderboard', label: 'Classement' },
        { id: 'news', label: 'Nouveautés' }
    ];

    const { currentUser } = useAuth();

    return (
        <header className="relative overflow-hidden border-b border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <FloatingIcons />
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 md:py-10 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="text-left">
                        <div className="text-[11px] uppercase tracking-[0.45em] text-cyan-300/80 font-bold">Dashboard</div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mt-2">
                            DLE <span className="text-cyan-300">Games</span>
                        </h1>
                        <p className="text-sm text-slate-300 mt-2 max-w-xl">
                            Votre espace personnel pour suivre vos stats, régler vos préférences et gérer vos amitiés.
                        </p>
                    </div>

                    {currentUser && (
                        <button
                            onClick={() => navigateTo(`/user/${currentUser.name}`)}
                            className="flex items-center gap-4 rounded-2xl bg-slate-900/80 border border-slate-700 px-4 py-3 hover:border-cyan-400/60 transition"
                        >
                            <img
                                src={currentUser.avatar}
                                alt="User Avatar"
                                className="w-12 h-12 rounded-full border border-cyan-400/40 object-cover"
                            />
                            <div className="text-left">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400">Connecté</div>
                                <div className="text-sm font-semibold text-white truncate max-w-[180px]">
                                    {currentUser.name}
                                </div>
                                <div className="text-[10px] text-slate-500">Voir mon profil</div>
                            </div>
                        </button>
                    )}
                </div>

                <nav className="flex flex-wrap gap-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id || item.label}
                            onClick={() => navigateTo(`/${item.id}`)}
                            className="px-4 py-2 rounded-full border border-slate-700/80 text-slate-200 text-sm font-semibold hover:bg-cyan-500/10 hover:border-cyan-400/60 hover:text-cyan-200 transition"
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    );
};

export default DashboardHeader;
