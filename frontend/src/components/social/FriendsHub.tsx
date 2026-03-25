import React from 'react';
import DashboardHeader from '../profile/DashboardHeader';
import Footer from '../common/Footer';

interface FriendsHubProps {
    navigateTo: (path: string) => void;
}

const FriendsHub: React.FC<FriendsHubProps> = ({ navigateTo }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-950 text-white font-inter">
            <DashboardHeader navigateTo={navigateTo} />
            <div className="flex-1 px-6 md:px-10 py-10">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white">Amitiés</h2>
                        <p className="text-gray-400 mt-2">
                            La gestion des amis est désormais centralisée dans Paramètres {'>'} Amitiés.
                        </p>
                    </header>
                    <section className="bg-gray-900 rounded-xl border border-gray-800 p-6 md:p-8 text-center">
                        <p className="text-gray-300 mb-6">
                            Accédez à la liste des amis connectés, demandes et tri avancé depuis votre page paramètres.
                        </p>
                        <button
                            onClick={() => navigateTo('/settings/friends')}
                            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                        >
                            Ouvrir Amitiés
                        </button>
                    </section>
                </div>
            </div>
            <Footer navigateTo={navigateTo} />
        </div>
    );
};

export default FriendsHub;
