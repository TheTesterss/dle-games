import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Session from '../../utils/Session';

const actionLabels: Record<string, string> = {
    PREMIUM_GIFT_CREATED: 'Lien premium généré',
    PREMIUM_GIFT_CLAIMED: 'Lien premium utilisé',
    PREMIUM_GIFT_REDEEMED: 'Lien premium activé par un utilisateur',
    GAME_END: 'Fin de partie'
};

type LogEntry = {
    _id: string;
    action: string;
    details?: any;
    createdAt: string;
    level?: 'info' | 'warning' | 'error';
};

const DashboardLogs: React.FC = () => {
    const { currentUser } = useAuth();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadLogs = async () => {
            if (!currentUser?._id) return;
            setLoading(true);
            setError(null);
            try {
                const data = await Session.getLogs(currentUser._id);
                setLogs(Array.isArray(data) ? (data as LogEntry[]) : []);
            } catch (err) {
                setError('Impossible de charger les logs.');
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };
        loadLogs();
    }, [currentUser?._id]);

    const rows = useMemo(() => {
        return logs.map((log) => {
            const label = actionLabels[log.action] || log.action;
            const details = log.details ? JSON.stringify(log.details) : '-';
            return { ...log, label, details };
        });
    }, [logs]);

    return (
        <div className="p-4">
            <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Historique de vos activités</h3>

            <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700/50 p-6">
                {loading && <p className="text-gray-400">Chargement...</p>}
                {error && <p className="text-red-400">{error}</p>}
                {!loading && !error && rows.length === 0 && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-lg">Aucune activité enregistrée pour le moment.</p>
                        <p className="text-gray-500 text-sm">Vos futures parties et interactions apparaîtront ici.</p>
                    </div>
                )}

                {!loading && !error && rows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Action</th>
                                    <th className="px-4 py-2">Détails</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {rows.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-900/50 transition-colors">
                                        <td className="px-4 py-2 text-sm text-gray-400">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 font-semibold text-blue-300">{log.label}</td>
                                        <td className="px-4 py-2 text-xs font-mono text-gray-400 break-all">
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardLogs;
