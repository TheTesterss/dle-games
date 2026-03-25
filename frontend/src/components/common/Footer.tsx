import React from 'react';

type FooterProps = {
    navigateTo?: (path: string) => void;
};

const Footer: React.FC<FooterProps> = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            className={`py-12 px-4 text-center rounded-xl shadow-2xl border-t border-gray-700/50
    bg-gradient-to-t from-gray-900 to-gray-800 text-white`}
            style={{
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
        >
            <div className="container mx-auto">
                <p className="text-lg font-medium mb-2">&copy; {currentYear} Morgan Jaouen - TheTesterss</p>
                <div className="flex justify-center space-x-4 mt-4">
                    <a href="/privacy" className={`hover:text-blue-700 transition ease-in-out duration-200 text-white`}>
                        Politique de confidentialité
                    </a>
                    <span className={`text-gray-400`}>|</span>
                    <a href="/terms" className={`hover:text-blue-700 transition ease-in-out duration-200 text-white`}>
                        Termes d'utilisation
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
