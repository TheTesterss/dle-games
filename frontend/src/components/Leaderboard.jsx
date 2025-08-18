import React, { useState, useEffect } from 'react';
import Session from '../utils/Session';
import { useAuth } from '../hooks/useAuth';

const categories = [
    { key: 'matchesPlayed', label: 'Parties jouées' },
    { key: 'victories', label: 'Victoires' },
    { key: 'winRate', label: 'Taux de victoire' },
    { key: 'longestStreak', label: 'Plus longue série' }
];

const Leaderboard = () => {
    const [selectedCat, setSelectedCat] = useState(categories[0].key);
    const [isConnected, _setIsConnected] = useState(!!Session.get());
    const [onlyFriends, setOnlyFriends] = useState(false);
    const [page, setPage] = useState(1);
    const [ranking, setRanking] = useState([]);
    const [paginated, setPaginated] = useState([]);
    const { getUsers, currentUser } = useAuth();

    const podiumColors = [
        'bg-yellow-400 shadow-yellow-300',
        'bg-gray-300 shadow-gray-400',
        'bg-orange-400 shadow-orange-300'
    ];
    const pageSize = 10;

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                let users = await getUsers();
                if (onlyFriends && isConnected) {
                    users = users.filter((user, idx) => idx % 2 === 0);
                }

                users.sort((a, b) => b[selectedCat] - a[selectedCat]);

                const startIndex = (page - 1) * pageSize;
                setPaginated(users.slice(startIndex, startIndex + pageSize));

                const top10 = [...paginated];
                for (let i = paginated.length; i < pageSize; i++) {
                    top10.push({
                        name: `Joueur ${startIndex + i + 1}`,
                        avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
                        victories: 0,
                        matchesPlayed: 0,
                        losses: 0,
                        winRate: 0,
                        longestStreak: 0
                    });
                }

                setRanking(top10);
            } catch (error) {
                console.error('Erreur lors de la récupération du classement:', error);

                const fallback = Array.from({ length: 10 }, (_, i) => ({
                    name: `Joueur ${i + 1}`,
                    avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
                    victories: 0,
                    matchesPlayed: 0,
                    losses: 0,
                    winRate: 0,
                    longestStreak: 0
                }));
                setRanking(fallback);
            }
        };
        fetchRanking();
    }, [selectedCat, onlyFriends, page, isConnected, getUsers, paginated]);

    return (
        <section className="max-w-6xl mx-auto py-12 min-h-[70vh] flex flex-col gap-8">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Classement</h2>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setSelectedCat(cat.key)}
                        className={`px-4 py-2 rounded-lg font-bold transition ${selectedCat === cat.key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                        {cat.label}
                    </button>
                ))}
                <label className="flex items-center space-x-2 ml-4">
                    <input
                        type="checkbox"
                        checked={onlyFriends}
                        onChange={(e) => setOnlyFriends(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                        disabled={!isConnected}
                    />
                    <span className="text-gray-300">Voir que mes amis</span>
                </label>
            </div>
            <div className="flex justify-center items-end gap-8 mb-12">
                {ranking.slice(0, 3).map((user, idx) => (
                    <div
                        key={user.id}
                        className="flex flex-col items-center transform transition-all duration-300 hover:scale-110 hover:animate-shake"
                    >
                        <div
                            className={`relative flex flex-col items-center justify-end ${podiumColors[idx]} rounded-t-full w-32 shadow-lg`}
                            style={{ height: `${150 - idx * 20}px` }}
                        >
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center">
                                <span className="inline-flex items-center justify-center rounded-full shadow-lg  w-24 h-24">
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="rounded-full w-20 h-20 object-cover"
                                    />
                                </span>
                            </div>
                            <div className="flex flex-col items-center pb-1 pt-24 w-full px-2">
                                <span className="font-extrabold text-lg text-blue-600 drop-shadow text-center truncate w-full">
                                    {user.name}
                                </span>
                                <span className="text-base text-gray-800 font-semibold text-center">
                                    {user[selectedCat]}{' '}
                                    {categories.find((c) => c.key === selectedCat).label.toLowerCase()}
                                </span>
                            </div>
                        </div>
                        <span
                            className={`mt-3 text-2xl font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-orange-500'}`}
                        >
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap justify-center gap-6 mb-12">
                {ranking.slice(3, 10).map((user, idx) => (
                    <div
                        key={user.id}
                        className="flex flex-col items-center bg-gray-800 rounded-lg px-4 py-6 shadow-lg w-36 transform transition-all duration-300 hover:scale-110 hover:animate-shake"
                    >
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full mb-2 border-2 border-blue-500"
                        />
                        <span className="font-bold text-blue-300">{user.name}</span>
                        <span className="text-sm text-gray-400">
                            {user[selectedCat]} {categories.find((c) => c.key === selectedCat).label.toLowerCase()}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">#{idx + 4}</span>
                    </div>
                ))}
            </div>
            <div className="flex flex-col items-end">
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 font-bold disabled:opacity-50"
                    >
                        Précédent
                    </button>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={paginated.length < pageSize}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 font-bold disabled:opacity-50"
                    >
                        Suivant
                    </button>
                </div>
                <div className="w-full">
                    {page > 1 &&
                        paginated.map((user, idx) => {
                            const globalIndex = idx + 1;
                            return (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 mb-2 shadow"
                                >
                                    <span className="font-bold text-lg w-16 text-right">{globalIndex}</span>
                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mx-4" />
                                    <span className="font-bold text-blue-300 flex-1">{user.name}</span>
                                    <span className="text-sm text-gray-400">
                                        {user[selectedCat]}{' '}
                                        {categories.find((c) => c.key === selectedCat).label.toLowerCase()}
                                    </span>
                                </div>
                            );
                        })}
                </div>
            </div>
            <div className="text-right mt-8">
                {!isConnected ? (
                    <span className="text-red-500 font-bold">Connectez-vous pour voir votre classement</span>
                ) : (
                    <span className="text-green-500 font-bold">
                        Votre position : {ranking.findIndex((user) => user.id === currentUser._id) + 1}
                    </span>
                )}
            </div>
        </section>
    );
};

export default Leaderboard;
