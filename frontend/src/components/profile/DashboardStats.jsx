import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const DashboardStats = () => {
    const { currentUser } = useAuth();
    const stats = currentUser.stats || {};

    return (
        <div className="p-4">
            <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Vos statistiques actuelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Parties jouées" value={stats.matchesPlayed} />
                <StatCard title="Victoire" value={stats.victories} color="text-green-400" />
                <StatCard title="Défaites" value={stats.losses} color="text-red-400" />
                <StatCard title="Taux de victoire" value={`${stats.winRate}%`} color="text-yellow-400" />
                <StatCard title="Jeu préféré" value={stats.favoriteGame} />
                <StatCard title="Plus longue série de victoire" value={stats.longestStreak} />
                <StatCard title="Adversaire le plus joué" value={stats.mostPlayedOpponent} />
            </div>
            <div className="mt-8 text-center text-gray-400">
                <p>Plus de détails incluant des graphiques arriveront prochainement !</p>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, color = 'text-blue-300' }) => (
    <div
        className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700/50 text-center
                    transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
    >
        <p className="text-lg font-semibold text-gray-400 mb-2">{title}</p>
        <p className={`text-4xl font-bold ${color}`}>{value}</p>
    </div>
);

export default DashboardStats;
