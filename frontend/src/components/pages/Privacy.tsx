import React from 'react';

type NavigateTo = (path: string) => void;

type PolicyPrivacyProps = {
    navigateTo: NavigateTo;
};

const PolicyPrivacy = ({ navigateTo }: PolicyPrivacyProps) => {
    return (
        <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-10">
            <div className="max-w-4xl text-white space-y-8">
                <header className="text-center space-y-3">
                    <h2 className="text-4xl font-bold">Politique de confidentialite</h2>
                    <p className="text-gray-300">
                        Cette politique explique comment DLE Games collecte, utilise et protege vos donnees.
                    </p>
                    <p className="text-xs text-gray-500">Derniere mise a jour : 06/02/2026</p>
                </header>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">1. Donnees collectees</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                        <li>Compte : pseudo, email, avatar, bannieres et bio.</li>
                        <li>Social : liste d'amis, abonnements, demandes d'amis, presence en ligne.</li>
                        <li>Jeux : historique de parties, statistiques, classements.</li>
                        <li>Forum : posts, reponses, reactions, signalements et moderation.</li>
                        <li>Discussions : messages, pieces jointes (images, videos), reactions.</li>
                        <li>Premium : statut, niveau, expiration et historique d'achat.</li>
                        <li>Technique : logs d'erreur, donnees de session, securite.</li>
                    </ul>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">2. Finalites</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                        <li>Fournir les jeux, le forum, les discussions et les notifications.</li>
                        <li>Permettre la moderation et la securite de la communaute.</li>
                        <li>Ameliorer la qualite du service et corriger les bugs.</li>
                        <li>Gerer les abonnements premium et les paiements associes.</li>
                    </ul>
                    <p className="text-gray-300">
                        <strong>Aucune revente de donnees</strong> n'est realisee.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">3. Cookies et session</h3>
                    <p className="text-gray-300">
                        Les cookies sont utilises pour l'authentification, la session et la securite.
                        Aucun cookie publicitaire n'est utilise.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">4. Paiements et Premium</h3>
                    <p className="text-gray-300">
                        Les paiements sont traites par des prestataires securises. DLE Games ne stocke pas
                        vos donnees bancaires. Les donnees premium (niveau, dates, statut) servent a activer
                        ou desactiver vos avantages.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">5. Stockage et securite</h3>
                    <p className="text-gray-300">
                        Les mots de passe sont chiffres et des mesures de securite sont mises en place pour proteger
                        les comptes et les donnees.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">6. Partage et acces</h3>
                    <p className="text-gray-300">
                        Les donnees ne sont partagees qu'avec les services techniques necessaires au fonctionnement
                        (hebergement, notifications, paiements). Aucun partage commercial n'est effectue.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">7. Conservation</h3>
                    <p className="text-gray-300">
                        Les donnees sont conservees tant que le compte est actif. Vous pouvez demander la suppression
                        definitive de votre compte.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">8. Vos droits</h3>
                    <p className="text-gray-300">
                        Vous pouvez demander l'acces, la modification ou la suppression de vos donnees a tout moment
                        via l'equipe d'administration.
                    </p>
                </section>

                <div className="flex justify-center">
                    <button
                        onClick={() => navigateTo('/')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
                    >
                        Revenir
                    </button>
                </div>
            </div>
        </main>
    );
};

export default PolicyPrivacy;
