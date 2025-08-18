import { useEffect, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import Footer from './components/Footer';
import Header from './components/Header';
import Themes from './components/Themes';
import PageNotFound from './components/PageNotFound';
import UserSearch from './components/UserSearch';
import LeaderboardPreview from './components/LeaderboardPreview';
import PageNotImplemented from './components/PageNotImplemented';
import Pokemons from './components/Pokemons';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './providers/authProvider';
import UserProfile from './components/UserProfile';
import Leaderboard from './components/Leaderboard';

const DashboardWrapper = ({ navigateTo, path }) => {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated && path.startsWith('/profile')) {
            navigateTo('/login');
        }
    }, [isAuthenticated, navigateTo, path]);

    if (!isAuthenticated && path.startsWith('/profile')) {
        return null;
    }

    return <Dashboard navigateTo={navigateTo} />;
};

function App() {
    const [path, setPath] = useState(window.location.pathname);

    const navigateTo = (newPath) => {
        window.history.pushState({}, '', newPath);
        setPath(newPath);
    };

    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const renderCommonPage = (...MainComponents) => {
        return (
            <div className="p-8">
                <Header navigateTo={navigateTo} />
                <Navigation navigateTo={navigateTo} />
                <main className="flex-grow">
                    {MainComponents.map((Component, idx) => (
                        <Component key={idx} navigateTo={navigateTo} />
                    ))}
                </main>
                <Footer navigateTo={navigateTo} />
            </div>
        );
    };

    const renderPage = () => {
        switch (path) {
            case '/':
                return renderCommonPage(UserSearch, Themes, LeaderboardPreview);
            case '/themes':
                return renderCommonPage(Themes);
            case '/pokemon':
                return renderCommonPage(Pokemons);
            case '/user':
                return renderCommonPage(UserProfile);
            case '/leaderboard':
                return renderCommonPage(Leaderboard);
            case '/login':
                return <Login navigateTo={navigateTo} />;
            case '/signup':
                return <Signup navigateTo={navigateTo} />;
            case '/forum':
                return renderCommonPage(PageNotImplemented);
            case '/privacy':
                return renderCommonPage(Privacy);
            case '/terms':
                return renderCommonPage(Terms);
            case '/profile':
            case '/profile/stats':
            case '/profile/friends':
            case '/profile/profile':
                return <DashboardWrapper navigateTo={navigateTo} path={path} />;
            default:
                if (/^\/user\/[^/]+$/.test(path)) {
                    const name = path.split('/')[2];
                    return renderCommonPage((props) => <UserProfile {...props} navigateTo={navigateTo} name={name} />);
                }
                return renderCommonPage(PageNotFound);
        }
    };

    return (
        <AuthProvider navigateTo={navigateTo}>
            <div className="min-h-screen flex flex-col">
                <AnimatePresence mode="wait">
                    <Motion.div
                        key={path.split('/')[1] || '/'}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                        {renderPage()}
                    </Motion.div>
                </AnimatePresence>
            </div>
        </AuthProvider>
    );
}

export default App;
