import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const ClassementPreview = ({ navigateTo }) => {
    const { getUsers } = useAuth();
    const [ranking, setRanking] = useState([]);

    const podiumColors = [
        'bg-yellow-400 shadow-yellow-300',
        'bg-gray-300 shadow-gray-400',
        'bg-orange-400 shadow-orange-300'
    ];

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const users = await getUsers();
                const sortedUsers = users.sort((a, b) => b.victories - a.victories);

                const top10 = [];
                for (let i = 0; i < 10; i++) {
                    if (sortedUsers[i]) {
                        top10.push(sortedUsers[i]);
                    } else {
                        top10.push({
                            name: `Joueur ${i + 1}`,
                            avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
                            victories: 0,
                            matchesPlayed: 0,
                            losses: 0,
                            winRate: 0
                        });
                    }
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
                    winRate: 0
                }));
                setRanking(fallback);
            }
        };

        fetchRanking();
    }, [getUsers]);

    return (
        <section className="max-w-4xl mx-auto py-12 mt-6">
            <h2 className="text-4xl font-bold text-center mb-20 text-white">Consulter les classements</h2>
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
                                <span className="text-base text-gray-600 font-semibold text-center">
                                    {user.victories} victoires
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
                        <span className="text-sm text-gray-400">{user.victories} victoires</span>
                        <span className="text-xs text-gray-500 mt-1">#{idx + 4}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center mt-8 mb-4">
                <button
                    onClick={() => navigateTo('/leaderboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg transition duration-300 text-lg"
                >
                    Voir le classement complet
                </button>
            </div>
        </section>
    );
};

export default ClassementPreview;
