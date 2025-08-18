import FloatingIcons from './subcomponents/FloatingIcons';

const Header = () => {
    return (
        <header
            className={`relative py-20 overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 text-center rounded-t-xl shadow-2xl border border-gray-700`}
            style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1f2937 100%)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
        >
            <FloatingIcons />
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <h1 className="text-6xl md:text-8xl font-black text-blue-700 drop-shadow-lg leading-none mb-2">DLE</h1>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white dark:text-gray-300">Games</h2>
            </div>
        </header>
    );
};

export default Header;
