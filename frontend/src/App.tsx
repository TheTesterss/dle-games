import { useEffect, useState, type ComponentType } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import Footer from './components/common/Footer';
import Header from './components/common/Header';
import Themes from './components/pages/Themes';
import PageNotFound from './components/pages/PageNotFound';
import UserSearch from './components/social/UserSearch';
import LeaderboardPreview from './components/features/LeaderboardPreview';
import PageNotImplemented from './components/pages/PageNotImplemented';
import Privacy from './components/pages/Privacy';
import Terms from './components/pages/Terms';
import Navigation from './components/common/Navigation';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Settings from './components/pages/Settings';
import FriendsHub from './components/social/FriendsHub';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './providers/authProvider';
import UserProfile from './components/social/UserProfile';
import Leaderboard from './components/features/Leaderboard';
import Forum from './components/forum/Forum';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUserDashboard from './components/admin/AdminUserDashboard';
import ForumPost from './components/forum/ForumPost';
import Pokemon from './components/features/Pokemon';
import News from './components/pages/News';
import NewsArticle from './components/pages/NewsArticle';
import Notifications from './components/common/Notifications';
import PrivateChat from './components/social/PrivateChat';
import Premium from './components/features/Premium';

type NavigateTo = (path: string) => void;

type SettingsWrapperProps = {
    navigateTo: NavigateTo;
    path: string;
};

const SettingsUiApplier = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        const body = document.body;
        if (!body) return;
        const classes = [
            'ui-high-contrast',
            'ui-reduce-motion',
            'ui-large-text',
            'ui-compact',
            'ui-hide-timestamps'
        ];
        body.classList.remove(...classes);
        const settings = currentUser?.settings;
        if (settings?.ui?.highContrast) body.classList.add('ui-high-contrast');
        if (settings?.ui?.reduceMotion) body.classList.add('ui-reduce-motion');
        if (settings?.ui?.largeText) body.classList.add('ui-large-text');
        if (settings?.text?.compactMode) body.classList.add('ui-compact');
        if (settings?.text?.showTimestamps === false) body.classList.add('ui-hide-timestamps');
    }, [currentUser?.settings]);

    return null;
};
const NotificationRouteWatcher = ({ path }: { path: string }) => {
    const { markNotificationsSeen } = useAuth();

    useEffect(() => {
        if (!markNotificationsSeen) return;
        if (path.startsWith('/chat')) {
            markNotificationsSeen((n: any) => n.type === 'pm_message' || n.type === 'pm_mention');
        }
        if (path.startsWith('/settings/friends')) {
            markNotificationsSeen((n: any) => n.type === 'friend_request');
        }
        if (path.startsWith('/pokemon')) {
            markNotificationsSeen((n: any) => n.type === 'game_invite');
        }
    }, [path, markNotificationsSeen]);

    return null;
};

const SettingsWrapper = ({ navigateTo, path }: SettingsWrapperProps) => {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated && path.startsWith('/settings')) {
            navigateTo('/login');
        }
    }, [isAuthenticated, navigateTo, path]);

    if (!isAuthenticated && path.startsWith('/settings')) {
        return null;
    }

    return <Settings navigateTo={navigateTo} />;
};

function App() {
    const [path, setPath] = useState<string>(window.location.pathname);

    const navigateTo: NavigateTo = (newPath) => {
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

    useEffect(() => {
        const handleContextMenu = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && target.closest('[data-contextmenu="allow"]')) {
                return;
            }
            event.preventDefault();
        };

        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    const renderCommonPage = (...MainComponents: Array<ComponentType<any>>) => {
        return (
            <div className="p-8">
                <Header navigateTo={navigateTo} />
                <Navigation navigateTo={navigateTo} />
                <Notifications navigateTo={navigateTo} />
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
            case '/user':
                return renderCommonPage(PageNotFound);
            case '/leaderboard':
                return renderCommonPage(Leaderboard);
            case '/login':
                return <Login navigateTo={navigateTo} />;
            case '/signup':
                return <Signup navigateTo={navigateTo} />;
            case '/forum':
                return renderCommonPage(Forum);
            case '/pokemon':
                return renderCommonPage(Pokemon);
            case '/news':
                return renderCommonPage(News);
            case '/admin':
                return renderCommonPage(AdminDashboard);
            case '/privacy':
                return renderCommonPage(Privacy);
            case '/terms':
                return renderCommonPage(Terms);
            case '/premium':
                return renderCommonPage(Premium);
            case '/chat':
                return renderCommonPage((props) => <PrivateChat {...props} navigateTo={navigateTo} />);
            case '/hub':
                return renderCommonPage(FriendsHub);
            case '/settings':
            case '/settings/account':
            case '/settings/security':
            case '/settings/stats':
            case '/settings/logs':
            case '/settings/friends':
            case '/settings/messages':
            case '/settings/premium':
            case '/settings/admin':
            case '/settings/notifications':
            case '/settings/interface':
                return <SettingsWrapper navigateTo={navigateTo} path={path} />;
            default:
                if (/^\/user\/[^/]+$/.test(path)) {
                    const name = path.split('/')[2];
                    return renderCommonPage((props) => <UserProfile {...props} navigateTo={navigateTo} name={name} />);
                }
                if (/^\/chat\/[^/]+$/.test(path)) {
                    const name = path.split('/')[2];
                    return renderCommonPage((props) => <PrivateChat {...props} navigateTo={navigateTo} name={name} />);
                }
                if (/^\/admin\/user\/[^/]+$/.test(path)) {
                    const userId = path.split('/')[3];
                    return renderCommonPage((props) => (
                        <AdminUserDashboard {...props} navigateTo={navigateTo} userId={userId} />
                    ));
                }
                if (/^\/forum\/post\/[^/]+$/.test(path)) {
                    const postId = path.split('/')[3];
                    return renderCommonPage((props) => (
                        <ForumPost {...props} navigateTo={navigateTo} postId={postId} />
                    ));
                }
                if (/^\/news\/[^/]+$/.test(path)) {
                    const slug = path.split('/')[2];
                    return renderCommonPage((props) => <NewsArticle {...props} navigateTo={navigateTo} slug={slug} />);
                }
                return renderCommonPage(PageNotFound);
        }
    };

    return (
        <AuthProvider navigateTo={navigateTo}>
            <SettingsUiApplier />
            <div className="min-h-screen flex flex-col">
                <NotificationRouteWatcher path={path} />
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








