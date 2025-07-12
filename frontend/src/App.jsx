/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import Footer from "src/components/Footer";
import Header from "src/components/Header";
import Home from "src/components/Home";
import PageNotFound from "src/components/PageNotFound";
import PageNotImplemented from "src/components/PageNotImplemented";
import Pokemons from "src/components/Pokemons";
import Privacy from "src/components/Privacy";
import Terms from "src/components/Terms";
import Navigation from 'src/components/Navigation';
import Login from 'src/components/Login';
import Signup from 'src/components/Signup';
import Dashboard from 'src/components/Dashboard';
import { useAuth } from 'src/hooks/useAuth';
import { AuthProvider } from 'src/providers/authProvider';

const DashboardWrapper = ({ navigateTo, path }) => {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated && path.startsWith('/profil')) {
            navigateTo('/login');
        }
    }, [isAuthenticated, navigateTo, path]);

    if (!isAuthenticated && path.startsWith('/profil')) {
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

    const renderCommonPage = (MainComponent) => {
        return (
            <div className="p-8">
                <Header navigateTo={navigateTo} />
                <Navigation />
                <main className="flex-grow">
                    <MainComponent navigateTo={navigateTo} />
                </main>
                <Footer navigateTo={navigateTo} />
            </div> 
        );
    };

    const renderPage = () => {
        switch (path) {
            case "/": case "/themes":
                return renderCommonPage(Home);
            case "/pokemon":
                return renderCommonPage(Pokemons);
            case "/login":
                return <Login navigateTo={navigateTo} />;
            case "/signup":
                return <Signup navigateTo={navigateTo} />;
            case "/forum":
                return renderCommonPage(PageNotImplemented);
            case "/privacy":
                return renderCommonPage(Privacy);
            case "/terms":
                return renderCommonPage(Terms);
            case "/profil":
            case "/profil/stats":
            case "/profil/friends":
            case "/profil/profile":
                return <DashboardWrapper navigateTo={navigateTo} path={path} />;
            default:
                return renderCommonPage(PageNotFound);
        }
    };

    return (
        <AuthProvider navigateTo={navigateTo}>
            <div className="min-h-screen flex flex-col">
                {renderPage()}
            </div>
        </AuthProvider>
    );
}

export default App;
