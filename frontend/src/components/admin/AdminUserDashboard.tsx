import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Session from '../../utils/Session';
import { FaCrown, FaCheckCircle, FaGem, FaUserShield, FaTrophy, FaMedal, FaCheck } from 'react-icons/fa';
import AdminSession from '../../utils/AdminSession';
import type { Account } from '../../types';

type NavigateTo = (path: string) => void;

type AdminUserDashboardProps = {
    navigateTo: NavigateTo;
    userId: string;
};

type UserLog = {
    _id: string;
    createdAt: string;
    action: string;
    details?: unknown;
};

const AdminUserDashboard = ({ navigateTo, userId }: AdminUserDashboardProps) => {
    const { currentUser } = useAuth();
    const [user, setUser] = useState<Account | null>(null);
    const [logs, setLogs] = useState<UserLog[]>([]);
    const isAdmin = !!(currentUser?.badges?.admin || currentUser?.badges?.owner);
    const [premiumTier, setPremiumTier] = useState<'games_one' | 'games_plus' | ''>('');
    const [premiumUntil, setPremiumUntil] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const adminId = currentUser?._id;
            if (!adminId) return;
            try {
                const [data, logsData] = await Promise.all([
                    Session.getUserById(userId),
                    AdminSession.getUserLogs(adminId, userId)
                ]);
                setUser(data as Account);
                setPremiumTier((data as Account)?.premiumTier || '');
                setPremiumUntil(
                    (data as Account)?.premiumUntil ? new Date((data as Account).premiumUntil as string).toISOString().slice(0, 10) : ''
                );
                setLogs((logsData || []) as UserLog[]);
            } catch (err) {
                console.error(err);
            }
        };
        if (userId && currentUser?._id) fetchUser();
    }, [userId, currentUser?._id]);

    if (!isAdmin) {
        return (
            <main className="flex flex-col flex-grow items-center justify-center px-4 mt-12">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">Acces admin requis</h2>
                <button
                    onClick={() => navigateTo('/')}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                    Retour a l'accueil
                </button>
            </main>
        );
    }

    if (!user) {
        return <p className="text-center mt-10 text-white">Chargement...</p>;
    }

    const ranking = user.badges?.ranking;

    return (
        <section className="max-w-5xl mx-auto py-12 min-h-[70vh] flex flex-col gap-8">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center gap-4">
                    <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                    <div>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {user.name}
                            {user.badges?.owner && <FaCrown className="text-yellow-400" />}
                            {user.badges?.admin && <FaUserShield className="text-red-400" />}
                            {user.badges?.verified && <FaCheckCircle className="text-blue-400" />}
                            {user.badges?.premium && (
                                <FaGem
                                    className="text-pink-400"
                                    title={
                                        user.premiumTier === 'games_plus'
                                            ? 'Premium (Games Plus)'
                                            : user.premiumTier === 'games_one'
                                              ? 'Premium (Games One)'
                                              : 'Premium'
                                    }
                                />
                            )}
                            {ranking?.tier && ranking?.tier !== 'none' && (
                                <FaTrophy
                                    className={
                                        ranking?.tier === 'gold'
                                            ? 'text-yellow-400'
                                            : ranking?.tier === 'silver'
                                              ? 'text-gray-300'
                                              : 'text-orange-400'
                                    }
                                />
                            )}
                            {ranking?.top10 && <FaMedal className="text-purple-300" />}
                            {ranking?.dailyCheck && <FaCheck className="text-green-400" />}
                        </div>
                        <div className="text-sm text-gray-400">{user.mail}</div>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        onClick={async () => {
                            const adminId = currentUser?._id;
                            if (!adminId) return;
                            const updated = await AdminSession.updateUser(adminId, user._id, {
                                avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U'
                            });
                            setUser(updated as Account);
                        }}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600"
                    >
                        Retirer l'avatar
                    </button>
                    <button
                        onClick={async () => {
                            const adminId = currentUser?._id;
                            if (!adminId) return;
                            const updated = await AdminSession.updateUser(adminId, user._id, {
                                name: 'Default'
                            });
                            setUser(updated as Account);
                        }}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600"
                    >
                        Pseudo par defaut
                    </button>
                </div>
                <div className="mt-6 flex flex-wrap gap-4 text-gray-300">
                    <div>Compte: {user.desactivated ? 'Modere' : 'Actif'}</div>
                    <div>Creation: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
                </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Statistiques</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Parties jouees" value={user.stats?.matchesPlayed} />
                    <StatCard title="Victoires" value={user.stats?.victories} color="text-green-400" />
                    <StatCard title="Defaites" value={user.stats?.losses} color="text-red-400" />
                    <StatCard title="Taux de victoire" value={`${user.stats?.winRate ?? 0}%`} color="text-yellow-400" />
                    <StatCard title="Jeu prefere" value={user.stats?.favoriteGame} />
                    <StatCard title="Plus longue serie" value={user.stats?.longestStreak} />
                    <StatCard title="Adversaire le plus joue" value={user.stats?.mostPlayedOpponent} />
                </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Premium</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400 font-semibold">Niveau</label>
                        <select
                            value={premiumTier}
                            onChange={(e) => setPremiumTier(e.target.value as any)}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        >
                            <option value="">Aucun</option>
                            <option value="games_one">Games One</option>
                            <option value="games_plus">Games Plus</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400 font-semibold">Date de fin</label>
                        <input
                            type="date"
                            value={premiumUntil}
                            onChange={(e) => setPremiumUntil(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={async () => {
                                const adminId = currentUser?._id;
                                if (!adminId || !user) return;
                                const payload: any = {
                                    tier: premiumTier || null,
                                    until: premiumUntil ? new Date(premiumUntil).toISOString() : null
                                };
                                const updated = await AdminSession.updatePremium(adminId, user._id, payload);
                                setUser(updated as Account);
                            }}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-500"
                        >
                            Appliquer
                        </button>
                        <button
                            onClick={async () => {
                                const adminId = currentUser?._id;
                                if (!adminId || !user) return;
                                const updated = await AdminSession.updatePremium(adminId, user._id, { clear: true });
                                setUser(updated as Account);
                                setPremiumTier('');
                                setPremiumUntil('');
                            }}
                            className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-bold hover:bg-gray-600"
                        >
                            Retirer
                        </button>
                    </div>
                </div>
                <div className="mt-4 text-xs text-gray-400">
                    Statut actuel: {user.badges?.premium ? 'Premium actif' : 'Aucun premium'} {user.premiumTier ? `(${user.premiumTier})` : ''}
                </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Logs Utilisateur</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-300">
                        <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Action</th>
                                <th className="px-4 py-2">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-800 transition-colors">
                                    <td className="px-4 py-2 text-sm text-gray-400">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 font-semibold text-blue-400">{log.action}</td>
                                    <td className="px-4 py-2 text-xs font-mono text-gray-400">
                                        {log.details ? JSON.stringify(log.details) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

type StatCardProps = {
    title: string;
    value?: string | number;
    color?: string;
};

const StatCard = ({ title, value, color = 'text-blue-300' }: StatCardProps) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700/50 text-center">
        <div className={`text-2xl font-bold mb-2 ${color}`}>{value}</div>
        <div className="text-gray-300 font-semibold">{title}</div>
    </div>
);

export default AdminUserDashboard;
