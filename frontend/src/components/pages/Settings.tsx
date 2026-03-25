import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthContextType } from '../../contexts/authContext';
import DashboardHeader from '../profile/DashboardHeader';
import Footer from '../common/Footer';
import DashboardProfile from '../profile/DashboardProfile';
import DashboardStats from '../profile/DashboardStats';
import DashboardLogs from '../profile/DashboardLogs';
import DashboardFriends from '../profile/DashboardFriends';
import Session from '../../utils/Session';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

interface SettingsProps {
    navigateTo: (path: string) => void;
}

type SectionId =
    | 'account'
    | 'security'
    | 'logs'
    | 'stats'
    | 'friends'
    | 'messages'
    | 'premium'
    | 'admin'
    | 'notifications'
    | 'interface';

type StatsHistoryRow = {
    date: string;
    matches: number;
    wins: number;
    losses: number;
};

type StatsBreakdownRow = {
    _id: string;
    matches: number;
    wins: number;
    losses: number;
};

type StatsHistoryResponse = {
    daily: StatsHistoryRow[];
    byMode: StatsBreakdownRow[];
    byGame: StatsBreakdownRow[];
};

const defaultSettings = {
    text: {
        autoPunctuation: true,
        smartMentions: true,
        showTimestamps: true,
        compactMode: false
    },
    ui: {
        highContrast: false,
        reduceMotion: false,
        largeText: false
    },
    messages: {
        hideOnlineStatus: false,
        muteNonFriends: false
    },
    notifications: {
        enabled: true,
        messages: true,
        friendRequests: true,
        gameInvites: true,
        marketing: false,
        digest: true,
        inApp: true,
        email: false,
        push: false,
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
        }
    }
};

const Settings: React.FC<SettingsProps> = ({ navigateTo }) => {
    const { currentUser, updateUser } = useAuth() as AuthContextType;
    const [activeSection, setActiveSection] = useState<SectionId>('account');
    const [settings, setSettings] = useState(defaultSettings);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [history, setHistory] = useState<StatsHistoryRow[]>([]);
    const [historyDays, setHistoryDays] = useState(30);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [byMode, setByMode] = useState<StatsBreakdownRow[]>([]);
    const [byGame, setByGame] = useState<StatsBreakdownRow[]>([]);

    useEffect(() => {
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1] as SectionId;
        const valid: SectionId[] = [
            'account',
            'security',
            'logs',
            'stats',
            'friends',
            'messages',
            'premium',
            'admin',
            'notifications',
            'interface'
        ];
        if (valid.includes(lastPart)) {
            setActiveSection(lastPart);
        } else {
            setActiveSection('account');
        }
    }, []);

    useEffect(() => {
        if (!currentUser?.settings) return;
        setSettings({
            text: { ...defaultSettings.text, ...(currentUser.settings.text || {}) },
            ui: { ...defaultSettings.ui, ...(currentUser.settings.ui || {}) },
            messages: { ...defaultSettings.messages, ...(currentUser.settings.messages || {}) },
            notifications: {
                ...defaultSettings.notifications,
                ...(currentUser.settings.notifications || {}),
                quietHours: {
                    ...defaultSettings.notifications.quietHours,
                    ...(currentUser.settings.notifications?.quietHours || {})
                }
            }
        });
    }, [currentUser?.settings]);

    useEffect(() => {
        if (!currentUser?._id || activeSection !== 'stats') return;
        const load = async () => {
            setHistoryLoading(true);
            try {
                const data = (await Session.getStatsHistory(currentUser._id, historyDays)) as StatsHistoryResponse;
                setHistory(data?.daily || []);
                setByMode(data?.byMode || []);
                setByGame(data?.byGame || []);
            } catch {
                setHistory([]);
                setByMode([]);
                setByGame([]);
            } finally {
                setHistoryLoading(false);
            }
        };
        load();
    }, [currentUser?._id, activeSection, historyDays]);

    const isAdmin = !!(currentUser?.badges?.admin || currentUser?.badges?.owner || currentUser?.name === 'admin');

    const sections = useMemo(() => {
        const groupOne = {
            title: 'Compte & Sécurité',
            items: [
                { id: 'account', label: 'Compte' },
                { id: 'security', label: 'Sécurité' },
                { id: 'logs', label: 'Logs' },
                { id: 'friends', label: 'Amis' },
                { id: 'messages', label: 'Messages' },
                { id: 'premium', label: 'Premium' }
            ] as Array<{ id: SectionId; label: string }>
        };

        if (isAdmin) {
            groupOne.items.push({ id: 'admin', label: 'Administration' });
        }
        groupOne.items.push({ id: 'notifications', label: 'Notifications' });

        const groupTwo = {
            title: 'Statistiques & Graphiques',
            items: [{ id: 'stats', label: 'Statistiques' }] as Array<{ id: SectionId; label: string }>
        };

        const groupThree = {
            title: 'Interface & Texte',
            items: [{ id: 'interface', label: 'Interface & texte' }] as Array<{ id: SectionId; label: string }>
        };

        return [groupOne, groupTwo, groupThree];
    }, [isAdmin]);

    const handleNavigate = (id: SectionId) => {
        setActiveSection(id);
        navigateTo(`/settings/${id}`);
    };

    const updateSetting = (path: string, value: boolean | string) => {
        setSettings((prev) => {
            const next = { ...prev } as any;
            const parts = path.split('.');
            let cursor = next;
            for (let i = 0; i < parts.length - 1; i += 1) {
                const key = parts[i];
                cursor[key] = { ...cursor[key] };
                cursor = cursor[key];
            }
            cursor[parts[parts.length - 1]] = value;
            return next;
        });
        setSaveState('idle');
    };

    const saveSettings = async () => {
        setSaveState('saving');
        try {
            await updateUser({ settings });
            setSaveState('saved');
            setTimeout(() => setSaveState('idle'), 1500);
        } catch (err) {
            setSaveState('error');
        }
    };

    const ToggleRow = ({
        title,
        description,
        value,
        onToggle,
        disabled = false
    }: {
        title: string;
        description: string;
        value: boolean;
        onToggle: () => void;
        disabled?: boolean;
    }) => (
        <button
            type="button"
            onClick={disabled ? undefined : onToggle}
            className={`w-full text-left flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-700/60 bg-gray-900/40 transition ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/40'
            }`}
        >
            <div>
                <div className="text-sm font-semibold text-gray-100">{title}</div>
                <div className="text-xs text-gray-400 mt-1">{description}</div>
            </div>
            <div className={`w-12 h-6 rounded-full transition ${value ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <div
                    className={`w-5 h-5 bg-white rounded-full shadow translate-y-0.5 transition ${value
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                />
            </div>
        </button>
    );

    const SaveRow = () => (
        <div className="flex items-center justify-between mt-6">
            <button
                onClick={saveSettings}
                disabled={saveState === 'saving'}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
                {saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            {saveState === 'saved' && <span className="text-xs text-green-400">Enregistré</span>}
            {saveState === 'error' && <span className="text-xs text-red-400">Erreur de sauvegarde</span>}
        </div>
    );

    const renderStats = () => {
        const stats = currentUser?.stats;
        if (!stats) return <DashboardStats />;

        const barData = {
            labels: ['Parties', 'Victoires', 'Défaites'],
            datasets: [
                {
                    label: 'Totaux',
                    data: [stats.matchesPlayed, stats.victories, stats.losses],
                    backgroundColor: ['#38bdf8', '#22c55e', '#f43f5e']
                }
            ]
        };

        const winRate = stats.winRate || 0;
        const doughnutData = {
            labels: ['Victoire', 'Défaite'],
            datasets: [
                {
                    data: [winRate, Math.max(0, 100 - winRate)],
                    backgroundColor: ['#22c55e', '#334155'],
                    borderWidth: 0
                }
            ]
        };

        const historyLabels = history.map((row) => row.date.slice(5));
        const lineData = {
            labels: historyLabels,
            datasets: [
                {
                    label: 'Parties',
                    data: history.map((row) => row.matches),
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    tension: 0.35,
                    fill: true
                },
                {
                    label: 'Victoires',
                    data: history.map((row) => row.wins),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    tension: 0.35
                }
            ]
        };

        const modeLabels = byMode.map((row) => row._id);
        const modeData = {
            labels: modeLabels,
            datasets: [
                {
                    label: 'Parties',
                    data: byMode.map((row) => row.matches),
                    backgroundColor: '#38bdf8'
                },
                {
                    label: 'Victoires',
                    data: byMode.map((row) => row.wins),
                    backgroundColor: '#22c55e'
                },
                {
                    label: 'Défaites',
                    data: byMode.map((row) => row.losses),
                    backgroundColor: '#f43f5e'
                }
            ]
        };

        const gameLabels = byGame.map((row) => row._id);
        const gameData = {
            labels: gameLabels,
            datasets: [
                {
                    label: 'Parties',
                    data: byGame.map((row) => row.matches),
                    backgroundColor: '#a855f7'
                }
            ]
        };

        return (
            <div className="p-4 space-y-6">
                <h3 className="text-3xl font-extrabold text-blue-500 mb-2 text-center">Statistiques & Graphiques</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <h4 className="text-lg font-bold text-white mb-4">Synthèse</h4>
                        <Bar data={barData} />
                    </div>
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <h4 className="text-lg font-bold text-white mb-4">Taux de victoire</h4>
                        <Doughnut data={doughnutData} />
                        <p className="text-sm text-gray-400 mt-4 text-center">{winRate}% de victoires</p>
                    </div>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <h4 className="text-lg font-bold text-white">Historique des parties</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Période</span>
                            <select
                                value={historyDays}
                                onChange={(e) => setHistoryDays(Number(e.target.value))}
                                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                            >
                                <option value={7}>7 jours</option>
                                <option value={14}>14 jours</option>
                                <option value={30}>30 jours</option>
                                <option value={60}>60 jours</option>
                            </select>
                        </div>
                    </div>
                    {historyLoading ? (
                        <div className="text-xs text-gray-500">Chargement...</div>
                    ) : history.length === 0 ? (
                        <div className="text-xs text-gray-500">Aucune donnée pour cette période.</div>
                    ) : (
                        <Line data={lineData} />
                    )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <h4 className="text-lg font-bold text-white mb-4">Modes de jeu</h4>
                        {byMode.length === 0 ? (
                            <div className="text-xs text-gray-500">Aucune donnée.</div>
                        ) : (
                            <Bar data={modeData} />
                        )}
                    </div>
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <h4 className="text-lg font-bold text-white mb-4">Jeux joués</h4>
                        {byGame.length === 0 ? (
                            <div className="text-xs text-gray-500">Aucune donnée.</div>
                        ) : (
                            <Bar data={gameData} />
                        )}
                    </div>
                </div>
                <DashboardStats />
            </div>
        );
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'account':
                return <DashboardProfile />;
            case 'security':
                return (
                    <div className="p-4">
                        <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Sécurité</h3>
                        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700/50 p-6 space-y-4">
                            <p className="text-gray-300">A2F à venir. Vous pourrez activer la double authentification ici.</p>
                            <ToggleRow
                                title="Alertes de connexion"
                                description="Recevoir un email lors d'une nouvelle connexion."
                                value={settings.notifications.enabled}
                                onToggle={() => updateSetting('notifications.enabled', !settings.notifications.enabled)}
                            />
                            <SaveRow />
                        </div>
                    </div>
                );
            case 'logs':
                return <DashboardLogs />;
            case 'stats':
                return renderStats();
            case 'friends':
                return <DashboardFriends />;
            case 'messages':
                return (
                    <div className="p-4">
                        <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Messages</h3>
                        <div className="space-y-3">
                            <ToggleRow
                                title="Masquer le statut en ligne"
                                description="Rendre votre statut invisible pour les autres utilisateurs."
                                value={settings.messages.hideOnlineStatus}
                                onToggle={() => updateSetting('messages.hideOnlineStatus', !settings.messages.hideOnlineStatus)}
                            />
                            <ToggleRow
                                title="Filtrer les messages"
                                description="Bloque automatiquement les messages de non-amis."
                                value={settings.messages.muteNonFriends}
                                onToggle={() => updateSetting('messages.muteNonFriends', !settings.messages.muteNonFriends)}
                            />
                            <ToggleRow
                                title="Notifications directes"
                                description="Affiche les notifications pour les nouveaux messages."
                                value={settings.notifications.messages}
                                onToggle={() => updateSetting('notifications.messages', !settings.notifications.messages)}
                            />
                            <SaveRow />
                        </div>
                    </div>
                );
            case 'premium':
                return (
                    <div className="p-4">
                        <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Premium</h3>
                        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700/50 p-6 flex flex-col gap-4">
                            <p className="text-gray-300">Gérez votre abonnement et comparez les offres.</p>
                            <button
                                onClick={() => navigateTo('/premium')}
                                className="self-start px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                            >
                                Voir Premium
                            </button>
                        </div>
                    </div>
                );
            case 'admin':
                return (
                    <div className="p-4">
                        <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Administration</h3>
                        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700/50 p-6 flex flex-col gap-4">
                            <p className="text-gray-300">Accès aux outils d'administration.</p>
                            <button
                                onClick={() => navigateTo('/admin')}
                                className="self-start px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                            >
                                Ouvrir l'administration
                            </button>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="p-4">
                        <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Notifications</h3>
                        <div className="space-y-3">
                            <ToggleRow
                                title="Activer les notifications"
                                description="Active toutes les notifications de la plateforme."
                                value={settings.notifications.enabled}
                                onToggle={() => updateSetting('notifications.enabled', !settings.notifications.enabled)}
                            />
                            <ToggleRow
                                title="Notifications in-app"
                                description="Affiche les notifications dans l'application."
                                value={settings.notifications.inApp}
                                onToggle={() => updateSetting('notifications.inApp', !settings.notifications.inApp)}
                            />
                            <ToggleRow
                                title="Notifications email"
                                description="Recevoir les alertes importantes par email."
                                value={settings.notifications.email}
                                onToggle={() => updateSetting('notifications.email', !settings.notifications.email)}
                            />
                            <ToggleRow
                                title="Notifications push"
                                description="Alertes push sur vos appareils connectés."
                                value={settings.notifications.push}
                                onToggle={() => updateSetting('notifications.push', !settings.notifications.push)}
                            />
                            <ToggleRow
                                title="Messages privés"
                                description="Notifications lors d'un nouveau message privé."
                                value={settings.notifications.messages}
                                onToggle={() => updateSetting('notifications.messages', !settings.notifications.messages)}
                            />
                            <ToggleRow
                                title="Demandes d'amis"
                                description="Notifications lorsqu'une demande d'ami arrive."
                                value={settings.notifications.friendRequests}
                                onToggle={() => updateSetting('notifications.friendRequests', !settings.notifications.friendRequests)}
                            />
                            <ToggleRow
                                title="Invitations de partie"
                                description="Notifications pour rejoindre une partie en cours."
                                value={settings.notifications.gameInvites}
                                onToggle={() => updateSetting('notifications.gameInvites', !settings.notifications.gameInvites)}
                            />
                            <ToggleRow
                                title="Résumé hebdomadaire"
                                description="Recevoir un résumé hebdomadaire de l'activité."
                                value={settings.notifications.digest}
                                onToggle={() => updateSetting('notifications.digest', !settings.notifications.digest)}
                            />
                            <ToggleRow
                                title="Communication produit"
                                description="Recevoir des annonces et mises à jour produit."
                                value={settings.notifications.marketing}
                                onToggle={() => updateSetting('notifications.marketing', !settings.notifications.marketing)}
                            />
                            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                                <div className="text-sm font-semibold text-gray-100">Silence programmé</div>
                                <ToggleRow
                                    title="Activer le mode silencieux"
                                    description="Coupe les notifications durant une plage horaire."
                                    value={settings.notifications.quietHours.enabled}
                                    onToggle={() => updateSetting('notifications.quietHours.enabled', !settings.notifications.quietHours.enabled)}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <label className="text-xs text-gray-400">
                                        Début
                                        <input
                                            type="time"
                                            value={settings.notifications.quietHours.start}
                                            onChange={(e) => updateSetting('notifications.quietHours.start', e.target.value)}
                                            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                                        />
                                    </label>
                                    <label className="text-xs text-gray-400">
                                        Fin
                                        <input
                                            type="time"
                                            value={settings.notifications.quietHours.end}
                                            onChange={(e) => updateSetting('notifications.quietHours.end', e.target.value)}
                                            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                                        />
                                    </label>
                                </div>
                            </div>
                            <SaveRow />
                        </div>
                    </div>
                );
            case 'interface':
                return (
                    <div className="p-4">
                        <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Interface & texte</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-3">
                                <h4 className="text-lg font-bold text-white">Texte</h4>
                                <ToggleRow
                                    title="Ponctuation automatique"
                                    description="Ajoute automatiquement la ponctuation dans vos messages."
                                    value={settings.text.autoPunctuation}
                                    onToggle={() => updateSetting('text.autoPunctuation', !settings.text.autoPunctuation)}
                                />
                                <ToggleRow
                                    title="Mentions intelligentes"
                                    description="Suggère automatiquement des mentions lors de l'écriture."
                                    value={settings.text.smartMentions}
                                    onToggle={() => updateSetting('text.smartMentions', !settings.text.smartMentions)}
                                />
                                <ToggleRow
                                    title="Afficher les horodatages"
                                    description="Affiche l'heure pour chaque message dans les discussions."
                                    value={settings.text.showTimestamps}
                                    onToggle={() => updateSetting('text.showTimestamps', !settings.text.showTimestamps)}
                                />
                                <ToggleRow
                                    title="Mode compact"
                                    description="Réduit l'espacement dans les listes et conversations."
                                    value={settings.text.compactMode}
                                    onToggle={() => updateSetting('text.compactMode', !settings.text.compactMode)}
                                />
                            </div>
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-3">
                                <h4 className="text-lg font-bold text-white">Interface</h4>
                                <ToggleRow
                                    title="Contraste renforcé"
                                    description="Améliore la lisibilité des couleurs dans l'interface."
                                    value={settings.ui.highContrast}
                                    onToggle={() => updateSetting('ui.highContrast', !settings.ui.highContrast)}
                                />
                                <ToggleRow
                                    title="Réduire les animations"
                                    description="Diminue les effets de transition et animations."
                                    value={settings.ui.reduceMotion}
                                    onToggle={() => updateSetting('ui.reduceMotion', !settings.ui.reduceMotion)}
                                />
                                <ToggleRow
                                    title="Texte agrandi"
                                    description="Augmente la taille du texte pour une meilleure lisibilité."
                                    value={settings.ui.largeText}
                                    onToggle={() => updateSetting('ui.largeText', !settings.ui.largeText)}
                                />
                            </div>
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-3">
                                <h4 className="text-lg font-bold text-white">Vocaux (bientôt)</h4>
                                <ToggleRow
                                    title="Saisie vocale"
                                    description="Dicter vos messages à la voix."
                                    value={false}
                                    onToggle={() => {}}
                                    disabled
                                />
                                <ToggleRow
                                    title="Lecture automatique"
                                    description="Lecture des messages entrants."
                                    value={false}
                                    onToggle={() => {}}
                                    disabled
                                />
                                <ToggleRow
                                    title="Réduction du bruit"
                                    description="Nettoyage audio en temps réel."
                                    value={false}
                                    onToggle={() => {}}
                                    disabled
                                />
                            </div>
                        </div>
                        <SaveRow />
                    </div>
                );
            default:
                return <DashboardProfile />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-950 text-white font-inter">
            <DashboardHeader navigateTo={navigateTo} />
            <div className="flex flex-1">
                <aside
                    className="hidden md:flex w-72 p-6 bg-gray-900 rounded-tr-xl shadow-2xl border-r border-gray-700/50 flex-col"
                    style={{
                        background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
                        boxShadow: '10px 0 30px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.05)'
                    }}
                >
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white">Paramètres</h2>
                        <p className="text-xs text-gray-400">Tout votre espace en un seul endroit.</p>
                    </div>
                    <nav className="space-y-6">
                        {currentUser?.name && (
                            <button
                                onClick={() => navigateTo(`/user/${currentUser.name}`)}
                                className="w-full flex items-center p-3 rounded-lg text-base font-medium transition-colors duration-300 text-gray-300 hover:bg-gray-800 hover:text-blue-400"
                            >
                                <span className="ml-2">Mon profil</span>
                            </button>
                        )}
                        {sections.map((group) => (
                            <div key={group.title}>
                                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                                    {group.title}
                                </div>
                                <div className="space-y-2">
                                    {group.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNavigate(item.id)}
                                            className={`w-full flex items-center p-3 rounded-lg text-base font-medium transition-colors duration-300 ${
                                                activeSection === item.id
                                                    ? 'bg-blue-800 text-white shadow-lg'
                                                    : 'text-gray-300 hover:bg-gray-800 hover:text-blue-400'
                                            }`}
                                        >
                                            <span className="ml-2">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 p-6 md:p-8 overflow-auto">
                    <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 p-6 md:p-8">
                        {renderContent()}
                    </div>
                </main>
            </div>
            <Footer navigateTo={navigateTo} />
        </div>
    );
};

export default Settings;






