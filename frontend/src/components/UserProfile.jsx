import React, { useState, useEffect } from 'react';
import Session from '../utils/Session';
import { useAuth } from '../hooks/useAuth';

const UserProfile = ({ navigateTo, name }) => {
    const [isConnected, _setIsConnected] = React.useState(!!Session.get());
    const { currentUser, sendFriendRequest, getUser, _fetchFriends } = useAuth();
    const [foundUser, setFoundUser] = useState({
        name: 'Unknown User',
        avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
        stats: {
            matchesPlayed: 0,
            victories: 0,
            losses: 0,
            winRate: 0,
            favoriteGame: 'Unknown Game',
            longestStreak: 0,
            mostPlayedOpponent: 'Unknown Opponent'
        },
        commonFriends: [],
        inscription: 'Unknown Date'
    });

    console.log(foundUser);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await getUser(name);
                const u = {};
                if (user.name) u.name = user.name;
                if (user.avatar) u.avatar = user.avatar;
                if (user.stats) u.stats = user.stats;

                if (user.createdAt) {
                    const date = new Date(user.createdAt);
                    const options = { day: '2-digit', month: 'long', year: 'numeric' };
                    u.inscription = new Intl.DateTimeFormat('fr-FR', options).format(date);
                }
                const friendsList = /*fetchFriends(currentUser._id) ||*/ [];
                const targetFriendsList = /*fetchFriends(foundUser._id) ||*/ [];
                const commonFriends = friendsList.filter((friend) =>
                    targetFriendsList.some((targetFriend) => targetFriend._id === friend._id)
                );
                if (commonFriends.length > 0) {
                    u.commonFriends = commonFriends;
                }
                setFoundUser(u);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
        return;
    }, [name, getUser]);

    const handleAddFriend = () => {
        if (!isConnected) {
            navigateTo('/login');
        } else {
            sendFriendRequest(currentUser._id, foundUser._id)
                .then(() => {
                    alert("Demande d'ami envoyée !");
                })
                .catch((err) => {
                    console.error(err);
                    alert("Erreur lors de l'envoi de la demande d'ami.");
                });
        }
    };

    return (
        <div className="flex flex-col md:flex-row max-w-6xl mx-auto py-12 gap-12 min-h-[70vh]">
            <aside className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 p-8 flex flex-col items-center w-full md:w-1/3 mx-auto md:mx-0">
                <img
                    src={foundUser.avatar}
                    alt={foundUser.pseudo}
                    className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg mb-4"
                />
                <h2 className="text-3xl font-extrabold text-blue-500 mb-4">{foundUser.name}</h2>
                <button
                    onClick={handleAddFriend}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg mb-6 transition duration-300"
                >
                    Ajouter en ami
                </button>
                <div className="w-full mb-6">
                    <h3 className="text-xl font-semibold text-gray-300 mb-2 text-center">Amis en commun</h3>
                    <div className="flex justify-center gap-4">
                        {(foundUser.commonFriends || []).map((f) => (
                            <div key={f.pseudo} className="flex flex-col items-center">
                                <span
                                    className={`rounded-full w-12 h-12 flex items-center justify-center border-4 border-white shadow-lg ${f.color}`}
                                >
                                    <img
                                        src={f.avatar}
                                        alt={f.pseudo}
                                        className="rounded-full w-10 h-10 object-cover"
                                    />
                                </span>
                                <span className="text-sm text-gray-200 mt-1">{f.pseudo}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full mt-auto">
                    <h3 className="text-xl font-semibold text-gray-300 mb-2 text-center">Informations</h3>
                    <ul className="text-center text-gray-400">
                        <li>
                            Date d'inscription :{' '}
                            <span className="text-blue-400 font-bold">{foundUser.inscription}</span>
                        </li>
                    </ul>
                </div>
            </aside>
            <section className="relative flex-1 flex flex-col justify-between bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 p-8">
                <div>
                    <h3 className="text-3xl font-extrabold text-blue-500 mb-8 text-center">Statistiques</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard title="Parties jouées" value={foundUser.stats.matchesPlayed} />
                        <StatCard title="Victoires" value={foundUser.stats.victories} color="text-green-400" />
                        <StatCard title="Défaites" value={foundUser.stats.losses} color="text-red-400" />
                        <StatCard
                            title="Taux de victoire"
                            value={`${foundUser.stats.winRate}%`}
                            color="text-yellow-400"
                        />
                        <StatCard title="Jeu préféré" value={foundUser.stats.favoriteGame} />
                        <StatCard
                            title="Plus longue série de victoire"
                            value={foundUser.stats.longestStreak}
                            color="text-purple-400"
                        />
                        <StatCard title="Adversaire le plus joué" value={foundUser.stats.mostPlayedOpponent} />
                    </div>
                </div>
            </section>
        </div>
    );
};

const StatCard = ({ title, value, color = 'text-blue-300' }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700/50 text-center">
        <div className={`text-2xl font-bold mb-2 ${color}`}>{value}</div>
        <div className="text-gray-300 font-semibold">{title}</div>
    </div>
);

export default UserProfile;
