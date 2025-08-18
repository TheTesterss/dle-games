import { useState } from 'react';

const UserSearch = ({ navigateTo }) => {
    const [search, setSearch] = useState('');

    const handleSearch = () => {
        if (search.trim()) {
            navigateTo(`/user/${search.trim()}`);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-12">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">Rechercher un utilisateur</h2>
            <div className="flex">
                <input
                    type="text"
                    className="flex-1 p-3 rounded-l-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-0 focus:border-gray-700"
                    placeholder="Entrez un pseudonyme..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-r-lg transition duration-300"
                >
                    Rechercher
                </button>
            </div>
        </div>
    );
};

export default UserSearch;
