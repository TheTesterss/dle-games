const Navigation = ({ navigateTo }) => {
    const navItems = [
        { id: "themes", label: "Thèmes" },
        { id: "profil", label: "Profil" },
        { id: "forum", label: "Forum" }
    ];
   
    return (
        <nav
    className={`sticky top-0 z-30 w-full p-4 transition-all duration-300 backdrop-blur-lg bg-gray-900/80 border-b border-gray-700/50 rounded-xl`}
    style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderImage: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent) 1'
    }}
>
            <ul className="flex flex-wrap justify-center space-x-4 md:space-x-8">
                {navItems.map((item) => (
                    <li key={item.id}>
                        <a
                            href={`${item.id}`}
                            onClick={(e) => navigateTo(e.id)}
                            className={`text-lg font-semibold px-3 py-2 rounded-md transition-colors duration-300
                            text-blue-800 hover:text-white hover:bg-blue-900`}
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