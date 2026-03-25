import React from 'react';

type NavigateTo = (path: string) => void;

type TermsOfUseProps = {
    navigateTo: NavigateTo;
};

const TermsOfUse = ({ navigateTo }: TermsOfUseProps) => {
    return (
        <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-10">
            <div className="max-w-4xl text-white space-y-8">
                <header className="text-center space-y-3">
                    <h2 className="text-4xl font-bold">Termes et conditions d'utilisation</h2>
                    <p className="text-gray-300">
                        En utilisant DLE Games, vous acceptez les regles ci-dessous.
                    </p>
                    <p className="text-xs text-gray-500">Derniere mise a jour : 06/02/2026</p>
                </header>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">1. Compte et securite</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                        <li>Vous etes responsable de votre compte et de vos identifiants.</li>
                        <li>Usurpation, partage de compte ou acces non autorise sont interdits.</li>
                        <li>Les comptes peuvent etre suspendus en cas d'abus ou de faille exploitee.</li>
                    </ul>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">2. Contenu et comportement</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                        <li>Respect des lois et des autres utilisateurs.</li>
                        <li>Interdiction de harcelement, spam, menaces ou contenu haineux.</li>
                        <li>Images et textes doivent rester appropries au public de la plateforme.</li>
                    </ul>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">3. Jeux et anti-triche</h3>
                    <p className="text-gray-300">
                        Toute triche, bot, automatisation ou manipulation de classement est interdite.
                        Les sanctions peuvent aller jusqu'au bannissement.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">4. Discussions et forum</h3>
                    <p className="text-gray-300">
                        Les messages, reactions et mentions doivent respecter un cadre sain. Les moderateurs
                        peuvent supprimer du contenu en cas d'abus.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">5. Premium et paiements</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                        <li>Les avantages Premium sont actives pendant la periode payee.</li>
                        <li>Les remboursements suivent les regles du prestataire de paiement.</li>
                        <li>Les liens cadeaux sont personnels et peuvent expirer.</li>
                    </ul>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">6. Propriete intellectuelle</h3>
                    <p className="text-gray-300">
                        DLE Games est un projet de fans. Pokemon et les noms associes sont des marques de Nintendo,
                        Creatures Inc. et Game Freak. Aucun droit n'est revendique sur ces marques.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">7. Disponibilite et evolution</h3>
                    <p className="text-gray-300">
                        Le service peut etre modifie, suspendu ou ameliore sans preavis afin d'assurer sa qualite
                        et sa securite.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">8. Responsabilite</h3>
                    <p className="text-gray-300">
                        Nous faisons notre maximum pour assurer la stabilite, mais des interruptions peuvent survenir.
                    </p>
                </section>

                <section className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-2xl font-semibold">9. Sanctions et moderation</h3>
                    <p className="text-gray-300">
                        Les administrateurs peuvent restreindre ou supprimer du contenu ou des comptes en cas de non
                        respect des regles.
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

export default TermsOfUse;
