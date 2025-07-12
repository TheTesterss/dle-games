import React, { useState } from 'react';

const DashboardFriends = () => {
    // Fetch using the backend
    const [friends, setFriends] = useState([
        { id: 1, avatar: 'https://placehold.co/50x50/ff0000/ffffff?text=F1', pseudo: 'GamerDude', since: '2023-01-15', matchesPlayed: 120, winRate: 65 },
        { id: 2, avatar: 'https://placehold.co/50x50/00ff00/ffffff?text=F2', pseudo: 'ProPlayer', since: '2022-08-20', matchesPlayed: 80, winRate: 72 },
        { id: 3, avatar: 'https://placehold.co/50x50/0000ff/ffffff?text=F3', pseudo: 'NoobSlayer', since: '2024-03-01', matchesPlayed: 30, winRate: 40 },
        { id: 4, avatar: 'https://placehold.co/50x50/ffff00/000000?text=F4', pseudo: 'PixelPusher', since: '2023-11-10', matchesPlayed: 95, winRate: 58 },
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');

    const handleDeleteFriend = (id) => {
        setFriends(friends.filter(friend => friend.id !== id));
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

    const sortedAndFilteredFriends = [...friends]
        .filter(friend =>
            friend.pseudo.toLowerCase().includes(searchTerm.toLowerCase())
        )
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
        <div className="p-4">
            <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Vos amis</h3>

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
                            {sortedAndFilteredFriends.map((friend) => (
                                <tr key={friend.id} className="border-b border-gray-700 hover:bg-gray-700 transition duration-200">
                                    <td className="py-3 px-6 text-left whitespace-nowrap">
                                        <img src={friend.avatar} alt={friend.pseudo} className="w-10 h-10 rounded-full" />
                                    </td>
                                    <td className="py-3 px-6 text-left">{friend.pseudo}</td>
                                    <td className="py-3 px-6 text-left">{friend.since}</td>
                                    <td className="py-3 px-6 text-left">{friend.matchesPlayed}</td>
                                    <td className="py-3 px-6 text-left">{friend.winRate}%</td>
                                    <td className="py-3 px-6 text-center">
                                        <button
                                            onClick={() => handleDeleteFriend(friend.id)}
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
    );
};

export default DashboardFriends;