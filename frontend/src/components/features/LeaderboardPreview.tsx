import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Account, AuthContextType } from '../../types';

type CategoryKey = 'victories' | 'matchesPlayed' | 'winRate' | 'longestStreak';
type ModeKey = 'global' | 'solo' | 'multi_unique' | 'multi_same' | 'multi_turn';

const categories: { key: CategoryKey; label: string }[] = [
    { key: 'victories', label: 'Victoires' },
    { key: 'matchesPlayed', label: 'Parties' },
    { key: 'winRate', label: 'Taux' },
    { key: 'longestStreak', label: 'Série' }
];

const modes: { key: ModeKey; label: string }[] = [
    { key: 'global', label: 'Global' },
    { key: 'solo', label: 'Solo' },
    { key: 'multi_unique', label: 'Battle' },
    { key: 'multi_same', label: 'Race' },
    { key: 'multi_turn', label: 'Co-op' }
];

interface LeaderboardPreviewProps {
    navigateTo: (path: string) => void;
}

const ClassementPreview: React.FC<LeaderboardPreviewProps> = ({ navigateTo }) => {
    const { getUsers } = useAuth() as AuthContextType;
    const [ranking, setRanking] = useState<Partial<Account>[]>([]);
    const [selectedCat, setSelectedCat] = useState<CategoryKey>('victories');
    const [selectedMode, setSelectedMode] = useState<ModeKey>('global');
    const [fetchError, setFetchError] = useState<string | null>(null);

    const podiumColors = [
        'bg-yellow-400 shadow-yellow-300',
        'bg-gray-300 shadow-gray-400',
        'bg-orange-400 shadow-orange-300'
    ];

    const getStatValue = (user: Partial<Account>, mode: ModeKey, cat: CategoryKey): number => {
        if (!user || !user.stats) return 0;
        if (mode === 'global') {
            return (user.stats as any)[cat] || 0;
        }
        return (user.stats.pokemon as any)?.[mode]?.[cat] || 0;
    };

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                let users = await getUsers();
                if (!users) return;

                users = users.filter((u) => u.name !== 'admin' && !u.badges?.admin && !u.badges?.owner);

                users.sort((a, b) => {
                    const valA = getStatValue(a, selectedMode, selectedCat);
                    const valB = getStatValue(b, selectedMode, selectedCat);
                    return valB - valA;
                });

                const top10: Partial<Account>[] = [];
                for (let i = 0; i < 10; i++) {
                    if (users[i]) {
                        top10.push(users[i]);
                    } else {
                        top10.push({
                            name: `Joueur ${i + 1}`,
                            avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
                            stats: { [selectedCat]: 0 } as any
                        });
                    }
                }

                setRanking(top10);
                setFetchError(null);
            } catch (error) {
                console.error('Erreur lors de la récupération du classement:', error);
                setFetchError('Erreur chargement classement');

                const fallback: Partial<Account>[] = Array.from({ length: 10 }, (_, i) => ({
                    name: `Joueur ${i + 1}`,
                    avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
                    stats: {} as any
                }));
                setRanking(fallback);
            }
        };

        fetchRanking();
    }, [getUsers, selectedCat, selectedMode]);

    return (
        <section className="max-w-5xl mx-auto py-12 mt-6 px-4">
            <h2 className="text-4xl font-bold text-center mb-10 text-white">Consulter les classements</h2>

            <div className="flex flex-col gap-4 mb-12 items-center">
                <div className="flex flex-wrap justify-center gap-2">
                    {modes.map((m) => (
                        <button
                            key={m.key}
                            onClick={() => setSelectedMode(m.key)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition ${selectedMode === m.key ? 'bg-purple-600 text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    {categories.map((c) => (
                        <button
                            key={c.key}
                            onClick={() => setSelectedCat(c.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${selectedCat === c.key ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'}`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {fetchError && (
                <div className="text-center text-red-300 font-bold mb-8 bg-red-900/20 p-2 rounded">{fetchError}</div>
            )}

            <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-6 mb-12">
                {ranking.slice(0, 3).map((user, idx) => {
                    const val = getStatValue(user, selectedMode, selectedCat);
                    return (
                        <div
                            key={`${user._id || user.name}-${idx}`}
                            className="flex flex-col items-center transform transition-all duration-300 hover:scale-110"
                        >
                            <div
                                className={`relative flex flex-col items-center justify-end ${podiumColors[idx]} rounded-t-full w-28 md:w-32 shadow-lg`}
                                style={{ height: `${150 - idx * 20}px` }}
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center">
                                    <span className="inline-flex items-center justify-center rounded-full shadow-lg w-20 h-20 bg-gray-900 p-1">
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="rounded-full w-full h-full object-cover"
                                        />
                                    </span>
                                </div>
                                <div className="flex flex-col items-center pb-2 pt-16 w-full px-2">
                                    <span className="font-extrabold text-lg text-blue-900 drop-shadow-sm text-center truncate w-full px-1">
                                        {user.name}
                                    </span>
                                    <span className="text-sm text-gray-800 font-bold text-center leading-tight">
                                        {val}{' '}
                                        <span className="text-[10px] uppercase opacity-75 block">
                                            {categories.find((c) => c.key === selectedCat)?.label}
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <span className="mt-3 text-2xl font-bold">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-12 px-4">
                {ranking.slice(3, 10).map((user, idx) => {
                    const val = getStatValue(user, selectedMode, selectedCat);
                    return (
                        <div
                            key={`${user._id || user.name}-${idx}`}
                            className="flex flex-col items-center bg-gray-800 rounded-xl p-3 shadow-lg transform transition-all duration-300 hover:scale-105"
                        >
                            <div className="relative mb-2">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover"
                                />
                                <span className="absolute -top-2 -right-2 bg-gray-700 text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    #{idx + 4}
                                </span>
                            </div>
                            <span className="font-bold text-blue-300 text-sm truncate w-full text-center">
                                {user.name}
                            </span>
                            <span className="text-xs text-gray-400 font-mono mt-1">{val}</span>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-center mt-8 mb-4">
                <button
                    onClick={() => navigateTo('/leaderboard')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition duration-300 text-lg transform hover:-translate-y-1"
                >
                    Voir le classement complet
                </button>
            </div>
        </section>
    );
};

export default ClassementPreview;
