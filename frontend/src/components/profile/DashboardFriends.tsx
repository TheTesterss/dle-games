import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FriendRequestSession from '../../utils/FriendRequestSession';
import Session from '../../utils/Session';
import { AuthContextType } from '../../contexts/authContext';

interface FriendEntry {
    _id: string;
    name: string;
    avatar: string;
    since: string;
    matchesPlayed: number;
    winRate: number;
}

interface RequestEntry {
    userId: string;
    _id: string;
    name: string;
    avatar: string;
    date: string;
}

const DashboardFriends: React.FC = () => {
    const {
        removeFriend,
        cancelFriendRequest,
        denyFriendRequest,
        acceptFriendRequest,
        fetchFriends,
        fetchFriendRequests,
        currentUser,
        onlineUsers
    } = useAuth() as AuthContextType;

    const [friends, setFriends] = useState<FriendEntry[]>([]);
    const [pendingRequests, setPendingRequests] = useState<RequestEntry[]>([]);
    const [sentRequests, setSentRequests] = useState<RequestEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<keyof FriendEntry | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const currentUserId = currentUser?._id;

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUserId) return;
            const friendsList = await fetchFriends(currentUserId);
            const friendRequestsIds = await fetchFriendRequests(currentUserId);
            const friendRequestsList = (await Promise.all(
                friendRequestsIds.map((id: any) => FriendRequestSession.get(id))
            )).filter(Boolean) as any[];

            const incomingRequests = friendRequestsList.filter((req) => {
                const toId = typeof req.to === 'string' ? req.to : req.to?._id;
                return toId === currentUserId;
            });
            const outgoingRequests = friendRequestsList.filter((req) => {
                const fromId = typeof req.from === 'string' ? req.from : req.from?._id;
                return fromId === currentUserId;
            });

            const pendingRequestsPromises = incomingRequests.map(async (req) => {
                const fromId = typeof req.from === 'string' ? req.from : req.from?._id;
                const user = await Session.getUserById(fromId);
                return {
                    userId: fromId,
                    _id: req._id,
                    name: user?.name || 'Inconnu',
                    avatar: user?.avatar || '',
                    date: new Date(req.createdAt).toLocaleDateString()
                };
            });

            const sentRequestsPromises = outgoingRequests.map(async (req) => {
                const toId = typeof req.to === 'string' ? req.to : req.to?._id;
                const user = await Session.getUserById(toId);
                return {
                    userId: toId,
                    _id: req._id,
                    name: user?.name || 'Inconnu',
                    avatar: user?.avatar || '',
                    date: new Date(req.createdAt).toLocaleDateString()
                };
            });

            const friendsListPromises = friendsList.map(async (fOrId: any) => {
                const friendId = typeof fOrId === 'string' ? fOrId : fOrId?._id;
                const f = await Session.getUserById(friendId);
                return {
                    _id: f?._id || friendId,
                    name: f?.name || 'Inconnu',
                    avatar: f?.avatar || '',
                    since: 'Indisponible',
                    matchesPlayed: f?.stats?.matchesPlayed || 0,
                    winRate: f?.stats?.winRate || 0
                };
            });

            const finalFriendsList = await Promise.all(friendsListPromises);
            const finalPending = await Promise.all(pendingRequestsPromises);
            const finalSent = await Promise.all(sentRequestsPromises);

            setPendingRequests(finalPending);
            setSentRequests(finalSent);
            setFriends(finalFriendsList);
        };
        fetchData();
    }, [currentUserId]);

    const handleDeleteFriend = async (id: string) => {
        if (!currentUser) return;
        await removeFriend(currentUser._id, id);
        setFriends((prev) => prev.filter((f) => f._id !== id));
    };

    const handleSort = (column: keyof FriendEntry) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const sortedAndFilteredFriends = useMemo(() => {
        return [...friends]
            .filter((friend) => friend.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (!sortBy) return 0;
                const valA = a[sortBy];
                const valB = b[sortBy];
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
    }, [friends, searchTerm, sortBy, sortOrder]);

    const onlineFriends = sortedAndFilteredFriends.filter((f) => onlineUsers.includes(f._id));

    return (
        <div className="p-4 space-y-10">
            <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Amitiés</h3>

            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-white mb-4">Amis connectés</h4>
                {onlineFriends.length === 0 ? (
                    <p className="text-gray-400 text-sm">Aucun ami en ligne pour le moment.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {onlineFriends.map((friend) => (
                            <div
                                key={friend._id}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800 border border-gray-700"
                            >
                                <img
                                    src={friend.avatar}
                                    alt={friend.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <span className="text-xs font-semibold text-gray-200 truncate w-full text-center">
                                    {friend.name}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
                    <input
                        type="text"
                        placeholder="Rechercher des amis..."
                        className="w-full md:w-1/3 p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-blue-500 transition duration-300 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleSort('since')}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            Trier par ajout {sortBy === 'since' && (sortOrder === 'asc' ? '?' : '?')}
                        </button>
                        <button
                            onClick={() => handleSort('matchesPlayed')}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            Trier par parties {sortBy === 'matchesPlayed' && (sortOrder === 'asc' ? '?' : '?')}
                        </button>
                        <button
                            onClick={() => handleSort('winRate')}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            Trier par victoire % {sortBy === 'winRate' && (sortOrder === 'asc' ? '?' : '?')}
                        </button>
                    </div>
                </div>

                {sortedAndFilteredFriends.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg">Aucun ami trouvé.</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow-xl border border-gray-700/50">
                        <table className="min-w-full bg-gray-800 rounded-lg">
                            <thead>
                                <tr className="bg-gray-700 text-gray-300 uppercase text-sm leading-normal">
                                    <th className="py-3 px-6 text-left">Avatar</th>
                                    <th className="py-3 px-6 text-left">Nom d'utilisateur</th>
                                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('since')}>
                                        Amis depuis
                                    </th>
                                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('matchesPlayed')}>
                                        Parties jouées
                                    </th>
                                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('winRate')}>
                                        Taux de victoire (%)
                                    </th>
                                    <th className="py-3 px-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-200 text-sm font-light">
                                {sortedAndFilteredFriends.map((friend) => {
                                    const isOnline = onlineUsers.includes(friend._id);
                                    return (
                                        <tr
                                            key={friend._id}
                                            className="border-b border-gray-700 hover:bg-gray-700 transition duration-200"
                                        >
                                            <td className="py-3 px-6 text-left whitespace-nowrap">
                                                <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
                                            </td>
                                            <td className="py-3 px-6 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span>{friend.name}</span>
                                                    <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                            isOnline
                                                                ? 'bg-green-600/20 text-green-300'
                                                                : 'bg-gray-700 text-gray-400'
                                                        }`}
                                                    >
                                                        {isOnline ? 'En ligne' : 'Hors ligne'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-left">{friend.since}</td>
                                            <td className="py-3 px-6 text-left">{friend.matchesPlayed}</td>
                                            <td className="py-3 px-6 text-left">{friend.winRate}%</td>
                                            <td className="py-3 px-6 text-center">
                                                <button
                                                    onClick={() => handleDeleteFriend(friend._id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition duration-300"
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Demandes reçues</h3>
                {pendingRequests.length === 0 ? (
                    <p className="text-gray-400 text-center italic">Aucune demande en attente.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingRequests.map((req) => (
                            <div key={req._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={req.avatar} alt={req.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <div className="text-sm font-semibold text-white">{req.name}</div>
                                        <div className="text-xs text-gray-400">Reçue le {req.date}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => acceptFriendRequest(req._id)}
                                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                                    >
                                        Accepter
                                    </button>
                                    <button
                                        onClick={() => denyFriendRequest(req._id)}
                                        className="px-3 py-1.5 rounded-lg bg-gray-700 text-white text-xs font-bold hover:bg-gray-600"
                                    >
                                        Refuser
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Demandes envoyées</h3>
                {sentRequests.length === 0 ? (
                    <p className="text-gray-400 text-center italic">Aucune demande envoyée.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sentRequests.map((req) => (
                            <div key={req._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={req.avatar} alt={req.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <div className="text-sm font-semibold text-white">{req.name}</div>
                                        <div className="text-xs text-gray-400">Envoyée le {req.date}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => cancelFriendRequest(req._id)}
                                    className="px-3 py-1.5 rounded-lg bg-gray-700 text-white text-xs font-bold hover:bg-gray-600"
                                >
                                    Annuler
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardFriends;
