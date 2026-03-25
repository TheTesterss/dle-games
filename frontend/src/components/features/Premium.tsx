import React, { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import AdminSession from '../../utils/AdminSession';
import { baseURL } from '../../utils/d';

type NavigateTo = (path: string) => void;

type PremiumProps = {
    navigateTo: NavigateTo;
};

const Premium = ({ navigateTo }: PremiumProps) => {
    const { currentUser } = useAuth();
    const [status, setStatus] = useState('');
    const [giftLinks, setGiftLinks] = useState<{ games_one?: string; games_plus?: string }>({});
    const [giftLoading, setGiftLoading] = useState<'games_one' | 'games_plus' | null>(null);
    const [claimCode, setClaimCode] = useState('');
    const [claimLoading, setClaimLoading] = useState(false);

    const isAdmin = !!(currentUser?.badges?.admin || currentUser?.badges?.owner || currentUser?.name === 'admin');

    const buildGiftText = (code?: string) => {
        if (!code) return '';
        const base = baseURL.replace('/api', '');
        return `gift:${code} | ${base}/gift/${code}`;
    };

    const handleGenerateGift = async (tier: 'games_one' | 'games_plus') => {
        if (!currentUser?._id || !isAdmin) return;
        try {
            setGiftLoading(tier);
            const gift = await AdminSession.createPremiumGift(currentUser._id, {
                tier,
                durationDays: 30,
                expiresInDays: 30
            });
            const code = gift?.code as string | undefined;
            if (code) {
                setGiftLinks((prev) => ({ ...prev, [tier]: code }));
                setStatus('Lien premium généré.');
            }
        } catch (err) {
            setStatus('Erreur lors de la génération du lien.');
        } finally {
            setGiftLoading(null);
        }
    };

    const handleCopyGift = async (tier: 'games_one' | 'games_plus') => {
        const text = buildGiftText(giftLinks[tier]);
        if (!text) return;
        try {
            await navigator.clipboard?.writeText(text);
            setStatus('Lien copié dans le presse-papiers.');
        } catch {
            setStatus('Impossible de copier le lien.');
        }
    };

    const handleClaimGift = async () => {
        if (!currentUser?._id) {
            navigateTo('/login');
            return;
        }
        const code = claimCode.trim().toUpperCase();
        if (!code) return;
        try {
            setClaimLoading(true);
            const res = await fetch(`${baseURL}/premium/gifts/${encodeURIComponent(code)}/claim`, {
                method: 'POST',
                credentials: 'include',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id })
            });
            if (!res.ok) {
                setStatus('Code invalide ou déjà utilisé.');
                return;
            }
            setStatus('Premium activé !');
            setClaimCode('');
        } catch (err) {
            setStatus('Erreur lors de l\'activation du code.');
        } finally {
            setClaimLoading(false);
        }
    };

    return (
        <main className="min-h-[70vh] px-4 py-10">
            <div className="max-w-6xl mx-auto text-white space-y-10">
                <header className="relative overflow-hidden rounded-3xl border border-blue-900/50 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-10">
                    <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
                    <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="relative">
                        <p className="text-xs uppercase tracking-[0.35em] text-blue-300 font-semibold">DLE GAMES</p>
                        <h2 className="text-4xl md:text-5xl font-black mt-3">Premium</h2>
                        <p className="text-gray-300 max-w-2xl mt-4">
                            Débloquez les meilleures options sociales et de jeu. Même tag public, avantages internes diffrents.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-6">
                            <button
                                onClick={() => navigateTo('/settings/premium')}
                                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-bold"
                            >
                                Gérer mon compte
                            </button>
                            <button
                                onClick={() => navigateTo('/chat')}
                                className="px-5 py-3 rounded-xl border border-blue-500/40 text-blue-200 hover:bg-blue-500/10 transition font-bold"
                            >
                                Partager un cadeau
                            </button>
                        </div>
                        {status && (
                            <div className="mt-4 text-sm text-blue-200 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2 inline-flex">
                                {status}
                            </div>
                        )}
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-widest text-blue-300 font-semibold">Games One</p>
                                <h3 className="text-2xl font-bold mt-2">Premium</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black">2.99 EUR</p>
                                <p className="text-xs text-gray-400">par mois (TVA incluse)</p>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-400">Ou 29.99 EUR / an</div>
                        <ul className="mt-6 space-y-2 text-gray-300 text-sm">
                            <li>50 MB d'envoi fichiers</li>
                            <li>10 images par post</li>
                            <li>Limites de caractères étendues</li>
                            <li>Bannière image autorisée</li>
                        </ul>
                        <button
                            onClick={() => navigateTo('/settings/premium')}
                            className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-bold"
                        >
                            Choisir Games One
                        </button>
                    </div>

                    <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm uppercase tracking-widest text-pink-300 font-semibold">Games Plus</p>
                                    <h3 className="text-2xl font-bold mt-2">Premium+</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black">6.99 EUR</p>
                                    <p className="text-xs text-gray-400">par mois (TVA incluse)</p>
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-gray-400">Ou 69.99 EUR / an</div>
                            <ul className="mt-6 space-y-2 text-gray-300 text-sm">
                                <li>500 MB d'envoi fichiers</li>
                                <li>Plus d'options de jeu exclusives</li>
                                <li>Accès anticipé aux nouveaux modes</li>
                                <li>Priorité dans la recherche</li>
                            </ul>
                            <button
                                onClick={() => navigateTo('/settings/premium')}
                                className="mt-6 w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 transition font-bold"
                            >
                                Choisir Games Plus
                            </button>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-gray-800 bg-gray-900/60 p-6">
                    <h3 className="text-2xl font-bold">Comparatif des avantages</h3>
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-left text-gray-400">
                                    <th className="py-2">Fonctionnalité</th>
                                    <th className="py-2">Gratuit</th>
                                    <th className="py-2">Games One</th>
                                    <th className="py-2">Games Plus</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-200">
                                <tr className="bg-gray-900/70">
                                    <td className="py-3 px-2 rounded-l-xl">Taille d'envoi maximale</td>
                                    <td className="py-3 font-semibold">5 MB</td>
                                    <td className="py-3 font-semibold text-blue-200">50 MB</td>
                                    <td className="py-3 rounded-r-xl font-semibold text-pink-200">500 MB</td>
                                </tr>
                                <tr className="bg-gray-900/70">
                                    <td className="py-3 px-2 rounded-l-xl">Images par post</td>
                                    <td className="py-3 font-semibold">4</td>
                                    <td className="py-3 font-semibold text-blue-200">10</td>
                                    <td className="py-3 rounded-r-xl font-semibold text-pink-200">10</td>
                                </tr>
                                <tr className="bg-gray-900/70">
                                    <td className="py-3 px-2 rounded-l-xl">Joueurs max par partie (Pokémon)</td>
                                    <td className="py-3 font-semibold">4</td>
                                    <td className="py-3 font-semibold text-blue-200">7</td>
                                    <td className="py-3 rounded-r-xl font-semibold text-pink-200">10</td>
                                </tr>
                                <tr className="bg-gray-900/70">
                                    <td className="py-3 px-2 rounded-l-xl">Vidéos en messages</td>
                                    <td className="py-3">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-300">
                                            <FaTimes />
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                                            <FaCheck />
                                        </span>
                                    </td>
                                    <td className="py-3 rounded-r-xl">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                                            <FaCheck />
                                        </span>
                                    </td>
                                </tr>
                                <tr className="bg-gray-900/70">
                                    <td className="py-3 px-2 rounded-l-xl">Bannière profil (image)</td>
                                    <td className="py-3">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-300">
                                            <FaTimes />
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                                            <FaCheck />
                                        </span>
                                    </td>
                                    <td className="py-3 rounded-r-xl">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                                            <FaCheck />
                                        </span>
                                    </td>
                                </tr>
                                <tr className="bg-gray-900/70">
                                    <td className="py-3 px-2 rounded-l-xl">Salles en parallèle</td>
                                    <td className="py-3 font-semibold">1</td>
                                    <td className="py-3 font-semibold text-blue-200">3</td>
                                    <td className="py-3 rounded-r-xl font-semibold text-pink-200">5</td>
                                </tr>
                                <tr className="bg-gray-900/70">
                                    <td className="py-3 px-2 rounded-l-xl">Accès aux nouveautés en avance</td>
                                    <td className="py-3">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-300">
                                            <FaTimes />
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                                            <FaCheck />
                                        </span>
                                    </td>
                                    <td className="py-3 rounded-r-xl">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                                            <FaCheck />
                                        </span>
                                    </td>
                                </tr>
                                <tr className="bg-gray-950/80">
                                    <td className="py-3 px-2 font-semibold text-gray-300" colSpan={4}>
                                        Mode pokémon
                                    </td>
                                </tr>
                                <tr className="bg-gray-900/70">
                                    <td className="py-3 px-2 rounded-l-xl">Générations Pokémon</td>
                                    <td className="py-3 font-semibold">1 - 4</td>
                                    <td className="py-3 font-semibold text-blue-200">Toutes</td>
                                    <td className="py-3 rounded-r-xl font-semibold text-pink-200">Toutes</td>
                                </tr>
                                <tr className="bg-gray-900/70">
                                    <td className="py-3 px-2 rounded-l-xl">
                                        Accès à toutes les options
                                    </td>
                                    <td className="py-3">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-300">
                                            <FaTimes />
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                                            <FaCheck />
                                        </span>
                                    </td>
                                    <td className="py-3 rounded-r-xl">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                                            <FaCheck />
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
                        <h4 className="text-lg font-bold">Moyens de paiement</h4>
                        <p className="text-sm text-gray-400 mt-2">Cartes enregistrées, TVA incluse.</p>
                        <button
                            onClick={() => navigateTo('/settings/premium')}
                            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition text-sm font-bold"
                        >
                            Gérer
                        </button>
                    </div>
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
                        <h4 className="text-lg font-bold">Historique</h4>
                        <p className="text-sm text-gray-400 mt-2">Derniers achats et renouvellements.</p>
                        <button
                            onClick={() => navigateTo('/settings/logs')}
                            className="mt-4 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-sm font-bold"
                        >
                            Voir l'historique
                        </button>
                    </div>
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
                        <h4 className="text-lg font-bold">Codes cadeaux</h4>
                        <p className="text-sm text-gray-400 mt-2">
                            Créez ou activez un lien cadeau quand vous souhaitez le partager.
                        </p>
                        <div className="mt-4 space-y-3 text-sm text-gray-300">
                            {(['games_one', 'games_plus'] as const).map((tier) => (
                                <div
                                    key={tier}
                                    className="flex flex-col gap-2 rounded-xl border border-gray-800 bg-gray-950/60 px-3 py-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{tier === 'games_one' ? 'Games One (30 jours)' : 'Games Plus (30 jours)'}</span>
                                        <button
                                            onClick={() => handleGenerateGift(tier)}
                                            disabled={!isAdmin || giftLoading === tier}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tier === 'games_one' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-pink-600 hover:bg-pink-500'} text-white disabled:opacity-40`}
                                        >
                                            {giftLoading === tier ? 'Génération...' : 'Générer'}
                                        </button>
                                    </div>
                                    <div className="text-[11px] text-gray-400 break-all min-h-[18px]">
                                        {giftLinks[tier] ? buildGiftText(giftLinks[tier]) : 'Aucun lien généré'}
                                    </div>
                                    <button
                                        onClick={() => handleCopyGift(tier)}
                                        className="self-start px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 text-xs hover:bg-gray-700 disabled:opacity-50"
                                        disabled={!giftLinks[tier]}
                                    >
                                        Copier le lien
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-xs text-gray-400">
                            Astuce: le lien se crée au clic sur "Générer", puis peut être copié et partagé.
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="text-xs text-gray-500">Activer un code cadeau</div>
                            <div className="flex gap-2">
                                <input
                                    value={claimCode}
                                    onChange={(e) => setClaimCode(e.target.value)}
                                    placeholder="CODE PREMIUM"
                                    className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200"
                                />
                                <button
                                    onClick={handleClaimGift}
                                    disabled={claimLoading}
                                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-50"
                                >
                                    {claimLoading ? '...' : 'Activer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Premium;
