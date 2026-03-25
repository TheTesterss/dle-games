import React, { useState, useEffect } from 'react';
import Session from '../../utils/Session';
import { useAuth } from '../../hooks/useAuth';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import { Account, AuthContextType } from '../../types';

type CategoryKey = 'victories' | 'matchesPlayed' | 'winRate' | 'longestStreak';
type ModeKey = 'global' | 'solo' | 'multi_unique' | 'multi_same' | 'multi_turn';

const categories: { key: CategoryKey; label: string }[] = [
    { key: 'victories', label: 'Victoires' },
    { key: 'matchesPlayed', label: 'Parties' },
    { key: 'winRate', label: 'Taux de victoire' },
    { key: 'longestStreak', label: 'Série' }
];

const modes: { key: ModeKey; label: string }[] = [
    { key: 'global', label: 'Global' },
    { key: 'solo', label: 'Solo' },
    { key: 'multi_unique', label: 'Tour par Tour' },
    { key: 'multi_same', label: 'Course' },
    { key: 'multi_turn', label: 'Coopération' }
];

const Leaderboard: React.FC = () => {
    const [selectedCat, setSelectedCat] = useState<CategoryKey>('victories');
    const [selectedMode, setSelectedMode] = useState<ModeKey>('global');
    const [onlyFriends, setOnlyFriends] = useState(false);
    const [page, setPage] = useState(1);
    const [ranking, setRanking] = useState<Partial<Account>[]>([]);
    const [paginated, setPaginated] = useState<Partial<Account>[]>([]);
    const [fullSortedList, setFullSortedList] = useState<Partial<Account>[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const { getUsers, currentUser } = useAuth() as AuthContextType;

    const isConnected = !!Session.get();
    const podiumColors = [
        'bg-yellow-400 shadow-yellow-300',
        'bg-gray-300 shadow-gray-400',
        'bg-orange-400 shadow-orange-300'
    ];
    const pageSize = 10;

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

                if (onlyFriends && isConnected && currentUser) {
                    const friendIds = new Set(currentUser.friends || []);
                    users = users.filter((u) => u._id && friendIds.has(u._id));
                }

                users.sort((a, b) => {
                    const valA = getStatValue(a, selectedMode, selectedCat);
                    const valB = getStatValue(b, selectedMode, selectedCat);
                    return valB - valA;
                });
                setFullSortedList(users);

                const startIndex = (page - 1) * pageSize;
                setPaginated(users.slice(startIndex, startIndex + pageSize));

                const top10: Partial<Account>[] = users.slice(0, 10);
                while (top10.length < 10) {
                    top10.push({
                        name: `Joueur ${top10.length + 1}`,
                        avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
                        stats: { [selectedCat]: 0 } as any
                    });
                }
                setRanking(top10);
                setFetchError(null);
            } catch (error) {
                console.error('Erreur lors de la récupération du classement:', error);
                setFetchError('Erreur de connexion au serveur.');

                const fallback: Partial<Account>[] = Array.from({ length: 10 }, (_, i) => ({
                    name: `Joueur ${i + 1}`,
                    avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
                    stats: {
                        victories: 0,
                        matchesPlayed: 0,
                        losses: 0,
                        winRate: 0,
                        longestStreak: 0
                    } as any
                }));
                setRanking(fallback);
            }
        };
        fetchRanking();
    }, [selectedCat, selectedMode, onlyFriends, page, isConnected, getUsers, currentUser]);

    return (
        <section className="max-w-6xl mx-auto py-12 min-h-[70vh] flex flex-col gap-8 px-4">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Classement</h2>
            {fetchError && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 px-6 py-3 rounded-xl text-center font-semibold mb-4 mx-auto max-w-2xl">
                    {fetchError}
                </div>
            )}
            <div className="flex flex-col gap-4 mb-8 items-center">
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
                    {categories.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCat(cat.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${selectedCat === cat.key ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setOnlyFriends((prev) => !prev)}
                    disabled={!isConnected}
                    className={`px-4 py-2 rounded-full font-semibold transition border ${onlyFriends
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                        } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {onlyFriends ? 'Mes amis uniquement' : 'Tous les joueurs'}
                </button>
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-8 mb-12">
                {ranking.slice(0, 3).map((user, idx) => (
                    <div
                        key={user._id || user.name}
                        className="flex flex-col items-center transform transition-all duration-300 hover:scale-110"
                    >
                        <div
                            className={`relative flex flex-col items-center justify-end ${podiumColors[idx]} rounded-t-full w-32 shadow-lg`}
                            style={{ height: `${150 - idx * 20}px` }}
                        >
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center">
                                <span className="inline-flex items-center justify-center rounded-full shadow-lg w-24 h-24 bg-gray-900/50 p-1">
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="rounded-full w-full h-full object-cover"
                                    />
                                </span>
                            </div>
                            <div className="flex flex-col items-center pb-1 pt-24 w-full px-2">
                                <span className="font-extrabold text-lg text-blue-600 drop-shadow text-center truncate w-full">
                                    {user.name}
                                </span>
                                <span className="text-base text-gray-800 font-semibold text-center">
                                    {getStatValue(user, selectedMode, selectedCat)}{' '}
                                    {categories.find((c) => c.key === selectedCat)?.label.toLowerCase()}
                                </span>
                            </div>
                        </div>
                        <span
                            className={`mt-3 text-2xl font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-orange-500'}`}
                        >
                            <FaTrophy />
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap justify-center gap-6 mb-12">
                {ranking.slice(3, 10).map((user, idx) => (
                    <div
                        key={user._id || user.name}
                        className="flex flex-col items-center bg-gray-800 rounded-lg px-4 py-6 shadow-lg w-36 transform transition-all duration-300 hover:scale-110"
                    >
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full mb-2 border-2 border-blue-500 object-cover"
                        />
                        <span className="font-bold text-blue-300 truncate w-full text-center">{user.name}</span>
                        <span className="text-sm text-gray-400">
                            {getStatValue(user, selectedMode, selectedCat)}{' '}
                            {categories.find((c) => c.key === selectedCat)?.label.toLowerCase()}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <FaMedal className="text-purple-300" /> #{idx + 4}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex flex-col items-center md:items-end w-full">
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 font-bold disabled:opacity-50 transition hover:bg-gray-600"
                    >
                        Précédent
                    </button>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={paginated.length < pageSize}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 font-bold disabled:opacity-50 transition hover:bg-gray-600"
                    >
                        Suivant
                    </button>
                </div>
                <div className="w-full">
                    {page > 1 &&
                        paginated.map((user, idx) => {
                            const globalIndex = (page - 1) * pageSize + idx + 1;
                            return (
                                <div
                                    key={user._id || user.name}
                                    className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 mb-2 shadow hover:bg-gray-750 transition"
                                >
                                    <span className="font-bold text-lg w-16 text-right mr-4">{globalIndex}</span>
                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                    <span className="font-bold text-blue-300 flex-1 ml-4">{user.name}</span>
                                    <span className="text-sm text-gray-400">
                                        {getStatValue(user, selectedMode, selectedCat)}{' '}
                                        {categories.find((c) => c.key === selectedCat)?.label.toLowerCase()}
                                    </span>
                                </div>
                            );
                        })}
                </div>
            </div>
            <div className="text-center md:text-right mt-8 border-t border-gray-800 pt-6">
                {!isConnected ? (
                    <span className="text-red-500 font-bold">Connectez-vous pour voir votre classement</span>
                ) : (
                    <span className="text-green-500 font-bold">
                        Votre position :{' '}
                        {(() => {
                            const posIndex = fullSortedList.findIndex((u) => u._id === currentUser?._id);
                            return posIndex === -1 ? 'Non classé' : posIndex + 1;
                        })()}
                    </span>
                )}
            </div>
        </section>
    );
};

export default Leaderboard;
