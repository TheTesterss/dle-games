import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { baseURL } from '../../utils/d';
import { disableRealtime, isRealtimeDisabled, isSocketEndpointMissing } from '../../utils/realtime';
import FriendsSession from '../../utils/FriendsSession';
import {
    FaPaperPlane,
    FaSearch,
    FaThumbtack,
    FaTrash,
    FaImage,
    FaVideo,
    FaBan,
    FaArrowLeft,
    FaTimes,
    FaReply,
    FaEdit,
    FaUserPlus,
    FaEnvelope,
    FaUser,
    FaAt,
    FaIdCard,
    FaUserShield,
    FaSmile
} from 'react-icons/fa';
import ContextMenu from '../common/ContextMenu';
import MentionText from '../utils/MentionText';
import GiftCard, { extractGiftCodes } from '../features/GiftCard';
import EmojiPicker from '../utils/EmojiPicker';
import { Message, Conversation, Account } from '../../types';
import { AuthContextType } from '../../contexts/authContext';

interface PrivateChatProps {
    navigateTo: (path: string) => void;
    name?: string;
}

const PrivateChat: React.FC<PrivateChatProps> = ({ navigateTo, name: directName }) => {
    const { currentUser, onlineUsers } = useAuth() as AuthContextType;
    const [socket, setSocket] = useState<Socket | null>(null);
    const [view, setView] = useState<'inbox' | 'chat'>(directName ? 'chat' : 'inbox');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConvId, setCurrentConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [editingMsg, setEditingMsg] = useState<Message | null>(null);
    const [editInput, setEditInput] = useState('');
    const [contextMenu, setContextMenu] = useState<any | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showNewConv, setShowNewConv] = useState(false);
    const [newConvTarget, setNewConvTarget] = useState('');
    const [newConvError, setNewConvError] = useState('');
    const [directError, setDirectError] = useState('');
    const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
    const [highlightMsgId, setHighlightMsgId] = useState<string | null>(null);
    const [jumpNotFound, setJumpNotFound] = useState<string | null>(null);
    const [pulseMsgIds, setPulseMsgIds] = useState<Record<string, number>>({});
    const [friends, setFriends] = useState<Account[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [selectedTargets, setSelectedTargets] = useState<Account[]>([]);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const chatAreaRef = useRef<HTMLDivElement>(null);
    const currentConvIdRef = useRef<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const editEmojiPickerRef = useRef<HTMLDivElement>(null);
    const premiumTier = currentUser?.premiumTier ?? (currentUser?.badges?.premium ? 'games_one' : null);
    const maxUploadSize = premiumTier === 'games_plus' ? 500 * 1024 * 1024 : premiumTier ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    const allowVideo = !!premiumTier;
    const autoPunctuation = currentUser?.settings?.text?.autoPunctuation !== false;
    const smartMentions = currentUser?.settings?.text?.smartMentions !== false;

    const applyTextSettings = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed || !autoPunctuation) return trimmed;
        if (/[.!?]$/.test(trimmed)) return trimmed;
        if (/[A-Za-z0-9-)]$/.test(trimmed)) return `${trimmed}.`;
        return trimmed;
    };


    useEffect(() => {
        currentConvIdRef.current = currentConvId;
    }, [currentConvId]);
    useEffect(() => {
        if (!currentUser?._id || isRealtimeDisabled()) return;

        const s = io(baseURL.replace('/api', ''), {
            path: '/socket.io',
            transports: ['polling'],
            auth: { userId: currentUser?._id },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 800,
            reconnectionDelayMax: 2500
        });

        s.on('connect_error', (err: any) => {
            if (isSocketEndpointMissing(err)) {
                disableRealtime();
                s.io.opts.reconnection = false;
                s.disconnect();
                setDirectError('Service temps r�el indisponible. V�rifiez que le backend Socket.IO est d�marr�.');
            }
        });

        s.on('connect', () => {
            s.emit('pm:list', { limit: 50, page: 0 }, (res: { ok: boolean; conversations: Conversation[] }) => {
                if (res.ok) setConversations(res.conversations);
            });

            if (directName) {
                s.emit('pm:history', { otherUserName: directName, limit: 50, page: 0 }, (res: { ok: boolean; messages: Message[]; conversationId: string }) => {
                    if (res.ok) {
                        setDirectError('');
                        setMessages(res.messages);
                        setCurrentConvId(res.conversationId);
                        setHasMore(res.messages.length === 50);
                        setView('chat');
                    } else {
                        setDirectError('Utilisateur introuvable ou discussion indisponible.');
                        setMessages([]);
                        setCurrentConvId(null);
                        setHasMore(false);
                        setView('chat');
                    }
                });
            } else {
                setDirectError('');
            }
        });

        s.on('pm:message', (msg: Message) => {
            if (currentConvIdRef.current && msg.conversation === currentConvIdRef.current) {
                setMessages((prev) => [...prev, msg]);
                markConversationRead(currentConvIdRef.current);
            }
        });

        s.on('pm:updated', (conv: Conversation) => {
            setConversations((prev) => {
                const filtered = prev.filter((c) => c._id !== conv._id);
                return [conv, ...filtered];
            });
        });

        s.on('pm:read_update', (conv: Conversation) => {
            setConversations((prev) =>
                prev.map((c) => {
                    if (c._id !== conv._id) return c;
                    const prevMap = c.lastReadMessage || {};
                    const nextMap = conv.lastReadMessage || {};
                    Object.keys(nextMap).forEach((userId) => {
                        if (prevMap[userId] !== nextMap[userId] && nextMap[userId]) {
                            setPulseMsgIds((prevPulse) => ({
                                ...prevPulse,
                                [nextMap[userId] as string]: Date.now()
                            }));
                            setTimeout(() => {
                                setPulseMsgIds((prevPulse) => {
                                    const copy = { ...prevPulse };
                                    delete copy[nextMap[userId] as string];
                                    return copy;
                                });
                            }, 1800);
                        }
                    });
                    return conv;
                })
            );
        });

        s.on('pm:deleted', ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
            if (currentConvIdRef.current === conversationId) {
                setMessages((prev) => prev.filter((m) => m._id !== messageId));
            }
        });

        s.on('pm:updated_msg', (newMsg: Message) => {
            setMessages((prev) => prev.map((m) => (m._id === newMsg._id ? { ...m, ...newMsg } : m)));
        });

        setSocket(s);



        return () => {
            s.disconnect();
        };
    }, [currentUser?._id, directName]);

    useEffect(() => {
        if (!socket) return;
        const openConv = (convId: string, targetMessageId?: string) => {
            socket.emit('pm:history', { conversationId: convId, limit: 50, page: 0 }, (res: { ok: boolean; messages: Message[]; conversationId: string }) => {
                if (res.ok) {
                    setMessages(res.messages);
                    setCurrentConvId(res.conversationId);
                    setHasMore(res.messages.length === 50);
                    setView('chat');
                    if (targetMessageId) {
                        setPendingScrollId(targetMessageId);
                    }
                }
            });
        };
        const handler = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            const pendingRaw = detail || localStorage.getItem('pm_open_conv');
            if (!pendingRaw) return;
            localStorage.removeItem('pm_open_conv');
            if (typeof pendingRaw === 'string') {
                try {
                    const parsed = JSON.parse(pendingRaw);
                    if (parsed?.conversationId) {
                        openConv(parsed.conversationId, parsed.messageId);
                        return;
                    }
                } catch {
                    openConv(pendingRaw);
                    return;
                }
                openConv(pendingRaw);
                return;
            }
            if (pendingRaw?.conversationId) {
                openConv(pendingRaw.conversationId, pendingRaw.messageId);
            }
        };
        window.addEventListener('pm_open_conv', handler as EventListener);
        const pending = localStorage.getItem('pm_open_conv');
        if (pending) {
            localStorage.removeItem('pm_open_conv');
            try {
                const parsed = JSON.parse(pending);
                if (parsed?.conversationId) {
                    openConv(parsed.conversationId, parsed.messageId);
                } else {
                    openConv(pending);
                }
            } catch {
                openConv(pending);
            }
        }
        return () => window.removeEventListener('pm_open_conv', handler as EventListener);
    }, [socket]);

    useEffect(() => {
        if (!showNewConv || !currentUser?._id) return;
        setFriendsLoading(true);
        FriendsSession.getAll(currentUser._id)
            .then((list) => setFriends(Array.isArray(list) ? list : []))
            .finally(() => setFriendsLoading(false));
    }, [showNewConv, currentUser?._id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (
                showEditEmojiPicker &&
                editEmojiPickerRef.current &&
                !editEmojiPickerRef.current.contains(event.target as Node)
            ) {
                setShowEditEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker, showEditEmojiPicker]);

    useEffect(() => {
        if (messagesEndRef.current && page === 0) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, view, page]);

    useEffect(() => {
        if (!pendingScrollId || !currentConvId || !socket) return;
        let cancelled = false;
        const tryScroll = () => {
                const el = document.getElementById(`pm-msg-${pendingScrollId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightMsgId(pendingScrollId);
                    setTimeout(() => setHighlightMsgId((prev) => (prev === pendingScrollId ? null : prev)), 2000);
                    setPendingScrollId(null);
                    return true;
            }
            return false;
        };

        const fetchUntilFound = async () => {
            if (tryScroll()) return;
            let nextPage = page + 1;
            let hasNext = hasMore;
            while (hasNext && !cancelled) {
                const res = await new Promise<{ ok: boolean; messages: Message[] }>((resolve) => {
                    socket.emit('pm:history', { conversationId: currentConvId, limit: 50, page: nextPage }, resolve);
                });
                if (cancelled) return;
                if (res?.ok) {
                    setMessages((prev) => [...res.messages, ...prev]);
                    hasNext = res.messages.length === 50;
                    setHasMore(hasNext);
                    setPage(nextPage);
                    nextPage += 1;
                    if (res.messages.some((m) => m._id === pendingScrollId)) {
                        setTimeout(() => tryScroll(), 50);
                        return;
                    }
                } else {
                    return;
                }
            }
            if (!cancelled) {
                setJumpNotFound('Message mentionné introuvable.');
                setTimeout(() => setJumpNotFound(null), 3000);
                setPendingScrollId(null);
            }
        };

        fetchUntilFound();
        return () => {
            cancelled = true;
        };
    }, [pendingScrollId, currentConvId, socket, hasMore, page]);

    const handleSendMessage = async () => {
        const finalContent = applyTextSettings(input);
        if ((!finalContent && mediaFiles.length === 0) || !socket || !currentConvId || uploading) return;

        let imageUrl = null;
        let videoUrl = null;

        if (mediaFiles.length > 0) {
            const media = mediaFiles[0];
            if (media.type.startsWith('video/') && !allowVideo) {
                alert('Vidéo réservée aux comptes premium.');
                return;
            }
            if (media.size > maxUploadSize) {
                alert('Fichier trop volumineux pour votre offre.');
                return;
            }
            setUploading(true);
            try {
                const formData = new FormData();
                if (currentUser?._id) formData.append('userId', currentUser._id);
                mediaFiles.forEach((file) => {
                    if (file.type.startsWith('image/')) formData.append('image', file);
                    else if (file.type.startsWith('video/')) formData.append('video', file);
                });
                const res = await fetch(`${baseURL}/create_link`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    imageUrl = data.url;
                    videoUrl = data.videoUrl;
                }
            } catch (err) {
                console.error(err);
            } finally {
                setUploading(false);
            }
        }

        socket.emit(
            'pm:send',
            {
                conversationId: currentConvId,
                content: finalContent,
                image: imageUrl,
                video: videoUrl,
                replyTo: replyingTo?._id
            },
            (res: { ok: boolean; error?: string }) => {
                if (res.ok) {
                    setInput('');
                    setMediaFiles([]);
                    setPage(0);
                    setReplyingTo(null);
                } else {
                    alert(res.error);
                }
            }
        );
    };

    const formatTimeAgo = (dateInput?: string | Date | null) => {
        if (!dateInput) return '';
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        const diff = Date.now() - date.getTime();
        const seconds = Math.max(0, Math.floor(diff / 1000));
        if (seconds < 60) return 'il y a quelques secondes';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
        const months = Math.floor(days / 30);
        if (months < 12) return `il y a ${months} mois`;
        const years = Math.floor(days / 365);
        return `il y a ${years} an${years > 1 ? 's' : ''}`;
    };

    const markConversationRead = (convId?: string | null) => {
        if (!socket || !convId) return;
        socket.emit('pm:read', { conversationId: convId }, (res: { ok: boolean; conversation?: Conversation }) => {
            if (!res.ok || !res.conversation) return;
            setConversations((prev) => prev.map((c) => (c._id === res.conversation?._id ? res.conversation : c)));
        });
    };

    const handleEditMessage = (msgId: string, content: string) => {
        if (!content.trim() || !socket) return;
        socket.emit('pm:edit', { messageId: msgId, content }, (res: { ok: boolean }) => {
            if (res.ok) {
                setEditingMsg(null);
                setEditInput('');
            }
        });
    };

    const handleDeleteMessage = (msgId: string) => {
        if (!socket || !confirm('Supprimer ce message ?')) return;
        socket.emit('pm:delete', { messageId: msgId }, (res: { ok: boolean; error?: string }) => {
            if (!res.ok) alert(res.error);
        });
    };

    const handlePinMessage = (msgId: string) => {
        if (!socket) return;
        socket.emit('pm:pin_msg', { messageId: msgId }, (res: { ok: boolean; error?: string }) => {
            if (!res.ok) alert(res.error);
        });
    };

    const handlePinConv = (e: React.MouseEvent, convId: string) => {
        e.stopPropagation();
        if (!socket) return;
        socket.emit('pm:pin', { conversationId: convId }, (res: { ok: boolean; error?: string }) => {
            if (!res.ok) alert(res.error);
        });
    };

    const handleReactMessage = (msgId: string, emoji: string) => {
        if (!socket) return;
        socket.emit('pm:react', { messageId: msgId, emoji }, (res: { ok: boolean; error?: string }) => {
            if (!res.ok) alert(res.error);
        });
    };

    const toggleSelectTarget = (friend: Account) => {
        setSelectedTargets((prev) => {
            const exists = prev.some((f) => f._id === friend._id);
            if (exists) return prev.filter((f) => f._id !== friend._id);
            return [...prev, friend];
        });
    };

    const removeSelectedTarget = (id: string) => {
        setSelectedTargets((prev) => prev.filter((f) => f._id !== id));
    };

    const handleMessageContextMenu = (e: React.MouseEvent, msg: Message) => {
        e.preventDefault();
        if (!msg) return;
        const isMe = msg.sender?._id === currentUser?._id;
        const reactionEmojis = ['\uD83D\uDC4D', '\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDE2E', '\uD83D\uDE22', '\uD83D\uDE21'];
        const reactionOptions = reactionEmojis.map((emoji) => ({
            label: `Reagir ${emoji}`,
            icon: <span>{emoji}</span>,
            onClick: () => handleReactMessage(msg._id, emoji)
        }));
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            position: 'absolute',
            containerRect: chatAreaRef.current?.getBoundingClientRect() || null,
            options: [
                ...reactionOptions,
                { label: 'Repondre', icon: <FaReply />, onClick: () => setReplyingTo(msg) },
                {
                    label: msg.isPinned ? 'Desepingle' : 'Epingler',
                    icon: <FaThumbtack />,
                    onClick: () => handlePinMessage(msg._id)
                },
                ...(isMe
                    ? [
                          {
                              label: 'Modifier',
                              icon: <FaEdit />,
                              onClick: () => {
                                  setEditingMsg(msg);
                                  setEditInput(msg.content);
                              }
                          },
                          {
                              label: 'Supprimer',
                              icon: <FaTrash />,
                              onClick: () => handleDeleteMessage(msg._id),
                              danger: true
                          }
                      ]
                    : [])
            ]
        });
    };

    const handleUserContextMenu = (e: React.MouseEvent, targetUser?: Partial<Account>) => {
        e.preventDefault();
        if (!targetUser?._id) return;
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            position: 'absolute',
            containerRect: chatAreaRef.current?.getBoundingClientRect() || null,
            options: [
                {
                    label: 'Envoyer un message',
                    icon: <FaEnvelope />,
                    onClick: () => navigateTo(`/chat/${targetUser.name}`)
                },
                {
                    label: 'Afficher le profil',
                    icon: <FaUser />,
                    onClick: () => navigateTo(`/user/${targetUser.name}`)
                },
                {
                    label: 'Mentionner',
                    icon: <FaAt />,
                    onClick: () => {
                        setInput((prev) => `${prev} <@${targetUser._id}> `);
                        inputRef.current?.focus();
                    }
                },
                {
                    label: "Copier l'identifiant",
                    icon: <FaIdCard />,
                    onClick: () => {
                        navigator.clipboard.writeText(targetUser._id as string);
                        alert('ID copié !');
                    }
                },
                ...(currentUser?.badges?.admin || currentUser?.badges?.owner
                    ? [
                          {
                              label: 'Administrer',
                              icon: <FaUserShield />,
                              onClick: () => navigateTo(`/admin/user/${targetUser._id}`),
                              danger: true
                          }
                      ]
                    : [])
            ]
        });
    };

    const getMediaUrl = (url?: string | null) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        const base = baseURL.replace('/api', '');
        if (url.startsWith('/')) return `${base}${url}`;
        return `${base}/${url}`;
    };

    const handleTouchStart = (e: React.TouchEvent, msg: Message) => {
        longPressTimer.current = setTimeout(() => {
            const touch = e.touches[0];
            handleMessageContextMenu(
                {
                    preventDefault: () => { },
                    clientX: touch.clientX,
                    clientY: touch.clientY
                } as any,
                msg
            );
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleStartNewConv = () => {
        if ((!newConvTarget.trim() && selectedTargets.length === 0) || !socket) return;
        if (selectedTargets.length === 0 && newConvTarget.trim()) {
            const targetName = newConvTarget.trim().toLowerCase();
            const existing = conversations.find((c) => {
                const others = c.participants.filter((p) => p._id !== currentUser?._id);
                return others.length === 1 && (others[0]?.name?.toLowerCase() === targetName || others[0]?._id === newConvTarget.trim());
            });
            if (existing) {
                handleOpenConv(existing);
                setShowNewConv(false);
                setSelectedTargets([]);
                setNewConvTarget('');
                setNewConvError('');
                return;
            }
        }
        if (selectedTargets.length === 1) {
            const targetId = selectedTargets[0]?._id;
            const existing = conversations.find((c) => {
                const others = c.participants.filter((p) => p._id !== currentUser?._id);
                return others.length === 1 && others[0]?._id === targetId;
            });
            if (existing) {
                handleOpenConv(existing);
                setShowNewConv(false);
                setSelectedTargets([]);
                setNewConvTarget('');
                setNewConvError('');
                return;
            }
        }
        const payload =
            selectedTargets.length > 0
                ? { targets: selectedTargets.map((u) => u._id || u.name).filter(Boolean) }
                : { target: newConvTarget.trim() };
        socket.emit('pm:start', payload, (res: { ok: boolean; conversation: Conversation; error?: string }) => {
            if (res.ok) {
                setConversations((prev) => {
                    const exists = prev.find((c) => c._id === res.conversation._id);
                    if (exists) return prev;
                    return [res.conversation, ...prev];
                });
                handleOpenConv(res.conversation);
                setShowNewConv(false);
                setNewConvTarget('');
                setSelectedTargets([]);
                setNewConvError('');
            } else {
                setNewConvError(res.error || 'Impossible de demarrer la discussion.');
            }
        });
    };

    const loadMoreMessages = () => {
        if (!hasMore || loading || !socket || !currentConvId) return;
        setLoading(true);
        const nextPage = page + 1;
        socket.emit('pm:history', { conversationId: currentConvId, limit: 50, page: nextPage }, (res: { ok: boolean; messages: Message[] }) => {
            if (res.ok) {
                setMessages((prev) => [...res.messages, ...prev]);
                setHasMore(res.messages.length === 50);
                setPage(nextPage);
            }
            setLoading(false);
        });
    };

    const handleOpenConv = (conv: Conversation) => {
        const otherUsers = conv.participants.filter((p) => p._id !== currentUser?._id);
        if (otherUsers.length === 1 && otherUsers[0]?.name) {
            navigateTo(`/chat/${otherUsers[0].name}`);
        } else {
            navigateTo('/chat');
        }
        setView('chat');
        setMessages([]);
        setPage(0);
        setCurrentConvId(conv._id);
    };

    useEffect(() => {
        if (view !== 'chat' || !currentConvId) return;
        markConversationRead(currentConvId);
    }, [view, currentConvId]);

    const filteredFriends = friends.filter((f) => f.name?.toLowerCase().includes(newConvTarget.toLowerCase()));

    const filteredConvs = conversations.filter((c) => {
        const names = (c.participants || [])
            .filter((p) => p._id !== currentUser?._id)
            .map((p) => p.name)
            .filter(Boolean)
            .join(', ');
        return names.toLowerCase().includes(search.toLowerCase());
    }).sort((a, b) => {
        const aPinned = a.pinnedBy?.includes(currentUser?._id || '') ? 1 : 0;
        const bPinned = b.pinnedBy?.includes(currentUser?._id || '') ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
    });

    const currentFullConv = conversations.find((c) => c._id === currentConvId);
    const currentParticipants = currentFullConv?.participants || [];
    const otherUsersInChat = view === 'chat'
        ? currentParticipants.filter((p) => p._id !== currentUser?._id)
        : [];
    const isGroupChat = otherUsersInChat.length > 1;
    const primaryUserInChat = otherUsersInChat[0];
    const chatTitle = isGroupChat
        ? otherUsersInChat.map((u) => u.name).filter(Boolean).join(', ')
        : primaryUserInChat?.name;
    const mentionUsers = otherUsersInChat;
    const knownUsers = new Map<string, string>(
        [
            currentUser?._id ? [currentUser._id, currentUser.name] : null,
            ...currentParticipants
                .filter((p) => p._id && p.name)
                .map((p) => [p._id as string, p.name as string])
        ].filter(Boolean) as [string, string][]
    );

    const lastReadMap = currentFullConv?.lastReadMessage || {};
    const lastReadAtMap = currentFullConv?.lastReadAt || {};

    const handleBlock = async () => {
        if (!primaryUserInChat || isGroupChat) return;
        if (!confirm(`Voulez-vous vraiment bloquer ${primaryUserInChat.name} ?`)) return;
        try {
            const res = await fetch(`${baseURL}/friends/block/${primaryUserInChat._id}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (res.ok) {
                alert(`${primaryUserInChat.name} a été bloqué.`);
                setView('inbox');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-[80vh] mb-6 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl mt-6">
            <style>{`
                @keyframes pm-shake {
                    0% { transform: translateX(0); }
                    20% { transform: translateX(-4px); }
                    40% { transform: translateX(4px); }
                    60% { transform: translateX(-2px); }
                    80% { transform: translateX(2px); }
                    100% { transform: translateX(0); }
                }
                @keyframes pm-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
                    100% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                }
            `}</style>
            <div
                className={`w-full md:w-80 border-r border-gray-800 flex flex-col min-h-0 bg-gray-950/30 ${view === 'chat' ? 'hidden md:flex' : 'flex'}`}
            >
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white">Messages</h2>
                        <button
                            onClick={() => setShowNewConv(true)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-lg"
                        >
                            <FaUserPlus />
                        </button>
                    </div>
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Chercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
                    {filteredConvs.length === 0 ? (
                        <div className="p-10 text-center text-gray-500 text-xs italic">Aucune discussion</div>
                    ) : (
                        filteredConvs.map((conv) => {
                            const otherUsers = conv.participants?.filter((p) => p._id !== currentUser?._id) || [];
                            const displayName = otherUsers.map((u) => u.name).filter(Boolean).join(', ');
                            const displayAvatar = otherUsers[0]?.avatar;
                            const anyOnline = otherUsers.some((u) => u._id && onlineUsers.includes(u._id));
                            const isPinned = conv.pinnedBy?.includes(currentUser?._id || '');
                            return (
                                <div
                                    key={conv._id}
                                    onClick={() => handleOpenConv(conv)}
                                    className={`p-4 flex items-center gap-4 cursor-pointer transition border-l-4 group/item ${currentConvId === conv._id ? 'bg-blue-600/10 border-blue-500' : 'hover:bg-gray-800/50 border-transparent'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={displayAvatar || 'https://placehold.co/100x100/007bff/ffffff?text=U'}
                                            className="w-12 h-12 rounded-full border border-gray-700 object-cover"
                                            alt="avatar"
                                        />
                                        {anyOnline && (
                                            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-950"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-white truncate text-sm">{displayName || 'Discussion'}</h4>
                                            <span className="text-[10px] text-gray-500" data-timestamp>{conv.updatedAt &&
                                                    new Date(conv.updatedAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-500 truncate">
                                                    {conv.lastMessage?.content || 'Pas de message'}
                                                </p>
                                                <p className="text-[10px] text-gray-600 truncate mt-0.5">
                                                    {(() => {
                                                        const lastMsg = conv.lastMessage;
                                                        const lastReadAt = conv.lastReadAt?.[currentUser?._id || ''];
                                                        if (!lastMsg) return '';
                                                        if (lastMsg.sender?._id?.toString() === currentUser?._id) {
                                                            return `Envoyé ${formatTimeAgo(lastMsg.createdAt)}`;
                                                        }
                                                        if (lastReadAt && new Date(lastReadAt).getTime() >= new Date(lastMsg.createdAt).getTime()) {
                                                            return `Vu ${formatTimeAgo(lastReadAt)}`;
                                                        }
                                                        return 'Non lu';
                                                    })()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handlePinConv(e, conv._id)}
                                                className={`transition ${isPinned ? 'text-blue-500' : 'text-gray-600 opacity-0 group-hover/item:opacity-100'}`}
                                            >
                                                <FaThumbtack size={12} className={isPinned ? '' : 'rotate-45'} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className={`flex-1 flex flex-col min-h-0 bg-black/20 ${view === 'inbox' ? 'hidden md:flex' : 'flex'}`}>
                {view === 'chat' && otherUsersInChat.length > 0 ? (
                    <>
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/30 backdrop-blur px-6">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setView('inbox')}
                                    className="md:hidden text-gray-400 hover:text-white"
                                >
                                    <FaArrowLeft />
                                </button>
                                <img
                                    src={primaryUserInChat?.avatar || 'https://placehold.co/100x100/007bff/ffffff?text=U'}
                                    className="w-10 h-10 rounded-full border border-gray-700 cursor-pointer"
                                    onClick={(e) => !isGroupChat && primaryUserInChat && handleUserContextMenu(e, primaryUserInChat)}
                                    onContextMenu={(e) => !isGroupChat && primaryUserInChat && handleUserContextMenu(e, primaryUserInChat)}
                                    alt="chat-avatar"
                                />
                                <div>
                                    <h3
                                        className="font-bold text-white leading-tight cursor-pointer"
                                        onClick={(e) => !isGroupChat && primaryUserInChat && handleUserContextMenu(e, primaryUserInChat)}
                                        onContextMenu={(e) => !isGroupChat && primaryUserInChat && handleUserContextMenu(e, primaryUserInChat)}
                                    >
                                        {chatTitle || 'Discussion'}
                                    </h3>
                                    {!isGroupChat ? (
                                        <span className="text-xs text-green-500 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> En ligne
                                        </span>
                                    ) : (
                                        <span className="text-xs text-blue-400">Groupe</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-gray-400">
                                <button className="hover:text-red-500 transition" onClick={handleBlock}>
                                    <FaBan />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 relative" ref={chatAreaRef}>
                            {jumpNotFound && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full text-xs bg-red-500/15 border border-red-500/30 text-red-200 shadow-lg">
                                    {jumpNotFound}
                                </div>
                            )}
                            <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col-reverse" ref={scrollContainerRef}>
                            <div ref={messagesEndRef} />
                            {messages
                                .slice()
                                .reverse()
                                .map((msg) => {
                                    const isMe = msg.sender?._id === currentUser?._id;
                                    const isMentioned = !!currentUser?._id && msg.content?.includes(`<@${currentUser._id}>`);
                                    return (
                                <div
                                    key={msg._id}
                                    className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} group animate-slide-up relative ${isMentioned ? 'bg-amber-500/10 border border-amber-400/20 rounded-2xl px-2 py-1' : ''} ${highlightMsgId === msg._id ? 'bg-blue-500/10 border border-blue-400/30 rounded-2xl px-2 py-1' : ''}`}
                                    style={highlightMsgId === msg._id ? { animation: 'pm-shake 600ms ease-in-out' } : undefined}
                                >
                                            <div
                                                className={`max-w-[85%] md:max-w-[70%] flex ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-3 items-end`}
                                            >
                                                <img
                                                    src={msg.sender?.avatar}
                                                    className="w-6 h-6 rounded-full border border-gray-800 mb-1"
                                                    alt="msg-avatar"
                                                    onClick={(e) => handleUserContextMenu(e, msg.sender || undefined)}
                                                    onContextMenu={(e) => handleUserContextMenu(e, msg.sender || undefined)}
                                                />
                                                <div className="flex flex-col gap-1">
                                                    {msg.isPinned && (
                                                        <div
                                                            className={`flex items-center gap-1 text-[9px] text-blue-400 font-bold ${isMe ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <FaThumbtack size={8} /> épinglé
                                                        </div>
                                                    )}
                                            <div
                                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition shadow-sm relative ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}
                                                onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                                                onTouchStart={(e) => handleTouchStart(e, msg)}
                                                onTouchEnd={handleTouchEnd}
                                                id={`pm-msg-${msg._id}`}
                                            >
                                                        {editingMsg?._id === msg._id ? (
                                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                                <textarea
                                                                    value={editInput}
                                                                    onChange={(e) => setEditInput(e.target.value)}
                                                                    className="w-full bg-black/30 border border-white/20 rounded-lg p-2 text-white text-xs outline-none focus:ring-1 focus:ring-white/50"
                                                                    rows={3}
                                                                />
                                                                <div className="relative">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowEditEmojiPicker((prev) => !prev)}
                                                                        className="px-2 py-1 rounded-lg bg-white/10 text-[10px] font-bold hover:bg-white/20 transition inline-flex items-center gap-1"
                                                                    >
                                                                        <FaSmile /> Emojis
                                                                    </button>
                                                                    {showEditEmojiPicker && (
                                                                        <div
                                                                            ref={editEmojiPickerRef}
                                                                            className="absolute left-0 top-8 z-30 w-[300px] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl"
                                                                        >
                                                                            <EmojiPicker
                                                                                premiumTier={premiumTier}
                                                                                onSelect={(emoji) => {
                                                                                    setEditInput((prev) => `${prev}${emoji}`);
                                                                                    setShowEditEmojiPicker(false);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex justify-end gap-2 text-[10px]">
                                                                    <button onClick={() => setEditingMsg(null)}>
                                                                        Annuler
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleEditMessage(msg._id, editInput)
                                                                        }
                                                                        className="bg-white/20 px-2 py-1 rounded font-bold"
                                                                    >
                                                                        OK
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {msg.replyTo && (
                                                                    <div
                                                                        className={`mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-blue-400 text-[10px] italic opacity-80 max-w-full truncate ${isMe ? 'text-blue-100' : 'text-gray-400'}`}
                                                                    >
                                                                        <span className="font-bold mr-1">
                                                                            {msg.replyTo.sender?.name}:
                                                                        </span>{' '}
                                                                        {msg.replyTo.content}
                                                                    </div>
                                                                )}
                                                                <MentionText
                                                                    text={msg.content}
                                                                    navigateTo={navigateTo}
                                                                    knownUsers={knownUsers}
                                                                />
                                                                {extractGiftCodes(msg.content).map((code) => (
                                                                    <GiftCard key={`gift-${msg._id}-${code}`} code={code} currentUserId={currentUser?._id} />
                                                                ))}
                                                                {msg.image && (
                                                                    <img
                                                                        src={getMediaUrl(msg.image)}
                                                                        className="mt-2 rounded-lg max-h-60 object-contain cursor-pointer"
                                                                        onClick={() => {
                                                                            const url = getMediaUrl(msg.image);
                                                                            if (url) window.open(url, '_blank', 'noopener');
                                                                        }}
                                                                        alt="msg-img"
                                                                    />
                                                                )}
                                                                {msg.video && (
                                                                    <video
                                                                        src={msg.video}
                                                                        controls
                                                                        className="mt-2 rounded-lg max-h-60 bg-black"
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    {msg.reactions && msg.reactions.length > 0 && (
                                                        <div className={`flex flex-wrap gap-1 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>

                                                            {msg.reactions.map((r) => (
                                                                <button
                                                                    key={r.emoji}
                                                                    onClick={() => handleReactMessage(msg._id, r.emoji)}
                                                                    className={`px-2 py-0.5 rounded-full text-[11px] border ${r.users?.some((u: any) => u?.toString() === currentUser?._id) ? 'border-blue-400 text-blue-300' : 'border-gray-700 text-gray-300'} bg-gray-900/70 hover:border-blue-400 transition`}
                                                                >
                                                                    <span className="mr-1">{r.emoji}</span>
                                                                    <span>{r.users?.length || 0}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`text-[9px] text-gray-600 font-mono mt-1 ${isMe ? 'text-right' : 'text-left'}`}
                                                    >
                                                        {new Date(msg.createdAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}{' '}
                                                        {msg.isEdited && '(modifié)'}
                                                    </div>
                                                    {Object.keys(lastReadMap).length > 0 && (() => {
                                                        const readUsers = currentParticipants
                                                            .filter((p) => p._id && p._id !== msg.sender?._id)
                                                            .filter((p) => lastReadMap[p._id as string] === msg._id);
                                                        if (readUsers.length === 0) return null;
                                                        return (
                                                            <div
                                                                className={`mt-1 flex items-center gap-1 text-[9px] text-gray-500 ${isMe ? 'justify-end' : 'justify-start'}`}
                                                            >
                                                                <span className="mr-1">Vu par</span>
                                                                {readUsers.map((p) => (
                                                                    (() => {
                                                                        const readAt = lastReadAtMap[p._id as string];
                                                                        const dateLabel = readAt ? new Date(readAt).toLocaleString() : '';
                                                                        const agoLabel = readAt ? formatTimeAgo(readAt) : '';
                                                                        const title = readAt ? `Vu par ${p.name} à ${agoLabel} (${dateLabel})` : `Vu par ${p.name}`;
                                                                        const pulse = !!pulseMsgIds[msg._id];
                                                                        return (
                                                                    <img
                                                                        key={p._id as string}
                                                                        src={p.avatar || 'https://placehold.co/24x24/334155/ffffff?text=U'}
                                                                        alt="vu"
                                                                        className="w-4 h-4 rounded-full border border-gray-700"
                                                                        style={pulse ? { animation: 'pm-pulse 1.2s ease-out' } : undefined}
                                                                        title={title}
                                                                    />
                                                                        );
                                                                    })()
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            {hasMore && (
                                <button
                                    onClick={loadMoreMessages}
                                    className="w-full py-4 text-xs text-gray-500 hover:text-blue-400 font-bold uppercase tracking-widest"
                                >
                                    {loading ? '...' : 'Voir plus'}
                                </button>
                            )}
                        </div>
                        {contextMenu && (
                            <ContextMenu
                                {...contextMenu}
                                position="absolute"
                                containerRect={chatAreaRef.current?.getBoundingClientRect() || null}
                                onClose={() => setContextMenu(null)}
                            />
                        )}
                    </div>

                        <div className="p-6 border-t border-gray-800 bg-gray-900/50">
                            {replyingTo && (
                                <div className="mb-4 bg-gray-800/80 border border-gray-700 rounded-2xl p-3 flex justify-between items-center shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <FaReply className="text-blue-500" />
                                        <div className="text-xs">
                                            <div className="text-gray-500 font-bold">
                                                Réponse à {replyingTo.sender?.name}
                                            </div>
                                            <div className="text-gray-300 truncate max-w-xs">{replyingTo.content}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setReplyingTo(null)}
                                        className="p-2 text-gray-500 hover:text-white"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            )}
                            {mediaFiles.length > 0 && (
                                <div className="mt-4 mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {mediaFiles.map((file, idx) => {
                                        if (file.type.startsWith('image/')) {
                                            return (
                                                <div key={`preview-img-${idx}`} className="relative group">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Prévisualisation ${idx + 1}`}
                                                        className="w-full h-32 object-cover rounded-lg border border-gray-600"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setMediaFiles((prev) => prev.filter((_, i) => i !== idx))
                                                        }
                                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        X
                                                    </button>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={`preview-vid-${idx}`} className="relative group">
                                                <video
                                                    src={URL.createObjectURL(file)}
                                                    className="w-full h-32 object-cover rounded-lg border border-gray-600 bg-black"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setMediaFiles((prev) => prev.filter((_, i) => i !== idx))
                                                    }
                                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    X
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {smartMentions && mentionUsers.length > 0 && (
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    {mentionUsers.map((u) => (
                                        <button
                                            key={u._id}
                                            type="button"
                                            onClick={() => setInput((prev) => `${prev} <@${u._id}> `)}
                                            className="px-2.5 py-1 rounded-full bg-gray-800 text-xs text-gray-200 hover:bg-gray-700 transition"
                                        >
                                            @{u.name}
                                        </button>
                                    ))}
                                    <span className="text-[10px] text-gray-500">Mentions: {"<@id>"} ou {"<#id>"}</span>
                                </div>
                            )}
                            <div className="mb-3 flex items-center gap-2 relative">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                                    className="px-3 py-2 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700 transition flex items-center gap-2"
                                >
                                    <FaSmile />
                                    <span className="text-xs">Emojis</span>
                                </button>
                                {showEmojiPicker && (
                                    <div
                                        ref={emojiPickerRef}
                                        className="absolute left-0 top-12 z-30 w-[320px] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl"
                                    >
                                        <EmojiPicker
                                            premiumTier={premiumTier}
                                            onSelect={(emoji) => {
                                                setInput((prev) => `${prev}${emoji}`);
                                                setShowEmojiPicker(false);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []).slice(0, 1);
                                            if (files[0] && files[0].size > maxUploadSize) {
                                                alert('Fichier trop volumineux pour votre offre.');
                                                return;
                                            }
                                            setMediaFiles(files);
                                        }}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-gray-500 hover:text-blue-400 transition"
                                        title="Image"
                                    >
                                        <FaImage />
                                    </button>
                                    <input
                                        type="file"
                                        ref={videoInputRef}
                                        className="hidden"
                                        accept="video/*"
                                        onChange={(e) => {
                                            if (!allowVideo) {
                                                alert('Vidéo réservée aux comptes premium.');
                                                return;
                                            }
                                            const files = Array.from(e.target.files || []).slice(0, 1);
                                            if (files[0] && files[0].size > maxUploadSize) {
                                                alert('Fichier trop volumineux pour votre offre.');
                                                return;
                                            }
                                            setMediaFiles(files);
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (!allowVideo) return;
                                            videoInputRef.current?.click();
                                        }}
                                        className={`p-2 text-gray-500 hover:text-green-400 transition ${!allowVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Vidéo"
                                    >
                                        <FaVideo />
                                    </button>
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Message..."
                                        className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        ref={inputRef}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={uploading}
                                    className={`p-3.5 rounded-2xl transition shadow-lg ${uploading ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                >
                                    <FaPaperPlane />
                                </button>
                            </div>
                        </div>
                    </>
                ) : directError ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <FaBan size={30} className="text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Discussion introuvable</h3>
                        <p className="max-w-xs text-sm mb-6">
                            {directError}
                        </p>
                        <button
                            onClick={() => {
                                setDirectError('');
                                setView('inbox');
                                navigateTo('/chat');
                            }}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                        >
                            Revenir aux messages
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                        <div className="w-20 h-20 bg-gray-800/30 rounded-full flex items-center justify-center mb-6">
                            <FaPaperPlane size={30} className="text-gray-700" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Vos messages</h3>
                        <p className="max-w-xs text-sm mb-6">
                            Prêt à discuter ? Sélectionnez une conversation ou commencez-en une nouvelle.
                        </p>
                        <button
                            onClick={() => setShowNewConv(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                        >
                            Nouvelle discussion
                        </button>
                    </div>
                )}
            </div>

            {showNewConv && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setShowNewConv(false)}
                >
                    <div
                        className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-white mb-2">Nouvelle discussion</h3>
                        <div className="text-xs text-gray-400 mb-4 flex items-center justify-between">
                            <span>Sélection multiple pour créer un groupe.</span>
                            {selectedTargets.length > 1 && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-200 font-semibold">
                                    Groupe ({selectedTargets.length})
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            value={newConvTarget}
                            onChange={(e) => {
                                setNewConvTarget(e.target.value);
                                if (newConvError) setNewConvError('');
                            }}
                            placeholder="Chercher un ami..."
                            className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none mb-4 transition"
                            onKeyDown={(e) => e.key === 'Enter' && handleStartNewConv()}
                        />
                        {newConvError && (
                            <div className="mb-4 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                                {newConvError}
                            </div>
                        )}
                        {selectedTargets.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {selectedTargets.map((u) => (
                                    <button
                                        key={u._id}
                                        type="button"
                                        onClick={() => removeSelectedTarget(u._id)}
                                        className="px-3 py-1 rounded-full bg-blue-600/20 text-xs text-blue-200 hover:bg-blue-600/30 transition"
                                    >
                                        {u.name} x
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="mb-6">
                            <div className="text-xs text-gray-400 font-semibold mb-2">Liste des amis</div>
                            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                                {friendsLoading ? (
                                    <div className="text-xs text-gray-500 italic">Chargement...</div>
                                ) : filteredFriends.length === 0 ? (
                                    <div className="text-xs text-gray-500 italic">Aucun ami correspondant</div>
                                ) : (
                                    filteredFriends.map((friend) => {
                                        const isSelected = selectedTargets.some((u) => u._id === friend._id);
                                        return (
                                            <button
                                                key={friend._id}
                                                type="button"
                                                onClick={() => toggleSelectTarget(friend)}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${isSelected ? 'bg-blue-600/30 border border-blue-500/40' : 'bg-gray-800/60 hover:bg-gray-800'}`}
                                            >
                                                <img
                                                    src={friend.avatar || 'https://placehold.co/64x64/007bff/ffffff?text=U'}
                                                    alt="friend-avatar"
                                                    className="w-8 h-8 rounded-full object-cover border border-gray-700"
                                                />
                                                <span className="text-sm text-gray-200 truncate">{friend.name}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNewConv(false)}
                                className="flex-1 py-3 text-gray-500 font-bold hover:text-white transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleStartNewConv}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                            >
                                Démarrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrivateChat;












