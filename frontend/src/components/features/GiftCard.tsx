import React, { useEffect, useState } from 'react';
import { baseURL } from '../../utils/d';

type GiftStatus = 'loading' | 'active' | 'claimed' | 'expired' | 'invalid';

type GiftCardProps = {
    code: string;
    currentUserId?: string;
};

const GiftCard: React.FC<GiftCardProps> = ({ code, currentUserId }) => {
    const [status, setStatus] = useState<GiftStatus>('loading');
    const [tier, setTier] = useState<'games_one' | 'games_plus' | null>(null);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const label = tier === 'games_plus' ? 'Games Plus' : 'Games One';

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${baseURL}/premium/gifts/${code}`, { credentials: 'include' });
            if (!res.ok) {
                setStatus('invalid');
                return;
            }
            const data = await res.json();
            setTier(data?.gift?.tier || null);
            setStatus(data?.status || 'invalid');
        } catch {
            setStatus('invalid');
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [code]);

    const handleClaim = async () => {
        if (!currentUserId || busy || status !== 'active') return;
        setBusy(true);
        setMessage('');
        try {
            const res = await fetch(`${baseURL}/premium/gifts/${code}/claim`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.status === 'claimed') {
                setStatus('claimed');
                setMessage('Cadeau active avec succes.');
            } else {
                const st = data?.status || 'claimed';
                setStatus(st);
                setMessage(st === 'claimed' ? 'Trop tard, cadeau deja reclame.' : 'Cadeau indisponible.');
            }
        } catch {
            setMessage('Erreur lors de la reclamation.');
        } finally {
            setBusy(false);
        }
    };

    const statusLabel = {
        active: 'Cadeau premium disponible',
        claimed: 'Cadeau deja reclame',
        expired: 'Cadeau expire',
        invalid: 'Cadeau invalide',
        loading: 'Chargement...'
    }[status];

    const tone =
        status === 'active'
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : status === 'claimed'
              ? 'border-gray-600/40 bg-gray-800/40'
              : status === 'expired'
                ? 'border-amber-500/40 bg-amber-500/10'
                : 'border-red-500/40 bg-red-500/10';

    return (
        <div className={`mt-3 rounded-3xl border ${tone} p-0 overflow-hidden shadow-2xl`}>
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-4 flex items-center justify-between">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.35em] text-gray-400">Cadeau Premium</div>
                    <div className="text-xl font-black text-white mt-1">
                        {tier ? label : 'Offre Premium'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{statusLabel}</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 blur-sm opacity-70" />
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4 bg-black/40">
                <div className="text-xs text-gray-300">
                    Lien cadeau {tier ? `• ${label}` : ''} • {status}
                </div>
                {status === 'active' ? (
                    <button
                        onClick={handleClaim}
                        disabled={busy || !currentUserId}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition disabled:opacity-50"
                    >
                        {busy ? '...' : 'Accepter'}
                    </button>
                ) : (
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-gray-800 text-gray-300">
                        {status === 'claimed' ? 'Reclame' : status === 'expired' ? 'Expire' : status === 'invalid' ? 'Invalide' : '...'}
                    </span>
                )}
            </div>
            {message && <div className="px-5 pb-4 text-xs text-gray-200">{message}</div>}
        </div>
    );
};

export const extractGiftCodes = (text: string): string[] => {
    if (!text) return [];
    const pattern = new RegExp('(?:gift/:|/gift/|gift:)([A-Z0-9]{6,32})', 'gi');
    const matches = text.match(pattern) || [];
    return matches
        .map((m) => m.replace(/^(gift\/:|\/gift\/|gift:)/i, ''))
        .map((m) => m.toUpperCase());
};

export default GiftCard;
