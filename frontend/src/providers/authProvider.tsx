import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext, AuthContextType } from '../contexts/authContext';
import Session from '../utils/Session';
import FriendRequestSession from '../utils/FriendRequestSession';
import FriendsSession from '../utils/FriendsSession';
import { baseURL } from '../utils/d';
import { disableRealtime, isRealtimeDisabled, isSocketEndpointMissing } from '../utils/realtime';
import { Account } from '../types';

interface AuthProviderProps {
    children: React.ReactNode;
    navigateTo?: (path: string) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, navigateTo }) => {
    const [currentUser, setCurrentUser] = useState<Account | null>(Session.get());
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!Session.get());
    const [currentUserFriendRequests, setCurrentUserFriendRequests] = useState<any[]>([]);
    const [currentUserFriends, setCurrentUserFriends] = useState<Account[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const [activeGameRoom, setActiveGameRoom] = useState<any>(null);
    const [serverError, setServerError] = useState<boolean>(false);
    const notificationsKey = currentUser?._id ? `dle_notifications_${currentUser._id}` : null;
    const setActiveGameRoomPersist = (room: any) => {
        setActiveGameRoom(room);
        if (!currentUser?._id) return;
        const key = `dle_active_game_${currentUser._id}`;
        if (room) localStorage.setItem(key, JSON.stringify(room));
        else localStorage.removeItem(key);
    };


    useEffect(() => {
        setCurrentUser(Session.get());
        setIsAuthenticated(!!Session.get());
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            Session.clearExpired();
            const session = Session.get();
            setCurrentUser(session);
            setIsAuthenticated(!!session);
        }, 360_000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (currentUser && currentUser._id) {
            fetchFriends(currentUser._id).catch(() => setServerError(true));
            fetchFriendRequests(currentUser._id).catch(() => setServerError(true));
        } else {
            setCurrentUserFriends([]);
            setCurrentUserFriendRequests([]);
        }
    }, [currentUser?._id]);
    useEffect(() => {
        if (!currentUser?._id || isRealtimeDisabled()) {
            setActiveGameRoomPersist(null);
            return;
        }
        const key = `dle_active_game_${currentUser._id}`;
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                setActiveGameRoomPersist(JSON.parse(raw));
            } catch {
                localStorage.removeItem(key);
            }
        }
    }, [currentUser?._id]);

    useEffect(() => {
        if (!currentUser?._id || !notificationsKey) {
            setNotifications([]);
            return;
        }
        const raw = localStorage.getItem(notificationsKey);
        if (!raw) {
            setNotifications([]);
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            const now = Date.now();
            const cleaned = Array.isArray(parsed)
                ? parsed.filter((n: any) => !n?.duration || !n?.createdAt || now - n.createdAt <= n.duration)
                : [];
            setNotifications(cleaned);
        } catch {
            localStorage.removeItem(notificationsKey);
            setNotifications([]);
        }
    }, [currentUser?._id]);

    useEffect(() => {
        if (!notificationsKey) return;
        const trimmed = (notifications || []).slice(-200);
        localStorage.setItem(notificationsKey, JSON.stringify(trimmed));
    }, [notifications, notificationsKey]);

    const prevOnlineUsers = useRef<string[]>([]);

    useEffect(() => {
        if (!currentUser?._id || isRealtimeDisabled()) {
            setOnlineUsers([]);
            prevOnlineUsers.current = [];
            return undefined;
        }
        const socket = io(baseURL.replace('/api', ''), {
            path: '/socket.io',
            transports: ['polling'],
            auth: { userId: currentUser._id },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 800,
            reconnectionDelayMax: 2500,
            forceNew: true
        });
        socketRef.current = socket;
        socket.on('connect_error', (err: any) => {
            if (isSocketEndpointMissing(err)) {
                disableRealtime();
                socket.io.opts.reconnection = false;
                socket.disconnect();
            }
        });

        const lastSeenKey = `dle_last_seen_${currentUser._id}`;
        const getLastSeen = () => Number(localStorage.getItem(lastSeenKey) || 0);
        const markSeen = () => localStorage.setItem(lastSeenKey, String(Date.now()));

        socket.on('pm:message', (msg: any) => {
            if (!msg || msg.sender?._id === currentUser._id) return;
            const mentionToken = `<@${currentUser._id}>`;
            if (msg.content?.includes(mentionToken)) {
                pushNotification({
                    type: 'pm_mention',
                    title: 'Mention',
                    message: `${msg.sender?.name || 'Quelqu\'un'} vous a mentionné.`,
                    data: { conversationId: msg.conversation, messageId: msg._id }
                });
            } else {
                pushNotification({
                    type: 'pm_message',
                    title: 'Nouveau message',
                    message: `${msg.sender?.name || 'Quelqu\'un'} vous a envoyé un message.`,
                    data: { conversationId: msg.conversation }
                });
            }
        });

        socket.on('pokemon:active_games', (rooms: any[]) => {
            if (rooms && rooms.length > 0) {
                const room = rooms[0];
                setActiveGameRoomPersist({
                    code: room.code,
                    mode: room.mode,
                    started: room.started,
                    startedAt: room.startedAt || null,
                    durationSec: room.durationSec || null
                });
            } else {
                setActiveGameRoomPersist(null);
            }
        });

        socket.on('pokemon:summary', () => {
            setActiveGameRoomPersist(null);
        });
        socket.on('pokemon:ended', () => {
            setActiveGameRoomPersist(null);
        });

        socket.on('connect', () => {
            const lastSeen = getLastSeen();
            socket.emit('pm:list', { limit: 50, page: 0 }, (res: { ok: boolean; conversations: any[] }) => {
                if (!res?.ok) return;
                (res.conversations || []).forEach((conv) => {
                    const last = conv.lastMessage;
                    if (!last || !last.createdAt) return;
                    const ts = new Date(last.createdAt).getTime();
                    if (ts <= lastSeen) return;
                    if (last.sender?._id === currentUser._id) return;
                    const mentionToken = `<@${currentUser._id}>`;
                    if (last.content?.includes(mentionToken)) {
                        pushNotification({
                            type: 'pm_mention',
                            title: 'Mention',
                            message: `${last.sender?.name || 'Quelqu\'un'} vous a mentionné.`,
                            data: { conversationId: conv._id, messageId: last._id }
                        });
                    } else {
                        pushNotification({
                            type: 'pm_message',
                            title: 'Nouveau message',
                            message: `${last.sender?.name || 'Quelqu\'un'} vous a envoyé un message.`,
                            data: { conversationId: conv._id }
                        });
                    }
                });
                markSeen();
            });
        });
        socket.on('presence:online', (list: string[]) => {
            const newList = list || [];
            if (currentUserFriends.length > 0 && prevOnlineUsers.current.length > 0) {
                const newlyOnline = newList.filter(
                    (id) => !prevOnlineUsers.current.includes(id) && id !== currentUser._id
                );
                newlyOnline.forEach((id) => {
                    const friend = currentUserFriends.find((f: any) => (f._id || f).toString() === id.toString());
                    if (friend) {
                        pushNotification({
                            type: 'friend_online',
                            title: 'Ami en ligne',
                            message: `${friend.name} est maintenant en ligne.`,
                            duration: 4000
                        });
                    }
                });
            }
            setOnlineUsers(newList);
            prevOnlineUsers.current = newList;
        });
        socket.on('pokemon:invite', (payload: any) => {
            pushNotification({
                type: 'game_invite',
                title: 'Invitation de jeu',
                message: `${payload.fromName} vous invite dans une salle Pokémon.`,
                data: payload,
                duration: 15000
            });
        });
        return () => {
            socket.disconnect();
        };
    }, [currentUser?._id, currentUserFriends]);
    useEffect(() => {
        if (!currentUser?._id) return;
        const key = `dle_last_seen_${currentUser._id}`;
        const mark = () => localStorage.setItem(key, String(Date.now()));
        const handleVis = () => {
            if (document.visibilityState === 'hidden') mark();
        };
        window.addEventListener('beforeunload', mark);
        document.addEventListener('visibilitychange', handleVis);
        return () => {
            window.removeEventListener('beforeunload', mark);
            document.removeEventListener('visibilitychange', handleVis);
        };
    }, [currentUser?._id]);

    const shouldNotify = (payload: any): boolean => {
        const settings = currentUser?.settings?.notifications;
        if (!settings) return true;
        if (settings.enabled === false) return false;
        if (settings.inApp === false) return false;
        switch (payload?.type) {
            case 'pm_message':
            case 'pm_mention':
                return settings.messages !== false;
            case 'friend_request':
                return settings.friendRequests !== false;
            case 'game_invite':
                return settings.gameInvites !== false;
            default:
                return true;
        }
    };

    const pushNotification = (payload: any): string => {
        if (!shouldNotify(payload)) return '';
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setNotifications((prev) => [...prev, { id, seen: false, createdAt: Date.now(), ...payload }]);
        return id;
    };

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const markNotificationsSeen = (filter?: (n: any) => boolean) => {
        setNotifications((prev) =>
            prev.map((n) => (filter && !filter(n) ? n : { ...n, seen: true }))
        );
    };

    const sendGameInvite = (targetUserId: string, payload: any = {}) => {
        if (!socketRef.current || !currentUser?._id) return;
        socketRef.current.emit('pokemon:invite', {
            toUserId: targetUserId,
            fromId: currentUser._id,
            fromName: currentUser.name,
            code: payload.code || null,
            mode: payload.mode || null
        });
    };
    useEffect(() => {
        if (!currentUser?._id) return undefined;
        let cancelled = false;
        const known = new Set<string>();

        const poll = async () => {
            try {
                const reqIds = await FriendsSession.getRequests(currentUser._id);
                for (const reqId of reqIds) {
                    if (known.has(reqId)) continue;
                    known.add(reqId);
                    const req = await FriendRequestSession.get(reqId) as any;
                    const user = await Session.getUserById(req.from, currentUser._id);
                    if (cancelled) return;
                    if (user) {
                        pushNotification({
                            type: 'friend_request',
                            title: "Demande d'ami",
                            message: `${user.name} vous a envoyé une demande.`,
                            data: { reqId, from: user },
                            duration: 20000
                        });
                    }
                }
            } catch (err) {
            }
        };

        poll();
        const interval = setInterval(poll, 15000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [currentUser?._id]);

    const fetchFriendRequests = async (userId: string) => {
        const requests = await FriendsSession.getRequests(userId);
        setCurrentUserFriendRequests(requests);
        return requests;
    };

    const fetchFriends = async (userId: string) => {
        const list = await FriendsSession.getAll(userId);
        setCurrentUserFriends(list);
        return list;
    };

    const sendFriendRequest = async (from: string, to: string) => {
        return await FriendRequestSession.send(from, to);
    };

    const acceptFriendRequest = async (reqId: string) => {
        return await FriendRequestSession.accept(reqId);
    };

    const cancelFriendRequest = async (reqId: string) => {
        return await FriendRequestSession.cancel(reqId);
    };

    const denyFriendRequest = async (reqId: string) => {
        return await FriendRequestSession.deny(reqId);
    };

    const removeFriend = async (userId: string, targetId: string) => {
        return await FriendsSession.remove(userId, targetId);
    };

    const getUser = async (name: string) => {
        return await Session.getUser(name, currentUser?._id);
    };

    const getUsers = async () => {
        return await Session.getUsers();
    };

    const login = async (username: string, password: string) => {
        try {
            const user = await Session.login(username, password);
            setCurrentUser(user);
            setIsAuthenticated(true);
            setServerError(false);
            if (navigateTo) navigateTo('/settings/account');
            return user;
        } catch (err: any) {
            if (err.message?.includes('Failed to fetch') || err.message?.includes('500')) {
                setServerError(true);
            }
            throw err;
        }
    };

    const signup = async (username: string, email: string, password: string) => {
        const user = await Session.signup(username, email, password);
        setCurrentUser(user);
        setIsAuthenticated(true);
        if (navigateTo) navigateTo('/settings/account');
        return user;
    };

    const logout = async () => {
        Session.logout();
        setCurrentUser(null);
        setIsAuthenticated(false);
        if (navigateTo) navigateTo('/login');
    };

    const updateUser = async (userData: Partial<Account>) => {
        const updatedUser = await Session.updateUser(userData);
        setCurrentUser(updatedUser);
        return updatedUser;
    };

    const getUserById = async (id: string) => {
        return await Session.getUserById(id, currentUser?._id);
    };

    const contextValue: AuthContextType = {
        currentUser,
        isAuthenticated,
        login,
        signup,
        getUser,
        logout,
        getUsers,
        updateUser,
        removeFriend,
        denyFriendRequest,
        cancelFriendRequest,
        acceptFriendRequest,
        sendFriendRequest,
        fetchFriendRequests,
        fetchFriends,
        currentUserFriends,
        currentUserFriendRequests,
        onlineUsers,
        notifications,
        pushNotification,
        removeNotification,
        markNotificationsSeen,
        sendGameInvite,
        serverError,
        activeGameRoom,
        setActiveGameRoom: setActiveGameRoomPersist
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};





