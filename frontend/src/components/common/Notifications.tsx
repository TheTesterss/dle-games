import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FriendRequestSession from '../../utils/FriendRequestSession';
import { AuthContextType } from '../../contexts/authContext';

interface NotificationsProps {
    navigateTo: (path: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ navigateTo }) => {
    const { notifications, removeNotification, currentUser, activeGameRoom } = useAuth() as AuthContextType;
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        notifications.forEach((notif) => {
            if (!notif.duration) return;
            const timer = setTimeout(() => removeNotification(notif.id), notif.duration);
            return () => clearTimeout(timer);
        });
    }, [notifications, removeNotification]);

    useEffect(() => {
        const hasTimer = !!activeGameRoom?.startedAt && !!activeGameRoom?.durationSec;
        if (!hasTimer) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [activeGameRoom?.startedAt, activeGameRoom?.durationSec]);

    const resumeInfo = useMemo(() => {
        if (!activeGameRoom?.code) return null;
        const startedAt = Number(activeGameRoom.startedAt || 0);
        const durationSec = Number(activeGameRoom.durationSec || 0);
        if (!startedAt || !durationSec) {
            return {
                hasDuration: false,
                remainingMs: null,
                remainingLabel: null,
                percentLeft: null
            };
        }
        const totalMs = durationSec * 1000;
        const remainingMs = Math.max(0, startedAt + totalMs - now);
        const percentLeft = totalMs ? Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)) : 0;
        const format = (ms: number) => {
            const totalSeconds = Math.ceil(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
            return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
        };
        return {
            hasDuration: true,
            remainingMs,
            remainingLabel: format(remainingMs),
            percentLeft
        };
    }, [activeGameRoom?.code, activeGameRoom?.startedAt, activeGameRoom?.durationSec, now]);

    const handleAccept = async (notif: any) => {
        if (notif.type === 'friend_request') {
            await FriendRequestSession.accept(notif.data.reqId);
            removeNotification(notif.id);
            return;
        }
        if (notif.type === 'game_invite') {
            localStorage.setItem('pokemonInviteCode', notif.data.code);
            navigateTo('/pokemon');
            removeNotification(notif.id);
        }
    };

    const handleDecline = async (notif: any) => {
        if (notif.type === 'friend_request') {
            await FriendRequestSession.deny(notif.data.reqId);
        }
        removeNotification(notif.id);
    };

    const handleResume = () => {
        if (!activeGameRoom?.code) return;
        localStorage.setItem('pokemonInviteCode', activeGameRoom.code);
        navigateTo('/pokemon');
    };

    if (!currentUser) return null;

    const notifSettings = currentUser.settings?.notifications;
    if (notifSettings && (!notifSettings.enabled || notifSettings.inApp === false)) return null;

    if (notifSettings?.quietHours?.enabled) {
        const [startH, startM] = (notifSettings.quietHours.start || '00:00').split(':').map(Number);
        const [endH, endM] = (notifSettings.quietHours.end || '00:00').split(':').map(Number);
        const nowTime = new Date();
        const currentMinutes = nowTime.getHours() * 60 + nowTime.getMinutes();
        const startMinutes = (startH || 0) * 60 + (startM || 0);
        const endMinutes = (endH || 0) * 60 + (endM || 0);
        const inQuiet = startMinutes <= endMinutes
            ? currentMinutes >= startMinutes && currentMinutes < endMinutes
            : currentMinutes >= startMinutes || currentMinutes < endMinutes;
        if (inQuiet) return null;
    }

    const ordered = [...notifications].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-[320px]">
            {activeGameRoom?.code && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">Reprendre la partie</h4>
                        <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-1 rounded-full">
                            {activeGameRoom.code}
                        </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">
                        Partie en cours. {resumeInfo?.hasDuration && resumeInfo?.remainingLabel
                            ? `Temps restant : ${resumeInfo.remainingLabel}.`
                            : 'Durée illimitée.'}
                    </p>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleResume}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                        >
                            Rejoindre
                        </button>
                    </div>
                    {resumeInfo?.hasDuration && typeof resumeInfo?.percentLeft === 'number' && (
                        <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{ width: `${resumeInfo.percentLeft}%` }}
                            />
                        </div>
                    )}
                </div>
            )}
            {ordered.map((notif) => (
                <div key={notif.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">{notif.title}</h4>
                        <button
                            className="text-gray-500 hover:text-gray-300"
                            onClick={() => removeNotification(notif.id)}
                        >
                            x
                        </button>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">{notif.message}</p>
                    {(notif.type === 'friend_request' || notif.type === 'game_invite') && (
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => handleAccept(notif)}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                            >
                                Accepter
                            </button>
                            <button
                                onClick={() => handleDecline(notif)}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-gray-700 text-white text-xs font-semibold hover:bg-gray-600"
                            >
                                Refuser
                            </button>
                        </div>
                    )}
                    {(notif.type === 'pm_message' || notif.type === 'pm_mention') && (
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => {
                                    if (notif.data?.conversationId) {
                                        localStorage.setItem(
                                            'pm_open_conv',
                                            JSON.stringify({
                                                conversationId: notif.data.conversationId,
                                                messageId: notif.data.messageId
                                            })
                                        );
                                        window.dispatchEvent(
                                            new CustomEvent('pm_open_conv', {
                                                detail: {
                                                    conversationId: notif.data.conversationId,
                                                    messageId: notif.data.messageId
                                                }
                                            })
                                        );
                                    }
                                    navigateTo('/chat');
                                    removeNotification(notif.id);
                                }}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                            >
                                Ouvrir
                            </button>
                        </div>
                    )}
                    {notif.duration && (
                        <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{
                                    animation: `notif-${notif.id} ${notif.duration}ms linear forwards`
                                }}
                            />
                            <style>{`
                                @keyframes notif-${notif.id} {
                                    from { width: 100%; }
                                    to { width: 0%; }
                                }
                            `}</style>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Notifications;
