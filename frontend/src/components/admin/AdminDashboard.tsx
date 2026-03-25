import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminSession from '../../utils/AdminSession';
import { io } from 'socket.io-client';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend
} from 'chart.js';

import { baseURL } from '../../utils/d';
import { disableRealtime, isRealtimeDisabled, isSocketEndpointMissing } from '../../utils/realtime';
import type { Account } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

type NavigateTo = (path: string) => void;

type AdminDashboardProps = {
    navigateTo: NavigateTo;
};

type SystemLog = {
    _id: string;
    createdAt: string;
    userId?: { name?: string } | null;
    action: string;
    details?: unknown;
};

type AdminStats = {
    totals: {
        accounts: number;
        activeAccounts: number;
        moderatedAccounts: number;
        posts: number;
        reposts: number;
        comments: number;
        likes: number;
        friendRequests: number;
        friends: number;
        admins: number;
        verified: number;
        premium: number;
    };
    recent?: {
        postsPerDay: Array<{ _id: string; total: number }>;
    };
};

type BadgeField = 'verified' | 'premium' | 'admin' | 'owner';

type RankingPayload = {
    tier?: string;
    top10?: boolean;
    dailyCheck?: boolean;
};

const AdminDashboard = ({ navigateTo }: AdminDashboardProps) => {
    const { currentUser, getUsers } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<Account[]>([]);
    const [admins, setAdmins] = useState<Account[]>([]);
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [search, setSearch] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [giftLinks, setGiftLinks] = useState<{ games_one?: string; games_plus?: string }>({});
    const [giftLoading, setGiftLoading] = useState<'games_one' | 'games_plus' | null>(null);

    const isAdmin = !!(currentUser?.badges?.admin || currentUser?.badges?.owner || currentUser?.name === 'admin');
    const isOwner = !!currentUser?.badges?.owner || currentUser?.name === 'admin';

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?._id || !isAdmin) {
                setLoading(false);
                return;
            }
            try {
                const [statsData, adminsData, usersData, logsData] = await Promise.all([
                    AdminSession.getStats(currentUser._id),
                    AdminSession.getAdmins(currentUser._id),
                    getUsers(),
                    AdminSession.getSystemLogs(currentUser._id)
                ]);
                setStats(statsData as AdminStats);
                setAdmins((adminsData || []) as Account[]);
                setUsers((usersData || []) as Account[]);
                setLogs((logsData || []) as SystemLog[]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser?._id, isAdmin, getUsers]);

    useEffect(() => {
        if (!isAdmin || !currentUser?._id) return;
        if (isRealtimeDisabled()) return;
        const socket = io(`${baseURL.replace('/api', '')}/admin`, {
            path: '/socket.io',
            transports: ['polling'],
            auth: { adminId: currentUser._id },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 800,
            reconnectionDelayMax: 2500,
            forceNew: true
        });

        socket.on('connect_error', (err: any) => {
            if (isSocketEndpointMissing(err)) {
                disableRealtime();
                socket.io.opts.reconnection = false;
                socket.disconnect();
            }
        });

        socket.on('admin:stats', (payload: AdminStats) => {
            setStats(payload);
        });

        return () => socket.disconnect();
    }, [isAdmin, currentUser?._id]);

    const filteredUsers = useMemo<Account[]>(() => {
        const value = search.trim().toLowerCase();
        if (!value) return users;
        return users.filter((u) => u.name?.toLowerCase().includes(value) || u.mail?.toLowerCase().includes(value));
    }, [users, search]);

    const updateUserState = (updated: Account) => {
        setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
        setAdmins((prev) => {
            const exists = prev.some((u) => u._id === updated._id);
            if (updated.badges?.admin || updated.badges?.owner) {
                return exists ? prev.map((u) => (u._id === updated._id ? updated : u)) : [updated, ...prev];
            }
            return prev.filter((u) => u._id !== updated._id);
        });
    };

    const handleModerate = async (user: Account) => {
        const adminId = currentUser?._id;
        if (!adminId) return;
        try {
            const updated = await AdminSession.moderateUser(adminId, user._id, !user.desactivated);
            updateUserState(updated as Account);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBadgeToggle = async (user: Account, field: BadgeField, value: boolean) => {
        const adminId = currentUser?._id;
        if (!adminId) return;
        try {
            const badges = { [field]: value };
            const updated = await AdminSession.updateBadges(adminId, user._id, badges);
            updateUserState(updated as Account);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRankingUpdate = async (user: Account, payload: RankingPayload) => {
        const adminId = currentUser?._id;
        if (!adminId) return;
        try {
            const updated = await AdminSession.updateBadges(adminId, user._id, { ranking: payload });
            updateUserState(updated as Account);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerateGift = async (tier: 'games_one' | 'games_plus') => {
        const adminId = currentUser?._id;
        if (!adminId) return;
        try {
            setGiftLoading(tier);
            const gift = await AdminSession.createPremiumGift(adminId, { tier, durationDays: 30, expiresInDays: 30 });
            const code = gift?.code as string | undefined;
            if (code) {
                setGiftLinks((prev) => ({ ...prev, [tier]: code }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGiftLoading(null);
        }
    };

    const buildGiftText = (code?: string) => {
        if (!code) return '';
        const base = baseURL.replace('/api', '');
        return `gift:${code} | ${base}/gift/${code}`;
    };

    const handleCopyGift = async (tier: 'games_one' | 'games_plus') => {
        const text = buildGiftText(giftLinks[tier]);
        if (!text) return;
        try {
            await navigator.clipboard?.writeText(text);
        } catch (err) {
            console.error(err);
        }
    };

    if (!isAdmin) {
        return (
            <main className="flex flex-col flex-grow items-center justify-center px-4 mt-12">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">Accès admin requis</h2>
                <p className="max-w-xl text-center text-white mb-6">
                    Vous devez être administrateur pour accéder à cette page.
                </p>
                <button
                    onClick={() => navigateTo('/')}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                    Retour à l'accueil
                </button>
            </main>
        );
    }

    if (loading) {
        return <p className="text-center mt-10 text-white">Chargement...</p>;
    }

    const lineData: any = stats?.recent?.postsPerDay
        ? {
              labels: stats.recent.postsPerDay.map((item) => item._id),
              datasets: [
                  {
                      label: 'Posts',
                      data: stats.recent.postsPerDay.map((item) => item.total),
                      borderColor: '#60a5fa',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      tension: 0.35,
                      fill: true
                  }
              ]
          }
        : null;

    const barData: any = stats
        ? {
              labels: ['Comptes', 'Posts', 'Reposts', 'Réponses', 'Likes', 'Demandes'],
              datasets: [
                  {
                      label: 'Totaux',
                      data: [
                          stats.totals.accounts,
                          stats.totals.posts,
                          stats.totals.reposts,
                          stats.totals.comments,
                          stats.totals.likes,
                          stats.totals.friendRequests
                      ],
                      backgroundColor: ['#38bdf8', '#22c55e', '#f59e0b', '#a855f7', '#f43f5e', '#64748b']
                  }
              ]
          }
        : null;

    return (
        <section className="max-w-7xl mx-auto py-12 min-h-[70vh] flex flex-col gap-10">
            <header className="flex flex-col gap-4 text-center">
                <h2 className="text-4xl font-extrabold text-white">Dashboard Admin</h2>
                <p className="text-gray-400">Vue globale, gestion des utilisateurs et administration.</p>
            </header>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard label="Comptes" value={stats.totals.accounts} />
                    <StatCard label="Comptes actifs" value={stats.totals.activeAccounts} />
                    <StatCard label="Comptes modérés" value={stats.totals.moderatedAccounts} />
                    <StatCard label="Posts" value={stats.totals.posts} />
                    <StatCard label="Reposts" value={stats.totals.reposts} />
                    <StatCard label="Réponses" value={stats.totals.comments} />
                    <StatCard label="Likes" value={stats.totals.likes} />
                    <StatCard label="Demandes d'amis" value={stats.totals.friendRequests} />
                    <StatCard label="Relations d'amis" value={stats.totals.friends} />
                    <StatCard label="Admins" value={stats.totals.admins} />
                    <StatCard label="Vérifiés" value={stats.totals.verified} />
                    <StatCard label="Premium" value={stats.totals.premium} />
                </div>
            )}

            {lineData && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Posts (7 derniers jours)</h3>
                    <Line data={lineData} />
                </div>
            )}

            {barData && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Activité globale</h3>
                    <Bar data={barData} />
                </div>
            )}

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Liens Premium</h3>
                <p className="text-sm text-gray-400 mb-6">
                    Générer des liens cadeaux (30 jours) pour Games One ou Games Plus.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(['games_one', 'games_plus'] as const).map((tier) => (
                        <div key={tier} className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-white">
                                        {tier === 'games_one' ? 'Games One' : 'Games Plus'}
                                    </div>
                                    <div className="text-xs text-gray-500">Durée: 30 jours</div>
                                </div>
                                <button
                                    onClick={() => handleGenerateGift(tier)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold ${tier === 'games_one' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-pink-600 hover:bg-pink-500'} text-white`}
                                >
                                    {giftLoading === tier ? 'Génération...' : 'Générer'}
                                </button>
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="text-xs text-gray-400 break-all min-h-[18px]">
                                    {giftLinks[tier] ? buildGiftText(giftLinks[tier]) : 'Aucun lien généré'}
                                </div>
                                <button
                                    onClick={() => handleCopyGift(tier)}
                                    className="self-start px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 text-xs hover:bg-gray-700 disabled:opacity-50"
                                    disabled={!giftLinks[tier]}
                                >
                                    Copier le lien
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Logs Système (Derniers 100)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-300">
                        <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Utilisateur</th>
                                <th className="px-4 py-2">Action</th>
                                <th className="px-4 py-2">Détails</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-800 transition-colors">
                                    <td className="px-4 py-2 text-sm text-gray-400">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 text-white">{log.userId?.name || 'Système'}</td>
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

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-6 text-white">
                    <h3 className="text-2xl font-bold">Administrateurs</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                    {admins.map((admin) => (
                        <div key={admin._id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
                            <img src={admin.avatar} alt={admin.name} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex flex-col">
                                <span className="text-white font-semibold flex items-center gap-2">{admin.name}</span>
                                <span className="text-xs text-gray-400">{admin.mail}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h3 className="text-2xl font-bold text-white">Gestion utilisateurs</h3>
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Rechercher par pseudo ou email..."
                        className="w-full md:w-72 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid gap-4">
                    {filteredUsers.map((user) => (
                        <div key={user._id} className="bg-gray-800/80 rounded-xl border border-gray-700 p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <div className="text-white font-semibold flex items-center gap-2 min-h-[24px]">
                                            <span className="truncate">{user.name}</span>
                                            <span className="flex items-center gap-1 h-4">
                                                {user.badges?.owner && (
                                                    <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">
                                                        Owner
                                                    </span>
                                                )}
                                                {user.badges?.admin && (
                                                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                                                        Admin
                                                    </span>
                                                )}
                                                {user.badges?.verified && (
                                                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                                        Vérifié
                                                    </span>
                                                )}
                                                {user.badges?.premium && (
                                                    <span className="text-xs bg-pink-600 text-white px-2 py-0.5 rounded-full" title={user.premiumTier === 'games_plus' ? 'Premium (Games Plus)' : user.premiumTier === 'games_one' ? 'Premium (Games One)' : 'Premium'}>
                                                        Premium
                                                    </span>
                                                )}
                                                {user.badges?.ranking?.tier &&
                                                    user.badges?.ranking?.tier !== 'none' && (
                                                        <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">
                                                            Trophée
                                                        </span>
                                                    )}
                                                {user.badges?.ranking?.top10 && (
                                                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                                                        Top 10
                                                    </span>
                                                )}
                                                {user.badges?.ranking?.dailyCheck && (
                                                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                                        Check
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-400">{user.mail}</div>
                                        {user.desactivated && (
                                            <div className="text-xs text-red-400 mt-1">Compte modéré</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => navigateTo(`/admin/user/${user._id}`)}
                                        className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600"
                                    >
                                        Voir dashboard
                                    </button>
                                    <button
                                        onClick={() => handleModerate(user)}
                                        className={`px-3 py-2 rounded-lg text-sm font-semibold ${user.desactivated ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                    >
                                        {user.desactivated ? 'Réactiver' : 'Modérer'}
                                    </button>
                                    <button
                                        onClick={() => handleBadgeToggle(user, 'verified', !user.badges?.verified)}
                                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                                    >
                                        {user.badges?.verified ? 'Retirer vérifié' : 'Ajouter vérifié'}
                                    </button>
                                    <button
                                        onClick={() => handleBadgeToggle(user, 'premium', !user.badges?.premium)}
                                        className="px-3 py-2 rounded-lg bg-pink-600 text-white text-sm hover:bg-pink-700"
                                    >
                                        {user.badges?.premium ? 'Retirer premium' : 'Ajouter premium'}
                                    </button>
                                    {isOwner && (
                                        <button
                                            onClick={() => handleBadgeToggle(user, 'admin', !user.badges?.admin)}
                                            className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                                        >
                                            {user.badges?.admin ? 'Retirer admin' : 'Ajouter admin'}
                                        </button>
                                    )}
                                    {isOwner && (
                                        <button
                                            onClick={() => handleBadgeToggle(user, 'owner', !user.badges?.owner)}
                                            className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700"
                                        >
                                            {user.badges?.owner ? 'Retirer owner' : 'Ajouter owner'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleRankingUpdate(user, { tier: 'gold' })}
                                    className="px-3 py-1.5 rounded-lg bg-yellow-600 text-white text-xs hover:bg-yellow-700"
                                >
                                    Trophée Or
                                </button>
                                <button
                                    onClick={() => handleRankingUpdate(user, { tier: 'silver' })}
                                    className="px-3 py-1.5 rounded-lg bg-gray-500 text-white text-xs hover:bg-gray-600"
                                >
                                    Trophée Argent
                                </button>
                                <button
                                    onClick={() => handleRankingUpdate(user, { tier: 'bronze' })}
                                    className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs hover:bg-orange-700"
                                >
                                    Trophée Bronze
                                </button>
                                <button
                                    onClick={() => handleRankingUpdate(user, { tier: 'none' })}
                                    className="px-3 py-1.5 rounded-lg bg-gray-700 text-white text-xs hover:bg-gray-600"
                                >
                                    Retirer trophée
                                </button>
                                <button
                                    onClick={() => handleRankingUpdate(user, { top10: !user.badges?.ranking?.top10 })}
                                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs hover:bg-purple-700"
                                >
                                    {user.badges?.ranking?.top10 ? 'Retirer top 10' : 'Top 10'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

type StatCardProps = {
    label: string;
    value: number | string;
};

const StatCard = ({ label, value }: StatCardProps) => (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 text-white">
        <div className="text-sm text-gray-400">{label}</div>
        <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
);

export default AdminDashboard;






