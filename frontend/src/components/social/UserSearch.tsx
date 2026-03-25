import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Session from '../../utils/Session';
import { Account } from '../../types';

interface UserSearchProps {
    navigateTo: (path: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ navigateTo }) => {
    const { onlineUsers } = useAuth();
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<Account[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<Account[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const us = await Session.getUsers();
                const filtered = (us || []).filter((u) => u.name !== 'admin' && !u.badges?.admin && !u.badges?.owner);
                setUsers(filtered);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        if (search.trim().length >= 1) {
            const filtered = users.filter((user) => user.name.toLowerCase().includes(search.trim().toLowerCase()));
            setFilteredUsers(filtered);
            setShowDropdown(filtered.length > 0);
        } else {
            setShowDropdown(false);
        }
    }, [search, users]);

    const handleSearch = (username: string) => {
        if (username.trim()) {
            navigateTo(`/user/${username.trim()}`);
            setShowDropdown(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto mt-12 relative">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">Rechercher un utilisateur</h2>

            <div className="max-w-xl mx-auto relative">
                <div className="flex flex-col relative">
                    <div className="flex w-full">
                        <input
                            type="text"
                            className="flex-1 p-3 rounded-l-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-0 focus:border-gray-700"
                            placeholder="Entrez un pseudonyme..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onFocus={() => search.length >= 1 && filteredUsers.length > 0 && setShowDropdown(true)}
                        />
                        <button
                            onClick={() => handleSearch(search)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-r-lg transition duration-300"
                        >
                            Rechercher
                        </button>
                    </div>

                    {showDropdown && (
                        <ul className="absolute top-full left-0 w-full mt-1 max-h-64 overflow-y-auto bg-gray-900 rounded-lg shadow-lg scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-800 z-50">
                            {filteredUsers.map((user) => {
                                const isOnline = onlineUsers.includes(user._id);
                                return (
                                    <li
                                        key={user.name}
                                        className="flex items-center justify-between p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-b-0"
                                    >
                                        <div
                                            className="flex items-center gap-3"
                                            onClick={() => handleSearch(user.name)}
                                        >
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-10 h-10 mr-1 object-cover rounded-full"
                                            />
                                            <div>
                                                <span className="text-gray-200 font-medium">{user.name}</span>
                                                {isOnline && (
                                                    <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                                        Connecté
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserSearch;
