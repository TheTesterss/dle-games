import React from 'react';

const DashboardFooter = ({ navigateTo }) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            className={`py-6 px-4 text-center shadow-2xl border-t border-gray-700/50
                        bg-gradient-to-t from-gray-900 to-gray-800 text-white flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-8`}
            style={{
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
        >
            <p className="text-md font-medium">&copy; {currentYear} Morgan Jaouen - TheTesterss</p>
            <span className={`text-gray-400 hidden md:block`}>|</span>
            <a
                href="#"
                onClick={() => navigateTo('/privacy')}
                className={`hover:text-blue-700 transition ease-in-out duration-200 text-white text-md`}
            >
                Politique de confidentialité
            </a>
            <span className={`text-gray-400 hidden md:block`}>|</span>
            <a
                href="#"
                onClick={() => navigateTo('/terms')}
                className={`hover:text-blue-700 transition ease-in-out duration-200 text-white text-md`}
            >
                Termes d'utilisation
            </a>
        </footer>
    );
};

export default DashboardFooter;
