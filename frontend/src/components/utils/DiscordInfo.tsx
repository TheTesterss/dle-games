import React, { useEffect, useState } from 'react';
import { baseURL } from '../../utils/d';

const DiscordInfo: React.FC = () => {
    const [info, setInfo] = useState<any>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const res = await fetch(`${baseURL}/discord/summary`, { credentials: 'include', mode: 'cors' });
                if (!res.ok) throw new Error('Impossible de récupérer Discord');
                const data = await res.json();
                setInfo(data);
            } catch (err: any) {
                setError(err.message);
            }
        };
        fetchInfo();
    }, []);

    if (error) {
        return <div className="text-sm text-red-400">{error}</div>;
    }

    if (!info) return <div className="text-sm text-gray-400">Chargement du serveur Discord...</div>;

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col md:flex-row gap-6 items-center">
            <img
                src={info.iconUrl || 'https://placehold.co/100x100/1f2937/ffffff?text=D'}
                alt={info.name}
                className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1">
                <h4 className="text-xl font-bold text-white">{info.name}</h4>
                {info.description && <p className="text-gray-300 mt-2">{info.description}</p>}
                <div className="mt-4 text-sm text-gray-300 space-y-1">
                    <p>
                        <strong className="text-blue-300">Communauté active :</strong> {info.memberCount ?? 'N/A'}{' '}
                        membres inscrits.
                    </p>
                    <p>
                        <strong className="text-green-300">En direct :</strong> {info.onlineCount ?? 'N/A'} connectés et
                        disponibles.
                    </p>
                </div>
            </div>
            {info.invite && (
                <a
                    href={info.invite}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                    Rejoindre Discord
                </a>
            )}
        </div>
    );
};

export default DiscordInfo;
