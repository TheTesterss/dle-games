const Navigation = ({ navigateTo }) => {
    const navItems = [
        { id: '', label: 'Accueil' },
        { id: 'themes', label: 'Thèmes' },
        { id: 'profile', label: 'Profil' },
        { id: 'forum', label: 'Forum' },
        { id: 'leaderboard', label: 'Classement' }
    ];

    return (
        <nav
            className="sticky top-0 z-30 w-full p-4 transition-all duration-300 backdrop-blur-lg bg-gray-900/80 border-b border-gray-700/50 rounded-xl"
            style={{
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(12px)',
                borderImage: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent) 1'
            }}
        >
            <ul className="relative flex flex-wrap justify-center space-x-4 md:space-x-8 text-white">
                {navItems.map((item) => (
                    <li key={item.label}>
                        <a
                            href="#"
                            onClick={() => navigateTo(`/${item.id}`)}
                            className={`text-xl font-bold px-3 py-2 rounded-md transition-colors duration-300
                                text-blue-300 hover:text-blue-900 hover:bg-blue-300`}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navigation;
