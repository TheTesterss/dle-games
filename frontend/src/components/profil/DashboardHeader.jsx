import React from 'react';
import FloatingIcons from "../subcomponents/FloatingIcons";
import { useAuth } from '../../hooks/useAuth';

const DashboardHeader = ({ navigateTo }) => {
    const navItems = [
        { id: "", label: "Accueil" },
        { id: "themes", label: "Thèmes" },
        { id: "forum", label: "Forum" }
    ];
   
    const { currentUser } = useAuth();

    return (
        <header
            className={`relative py-8 px-4 overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 text-center rounded-b-xl shadow-2xl border border-gray-700 flex flex-col md:flex-row items-center justify-between`}
            style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1f2937 100%)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
        >
            <FloatingIcons />
            <div className="relative z-10 flex flex-col items-center md:items-start mb-4 md:mb-0">
                <h1 className="text-5xl md:text-6xl font-black text-blue-700 drop-shadow-lg leading-none">
                    DLE
                </h1>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white dark:text-gray-300">Games</h2>
            </div>

            <nav className="relative z-10 flex-grow">
                <ul className="relative flex flex-wrap justify-center space-x-4 md:space-x-8 text-white">
                    {navItems.map(item => {
                        return <li>
                            <a
                                href="#"
                                onClick={() => navigateTo(`/${item.id}`)}
                                className={`text-xl font-bold px-3 py-2 rounded-md transition-colors duration-300
                             text-blue-300 hover:text-blue-900 hover:bg-blue-300`}
                            >
                                {item.label}
                            </a>
                        </li>
                    })}
                </ul>
            </nav>

            <div className="relative z-10 flex items-center space-x-4 mt-4 md:mt-0">
                {currentUser && (
                    <>
                        <img
                            src={currentUser.avatar}
                            alt="User Avatar"
                            className="w-12 h-12 rounded-full border-2 border-blue-500 shadow-lg"
                        />
                        <span className="text-xl font-semibold text-white">{currentUser.username}</span>
                    </>
                )}
            </div>
        </header>
    );
};

export default DashboardHeader;