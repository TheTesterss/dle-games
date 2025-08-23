import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FriendRequestSession from '../../utils/FriendRequestSession';
import Session from '../../utils/Session';

const DashboardFriends = () => {
    const {
        removeFriend,
        cancelFriendRequest,
        denyFriendRequest,
        acceptFriendRequest,
        fetchFriends,
        fetchFriendRequests,
        currentUser
    } = useAuth();
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        const fetchData = async () => {
            const friendsList = await fetchFriends(currentUser._id);
            const friendRequestsIds = await fetchFriendRequests(currentUser._id);
            const friendRequestsList = await Promise.all(friendRequestsIds.map((req) => FriendRequestSession.get(req)));

            const sortedFriends = friendsList.sort((a, b) => {
                return new Date(b.since) - new Date(a.since);
            });
            const outgoingRequests = friendRequestsList.filter((req) => req.to === currentUser._id);
            const incomingRequests = friendRequestsList.filter((req) => req.from === currentUser._id);

            const pendingRequestsPromises = outgoingRequests.map(async (req) => {
                const user = await Session.getUserById(req.from);
                return {
                    userId: req.from,
                    _id: req._id,
                    name: user.name,
                    avatar: user.avatar,
                    date: new Date(req.createdAt).toLocaleDateString()
                };
            });

            const sentRequestsPromises = incomingRequests.map(async (req) => {
                const user = await Session.getUserById(req.to);
                return {
                    userId: req.from,
                    _id: req._id,
                    name: user.name,
                    avatar: user.avatar,
                    date: new Date(req.createdAt).toLocaleDateString()
                };
            });

            const friendsListPromises = sortedFriends.map(async (friend) => {
                const f = await Session.getUserById(friend);
                return {
                    _id: f._id,
                    name: f.name,
                    avatar: f.avatar,
                    since: 'Unavailable',
                    matchesPlayed: -1,
                    winRate: -1
                };
            });

            const finalFriendsList = await Promise.all(friendsListPromises);
            const pendingRequests = await Promise.all(pendingRequestsPromises);
            const sentRequests = await Promise.all(sentRequestsPromises);

            setPendingRequests(pendingRequests);
            setSentRequests(sentRequests);
            setFriends(finalFriendsList);
        };
        fetchData();
    }, [currentUser._id, fetchFriends, fetchFriendRequests]);

    const handleDeleteFriend = async (id) => {
        console.log(`Removing friend with ID: ${id}`);
        await removeFriend(currentUser._id, id);
    };

    const handleFilter = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const handleAcceptRequest = async (id) => {
        await acceptFriendRequest(id);
    };

    const handleRejectRequest = async (id) => {
        await denyFriendRequest(id);
    };

    const handleCancelSentRequest = async (id) => {
        await cancelFriendRequest(id);
    };

    const sortedAndFilteredFriends = [...friends]
        .filter((friend) => friend.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (!sortBy) return 0;

            let valA = a[sortBy];
            let valB = b[sortBy];

            if (sortBy === 'since') {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    return (
        <div className="p-4 space-y-10">
            <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Vos amis</h3>
            <div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
                    <input
                        type="text"
                        placeholder="Rechercher des amis..."
                        className="w-full md:w-1/3 p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-blue-500 transition duration-300"
                        value={searchTerm}
                        onChange={handleFilter}
                    />
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleSort('since')}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            Trier par ajout {sortBy === 'since' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </button>
                        <button
                            onClick={() => handleSort('matchesPlayed')}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            Trier par parties {sortBy === 'matchesPlayed' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </button>
                        <button
                            onClick={() => handleSort('winRate')}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            Trier par victoire % {sortBy === 'winRate' && (sortOrder === 'asc' ? '▲' : '▼')}
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
                                    <th
                                        className="py-3 px-6 text-left cursor-pointer"
                                        onClick={() => handleSort('since')}
                                    >
                                        Amis depuis
                                    </th>
                                    <th
                                        className="py-3 px-6 text-left cursor-pointer"
                                        onClick={() => handleSort('matchesPlayed')}
                                    >
                                        Parties jouées
                                    </th>
                                    <th
                                        className="py-3 px-6 text-left cursor-pointer"
                                        onClick={() => handleSort('winRate')}
                                    >
                                        Taux de victoire (%)
                                    </th>
                                    <th className="py-3 px-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-200 text-sm font-light">
                                {sortedAndFilteredFriends.map((friend) => (
                                    <tr
                                        key={friend._id}
                                        className="border-b border-gray-700 hover:bg-gray-700 transition duration-200"
                                    >
                                        <td className="py-3 px-6 text-left whitespace-nowrap">
                                            <img
                                                src={friend.avatar}
                                                alt={friend.name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                        </td>
                                        <td className="py-3 px-6 text-left">{friend.name}</td>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <h3 className="text-3xl font-extrabold text-blue-500 mb-9 mt-9 text-center">Demandes reçues</h3>
                {pendingRequests.length === 0 ? (
                    <p className="text-gray-400">Aucune demande en attente.</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow border border-gray-700/50 mb-2">
                        <table className="min-w-full bg-gray-800 rounded-lg">
                            <thead>
                                <tr className="bg-gray-700 text-gray-300 uppercase text-sm leading-normal">
                                    <th className="py-3 px-6 text-left">Avatar</th>
                                    <th className="py-3 px-6 text-left">Nom d'utilisateur</th>
                                    <th className="py-3 px-6 text-left">Date</th>
                                    <th className="py-3 px-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-200 text-sm font-light">
                                {pendingRequests.map((req) => (
                                    <tr
                                        key={req.userId}
                                        className="border-b border-gray-700 hover:bg-gray-700 transition duration-200"
                                    >
                                        <td className="py-3 px-6 text-left whitespace-nowrap">
                                            <img src={req.avatar} alt={req.name} className="w-10 h-10 rounded-full" />
                                        </td>
                                        <td className="py-3 px-6 text-left">{req.name}</td>
                                        <td className="py-3 px-6 text-left">{req.date}</td>
                                        <td className="py-3 px-6 text-center space-x-2">
                                            <button
                                                onClick={() => handleAcceptRequest(req._id)}
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition duration-300"
                                            >
                                                Accepter
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req._id)}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition duration-300"
                                            >
                                                Refuser
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <h3 className="text-3xl font-extrabold text-blue-500 mb-9 mt-9 text-center">Demandes envoyées</h3>
                {sentRequests.length === 0 ? (
                    <p className="text-gray-400">Aucune demande envoyée.</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow border border-gray-700/50 mb-2">
                        <table className="min-w-full bg-gray-800 rounded-lg">
                            <thead>
                                <tr className="bg-gray-700 text-gray-300 uppercase text-sm leading-normal">
                                    <th className="py-3 px-6 text-left">Avatar</th>
                                    <th className="py-3 px-6 text-left">Nom d'utilisateur</th>
                                    <th className="py-3 px-6 text-left">Date</th>
                                    <th className="py-3 px-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-200 text-sm font-light">
                                {sentRequests.map((req) => (
                                    <tr
                                        key={req.userId}
                                        className="border-b border-gray-700 hover:bg-gray-700 transition duration-200"
                                    >
                                        <td className="py-3 px-6 text-left whitespace-nowrap">
                                            <img src={req.avatar} alt={req.name} className="w-10 h-10 rounded-full" />
                                        </td>
                                        <td className="py-3 px-6 text-left">{req.name}</td>
                                        <td className="py-3 px-6 text-left">{req.date}</td>
                                        <td className="py-3 px-6 text-center">
                                            <button
                                                onClick={() => handleCancelSentRequest(req._id)}
                                                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition duration-300"
                                            >
                                                Annuler
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardFriends;
