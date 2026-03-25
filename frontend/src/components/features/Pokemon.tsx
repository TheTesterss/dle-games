import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { baseURL } from '../../utils/d';
import { disableRealtime, isRealtimeDisabled, isSocketEndpointMissing } from '../../utils/realtime';
import {
    FaBolt,
    FaTimes,
    FaBars,
    FaUsers,
    FaPlay,
    FaSignInAlt,
    FaMaxcdn,
    FaEye,
    FaHistory,
    FaTrophy,
    FaTimesCircle,
    FaHourglassEnd,
    FaBan,
    FaBook
} from 'react-icons/fa';
import { translateColor, translateMode, formatType } from '../../utils/pokemonUtils';
import MentionText from '../utils/MentionText';
import ContextMenu from '../common/ContextMenu';
import type { GameOptions, GamePlayer, GameSummary, PokemonData, PokemonGuess } from '../../types';

type NavigateTo = (path: string) => void;

type PokemonProps = {
    navigateTo: NavigateTo;
};

type AttributeKey =
    | 'types'
    | 'weight'
    | 'size'
    | 'colors'
    | 'generation'
    | 'evolution'
    | 'index'
    | 'legendary'
    | 'fabulous'
    | 'mega'
    | 'maxEvolution'
    | 'ashTeam'
    | 'genderDiff'
    | 'formSwitch'
    | 'baseHappiness'
    | 'captureRate';

type TableColumn = { key: string; label: string };

type ViewState = 'landing' | 'create' | 'join' | 'game';

type WatchTarget = {
    playerId?: string;
    playerName?: string;
    guesses?: PokemonGuess[];
    target?: PokemonData;
};

type RoomState = {
    code: string;
    hostId: string;
    options: GameOptions;
    hostUserId?: string;
    players?: GamePlayer[];
    started?: boolean;
};

type PublicRoom = {
    code: string;
    hostId?: string;
    hostName?: string;
    started?: boolean;
    players?: Array<Partial<GamePlayer>>;
    options?: Partial<GameOptions>;
};

type ActiveGame =
    | {
          code: string;
          startedAt?: number | null;
          durationSec?: number | null;
      }
    | string;

type PokedexModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

type SocketResponse = {
    ok: boolean;
    error?: string;
};

type RoomChatMessage = {
    id: string;
    userId?: string | null;
    name: string;
    avatar?: string | null;
    content: string;
    createdAt: number;
    system?: boolean;
    reactions?: { emoji: string; users: string[] }[];
};

type CreateRoomResponse = SocketResponse & {
    code: string;
    room: { hostId: string; options: GameOptions };
};

type JoinRoomResponse = SocketResponse & {
    code: string;
    room: { hostId: string; options: GameOptions };
    reconnected?: boolean;
};

type RoomUpdatePayload = {
    options?: GameOptions;
    hostId?: string;
    hostUserId?: string;
};

const allOptions: Array<{ key: AttributeKey; label: string; premium?: boolean }> = [
    { key: 'types', label: 'Types' },
    { key: 'weight', label: 'Poids' },
    { key: 'size', label: 'Taille' },
    { key: 'colors', label: 'Couleurs' },
    { key: 'generation', label: 'Génération' },
    { key: 'evolution', label: 'Évolution' },
    { key: 'index', label: 'Index', premium: true },
    { key: 'legendary', label: 'Légendaire' },
    { key: 'fabulous', label: 'Fabuleux' },
    { key: 'mega', label: 'Méga', premium: true },
    { key: 'maxEvolution', label: 'Évolution finale' },
    { key: 'ashTeam', label: "Équipe d'Ash", premium: true },
    { key: 'genderDiff', label: 'Différence de genre', premium: true },
    { key: 'formSwitch', label: 'Forme changeante', premium: true },
    { key: 'baseHappiness', label: 'Bonheur de base', premium: true },
    { key: 'captureRate', label: 'Taux de capture', premium: true }
];

const defaultOptions: AttributeKey[] = ['types', 'weight', 'size', 'colors', 'generation', 'evolution'];
const PREMIUM_OPTION_KEYS: Set<AttributeKey> = new Set(['mega', 'index', 'genderDiff', 'captureRate', 'baseHappiness', 'ashTeam', 'formSwitch']);
const FREE_GENERATIONS: number[] = [1, 2, 3, 4];
const PREMIUM_GENERATIONS: number[] = [5, 6, 7];
const ALL_GENERATIONS: number[] = [...FREE_GENERATIONS, ...PREMIUM_GENERATIONS];

const Pokemon = ({ navigateTo }: PokemonProps) => {
    const { currentUser, currentUserFriends, setActiveGameRoom } = useAuth();
    const premiumTier = currentUser?.premiumTier ?? (currentUser?.badges?.premium ? 'games_one' : null);
    const isPremium = !!premiumTier;
    const maxPlayersLimit = premiumTier === 'games_plus' ? 10 : premiumTier === 'games_one' ? 7 : 4;
    const availableGenerations = isPremium ? ALL_GENERATIONS : FREE_GENERATIONS;
    const [socket, setSocket] = useState<Socket | null>(null);
    const [pokemonList, setPokemonList] = useState<PokemonData[]>([]);
    const [roomsList, setRoomsList] = useState<PublicRoom[]>([]);
    const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
    const [roomCode, setRoomCode] = useState<string>('');
    const [name, setName] = useState<string>(currentUser?.name || 'Joueur');
    const [mode, setMode] = useState<GameOptions['mode']>('solo');
    const [raceMode, setRaceMode] = useState<NonNullable<GameOptions['raceMode']>>('same');
    const modes = [
        { id: 'solo', label: 'Solo' },
        { id: 'multi_same', label: 'Course' },
        { id: 'multi_individual', label: 'Tour par Tour' },
        { id: 'turns_shared', label: 'Coopération' }
    ];
    const [maxPlayers, setMaxPlayers] = useState<number>(4);
    const [timeLimit, setTimeLimit] = useState<number>(2);
    const [globalTimeLimit, setGlobalTimeLimit] = useState<number | null>(null);
    const [attemptLimit, setAttemptLimit] = useState<number | null>(null);
    const [attributes, setAttributes] = useState<AttributeKey[]>(defaultOptions);
    const [activeAttributes, setActiveAttributes] = useState<AttributeKey[]>(defaultOptions);
    const [generations, setGenerations] = useState<number[]>(ALL_GENERATIONS);
    const [isPrivateRoom, setIsPrivateRoom] = useState<boolean>(false);

    const [view, setView] = useState<ViewState>('landing');
    const [room, setRoom] = useState<RoomState | null>(null);
    const [players, setPlayers] = useState<GamePlayer[]>([]);
    const [started, setStarted] = useState<boolean>(false);

    const [guessInput, setGuessInput] = useState<string>('');
    const [pokedexOpen, setPokedexOpen] = useState<boolean>(false);
    const [selectedGuess, setSelectedGuess] = useState<string>('');
    const [suggestions, setSuggestions] = useState<PokemonData[]>([]);

    const [results, setResults] = useState<PokemonGuess[]>([]);
    const [currentTurn, setCurrentTurn] = useState<string | null>(null);
    const [summary, setSummary] = useState<GameSummary | null>(null);
    const [showResultMessage, setShowResultMessage] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const showResultRef = useRef(false);
    const summaryRef = useRef<GameSummary | null>(null);

    const [watchTarget, setWatchTarget] = useState<WatchTarget | null>(null);
    const [watchingPlayerId, setWatchingPlayerId] = useState<string | null>(null);

    const [allPokemonForSuggestions, setAllPokemonForSuggestions] = useState<PokemonData[]>([]);
    const [roomChat, setRoomChat] = useState<RoomChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>('');
    const [pinnedChatId, setPinnedChatId] = useState<string | null>(null);
    const [chatOpen, setChatOpen] = useState<boolean>(true);
    const [unreadMentions, setUnreadMentions] = useState<number>(0);
    const [chatContextMenu, setChatContextMenu] = useState<any | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const chatOpenRef = useRef<boolean>(true);
    const stripAccents = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const formatPokemonName = (value?: string) => (value ? stripAccents(value) : '');
    const normalizePokemonKey = (value?: string) => stripAccents((value || '').toLowerCase());
    const autoPunctuation = currentUser?.settings?.text?.autoPunctuation !== false;
    const applyTextSettings = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed || !autoPunctuation) return trimmed;
        if (/[.!?]$/.test(trimmed)) return trimmed;
        if (/[A-Za-z0-9-)]$/.test(trimmed)) return `${trimmed}.`;
        return trimmed;
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await fetch(`${baseURL}/pokemon/list`);
                const data = await res.json();
                if (!res.ok || !Array.isArray(data)) {
                    console.error('Erreur liste Pokémon (suggestions):', data);
                    setError('Impossible de charger la liste Pokémon.');
                    return;
                }
                const filtered = (data as PokemonData[]).filter((p) => p.name !== 'admin');
                setAllPokemonForSuggestions(filtered);
            } catch (err) {
                console.error(err);
                setError('Impossible de charger la liste Pokémon.');
            }
        };
        fetchAll();
    }, []);

        const PokedexModal = ({ isOpen, onClose }: PokedexModalProps) => {
        const [search, setSearch] = useState<string>('');
        const [visibleCount, setVisibleCount] = useState<number>(48);
        const listSource = pokemonList.length > 0 ? pokemonList : allPokemonForSuggestions;
        const filtered = useMemo(() => {
            const key = normalizePokemonKey(search);
            if (!key) return listSource;
            return listSource.filter((p) => {
                const candidates = [p.displayName, p.name, p.namefr].filter(Boolean) as string[];
                return candidates.some((c) => normalizePokemonKey(c).includes(key));
            });
        }, [search, listSource]);

        useEffect(() => {
            if (isOpen) {
                setVisibleCount(48);
            } else {
                setSearch('');
            }
        }, [isOpen]);

        useEffect(() => {
            setVisibleCount(48);
        }, [search]);

        if (!isOpen) return null;

        const visible = filtered.slice(0, visibleCount);

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <div
                    className="bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-gray-800 bg-gray-900 sticky top-0 z-10 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">
                                Pokédex
                            </h2>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-500 text-sm">Résultats: {filtered.length}</span>
                                <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                                    <FaTimes size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Rechercher un Pokémon..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-red-500 transition"
                            />
                        </div>
                    </div>
                    <div
                        className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700"
                        style={{ scrollbarWidth: 'thin' }}
                    >
                        {visible.length === 0 ? (
                            <div className="text-center py-20 text-gray-500 font-bold">Aucun Pokémon trouvé.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {visible.map((p) => (
                                    <div
                                        key={p.id || p.index}
                                        className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500 transition group relative overflow-hidden"
                                    >
                                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                            {p.generation && (
                                                <span className="bg-gray-900/80 text-gray-300 text-[10px] px-2 py-0.5 rounded">
                                                    G{p.generation}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={p.image}
                                                className="w-14 h-14 object-contain"
                                                loading="lazy"
                                                alt={p.displayName}
                                            />
                                            <div>
                                                <div className="text-white font-bold text-lg">
                                                    {formatPokemonName(p.displayName || p.namefr || p.name)}
                                                </div>
                                                <div className="text-xs text-gray-400">#{p.index || p.id}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {p.type1fr && (
                                                <span className="text-[10px] bg-gray-900/80 px-2 py-0.5 rounded text-gray-300">
                                                    {p.type1fr}
                                                </span>
                                            )}
                                            {p.type2fr && (
                                                <span className="text-[10px] bg-gray-900/80 px-2 py-0.5 rounded text-gray-300">
                                                    {p.type2fr}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {visibleCount < filtered.length && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={() => setVisibleCount((prev) => prev + 48)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-700"
                                >
                                    Voir plus
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };
const handleBackToMenu = () => {
        resetGame();
    };

    const handleBackToRoom = () => {
        setShowResultMessage(false);
        setSummary(null);
        setStarted(false);
        setResults([]);
        setWatchTarget(null);
    };

    const handleDisband = () => {
        if (!socket || !room) return;
        socket.emit('pokemon:disband', { code: room.code });
    };

    const handleForfeit = () => {
        if (!socket || !room) return;
        if (room.hostId === socket?.id) {
            handleDisband();
        } else {
            socket.emit('pokemon:forfeit', { code: room.code });
        }
    };

    const handleChatSend = () => {
        if (!socket || !room) return;
        const content = applyTextSettings(chatInput);
        if (!content) return;
        socket.emit('pokemon:chat', { code: room.code, content }, (res: SocketResponse | undefined) => {
            if (!res?.ok) {
                setError(res?.error || 'Erreur chat');
            }
        });
        setChatInput('');
    };

    const handleChatReact = (messageId: string, emoji: string) => {
        if (!socket || !room) return;
        socket.emit('pokemon:chat_react', { code: room.code, messageId, emoji }, (res: SocketResponse | undefined) => {
            if (!res?.ok) {
                setError(res?.error || 'Erreur reaction');
            }
        });
    };
    const handleChatContextMenu = (e: React.MouseEvent, msg: RoomChatMessage) => {
        e.preventDefault();
        if (!msg || msg.system) return;
        const make = (emoji: string) => ({
            label: `Ajouter une réaction ${emoji}`,
            onClick: () => {
                handleChatReact(msg.id, emoji);
                setChatContextMenu(null);
            }
        });
        setChatContextMenu({
            x: e.clientX,
            y: e.clientY,
            options: [make('\u{1F44D}'), make('\u2764\uFE0F'), make('\u{1F602}'), make('\u{1F62E}'), make('\u{1F525}'), make('\u{1F440}')]
        });
    };


    const handleChatPin = (messageId: string) => {
        if (!socket || !room) return;
        socket.emit('pokemon:chat_pin', { code: room.code, messageId }, (res: SocketResponse | undefined) => {
            if (!res?.ok) {
                setError(res?.error || 'Erreur epinglage');
            }
        });
    }
    const handleCreate = () => {
        if (!socket) return;
        setError('');
        setSummary(null);
        setShowResultMessage(false);
        const options: GameOptions = {
            mode,
            raceMode,
            maxPlayers: Number(maxPlayers),
            timeLimit,
            globalTimeLimit,
            maxAttempts: attemptLimit,
            attributes,
            generations,
            isPrivate: isPrivateRoom
        } as GameOptions;
        socket.emit(
            'pokemon:create',
            { name, userId: currentUser?._id, options },
            (res: CreateRoomResponse | undefined) => {
                if (!res?.ok) {
                    setError(res?.error || 'Erreur création');
                    return;
                }
                setRoom({ code: res.code, hostId: res.room.hostId, options: res.room.options });
                setPlayers([]);
                setStarted(false);
                setResults([]);
                setView('game');
                setActiveAttributes((res.room.options.attributes || defaultOptions) as AttributeKey[]);
                setActiveGameRoom?.({ code: res.code, mode: res.room.options?.mode });
            }
        );
    };

    const handleJoin = (code?: string) => {
        if (!socket) return;
        const finalCode = (code || roomCode).trim().toUpperCase();
        if (!finalCode) return;
        setError('');
        setSummary(null);
        setShowResultMessage(false);
        socket.emit(
            'pokemon:join',
            { code: finalCode, name, userId: currentUser?._id },
            (res: JoinRoomResponse | undefined) => {
                if (!res?.ok) {
                    setError(res?.error || 'Erreur connexion');
                    return;
                }
                setActiveGameRoom?.({ code: finalCode, mode: res.room?.options?.mode });
                if (!res.reconnected) {
                    setRoom({ code: res.code, hostId: res.room.hostId, options: res.room.options });
                    setView('game');
                }
            }
        );
    };

    const handleStart = () => {
        if (!socket || !room) return;
        socket.emit('pokemon:start', { code: room.code }, (res: SocketResponse | undefined) => {
            if (!res?.ok) setError(res?.error || 'Erreur démarrage');
        });
    };

    const handleGuess = () => {
        if (!socket || !room) return;
        const finalGuess = (selectedGuess || guessInput).trim();
        if (!finalGuess) return;
        socket.emit('pokemon:guess', { code: room.code, guess: finalGuess }, (res: SocketResponse | undefined) => {
            if (!res?.ok) setError(res?.error || 'Erreur validation');
        });
        setGuessInput('');
        setSelectedGuess('');
    };

    const handleLeave = () => {
        if (!socket || !room) return;
        socket.emit('pokemon:leave', { code: room.code }, () => {
            resetGame();
        });
    };


    const resetGame = () => {
        setRoom(null);
        setStarted(false);
        setPlayers([]);
        setResults([]);
        setSummary(null);
        setShowResultMessage(false);
        setView('landing');
        setWatchTarget(null);
        setWatchingPlayerId(null);
        setRoomChat([]);
        setPinnedChatId(null);
        setChatInput('');
        setUnreadMentions(0);
        setCurrentTurn(null);
        setRoomCode('');
        setPokedexOpen(false);
        setActiveGameRoom?.(null);
    };

    const handleWatch = (playerId?: string) => {
        if (!socket || !room || !playerId) return;
        setWatchingPlayerId(playerId);
        socket.emit('pokemon:watch', { code: room.code, targetId: playerId });
    };

    const handleWatchNavigate = (direction: number) => {
        if (!socket || !room || !players.length) return;
        const currentIndex = players.findIndex((p) => p?.id === watchingPlayerId);
        if (currentIndex === -1) return;
        let nextIndex = currentIndex + direction;
        if (nextIndex < 0) nextIndex = players.length - 1;
        if (nextIndex >= players.length) nextIndex = 0;
        const nextPlayer = players[nextIndex];
        if (nextPlayer?.id !== socket?.id) {
            handleWatch(nextPlayer.id);
        }
    };

    const filteredSuggestions = useMemo(() => {
        if (guessInput.trim().length < 2) return [];
        const key = guessInput.toLowerCase();
        return allPokemonForSuggestions
            .filter(
                (p) => p.displayName?.toLowerCase().includes(key) || p.name?.includes(key) || p.namefr?.includes(key)
            )
            .slice(0, 8);
    }, [guessInput, allPokemonForSuggestions]);
    const resolveGuessData = (guess: string) => {
        const key = normalizePokemonKey(guess);
        if (!key) return undefined;
        const list = allPokemonForSuggestions.length ? allPokemonForSuggestions : pokemonList;
        return list.find((p) => {
            const candidates = [p.displayName, p.name, p.namefr].filter(Boolean) as string[];
            return candidates.some((c) => normalizePokemonKey(c) === key);
        });
    };
    const normalizeGuesses = (list: PokemonGuess[]) =>
        list.map((row: any) => {
            const guess = row.guess || row.name || '';
            const guessData = row.guessData || resolveGuessData(guess);
            return { ...row, guess, guessData } as PokemonGuess;
        });

        useEffect(() => {
        if (currentUser?.name) setName(currentUser.name);
    }, [currentUser?.name]);

    useEffect(() => {
        setMaxPlayers((prev) => {
            const safe = Number.isNaN(prev) ? 1 : prev;
            const minPlayers = mode === 'solo' ? 1 : 2;
            return Math.max(minPlayers, Math.min(maxPlayersLimit, safe));
        });
    }, [mode, maxPlayersLimit]);

    useEffect(() => {
        if (!isPremium) {
            setGenerations((prev) => prev.filter((g) => FREE_GENERATIONS.includes(g)).sort());
            setAttributes((prev) => prev.filter((a) => !PREMIUM_OPTION_KEYS.has(a)));
        }
    }, [isPremium]);

    useEffect(() => {
        chatOpenRef.current = chatOpen;
        if (chatOpen) setUnreadMentions(0);
    }, [chatOpen]);

    useEffect(() => {
        const fetchList = async () => {
            try {
                const res = await fetch(`${baseURL}/pokemon/list`);
                const data = await res.json();
                if (!res.ok || !Array.isArray(data)) {
                    console.error('Erreur liste Pokémon:', data);
                    setError('Impossible de charger la liste Pokémon.');
                    return;
                }
                const filtered = (data as PokemonData[]).filter((p) => p.name !== 'admin');
                setPokemonList(filtered);
            } catch (err) {
                console.error(err);
                setError('Impossible de charger la liste Pokémon.');
            }
        };
        fetchList();
    }, []);

    useEffect(() => {
        if (!currentUser?._id) return;
        if (isRealtimeDisabled()) {
            setError('Service temps r�el indisponible. V�rifiez que le backend Socket.IO est d�marr�.');
            return;
        }
        const s = io(baseURL.replace('/api', ''), {
            path: '/socket.io',
            transports: ['polling'],
            auth: { userId: currentUser._id },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 800,
            reconnectionDelayMax: 2500
        });
        setSocket(s);

        s.on('connect_error', (err: any) => {
            if (isSocketEndpointMissing(err)) {
                disableRealtime();
                s.io.opts.reconnection = false;
                s.disconnect();
                setError('Service temps r�el indisponible. V�rifiez que le backend Socket.IO est d�marr�.');
            }
        });

        s.on('connect', () => {
            s.emit('pokemon:rooms', (rooms: PublicRoom[]) => setRoomsList(rooms || []));
            s.emit('pokemon:check_active', { userId: currentUser._id });
        });

        s.on('pokemon:rooms', (rooms: PublicRoom[]) => setRoomsList(rooms || []));
        s.on('pokemon:active_games', (games: ActiveGame[]) => setActiveGames(games || []));
        s.on('pokemon:players', (list: GamePlayer[]) => setPlayers(list || []));
        s.on('pokemon:room_update', (payload: RoomUpdatePayload) => {
            setRoom((prev) =>
                prev
                    ? {
                          ...prev,
                          hostId: payload.hostId || prev.hostId,
                          hostUserId: payload.hostUserId || prev.hostUserId,
                          options: { ...prev.options, ...(payload.options || {}) }
                      }
                    : prev
            );
        });
        s.on('pokemon:host_changed', (payload: { hostId: string; hostUserId?: string }) => {
            setRoom((prev) => (prev ? { ...prev, hostId: payload.hostId, hostUserId: payload.hostUserId } : prev));
        });
        s.on('pokemon:started', (payload: { mode: string; attributes: AttributeKey[]; players: GamePlayer[] }) => {
            setStarted(true);
            setPlayers(payload.players || []);
            setActiveAttributes((payload.attributes || defaultOptions) as AttributeKey[]);
            setCurrentTurn(null);
        });
        s.on('pokemon:turn', (payload: { playerId: string | null }) => {
            setCurrentTurn(payload.playerId);
        });
        s.on('pokemon:guess_result', (payload: PokemonGuess) => {
            const enriched = payload.guessData ? payload : { ...payload, guessData: resolveGuessData(payload.guess) };
            setResults((prev) => [...prev, enriched]);
        });
        s.on('pokemon:summary', (payload: GameSummary) => {
            setSummary(payload);
            setShowResultMessage(true);
        });
        s.on('pokemon:ended', () => {
            resetGame();
        });
        s.on('pokemon:chat_history', (payload: { messages?: RoomChatMessage[]; pinnedId?: string | null } | RoomChatMessage[]) => {
            const messages = Array.isArray(payload) ? payload : payload?.messages;
            setRoomChat(Array.isArray(messages) ? messages : []);
            if (!Array.isArray(payload)) setPinnedChatId(payload?.pinnedId || null);
        });
        s.on('pokemon:chat_message', (msg: RoomChatMessage) => {
            if (!msg) return;
            setRoomChat((prev) => [...prev, msg].slice(-200));
            if (isMentionedInChat(msg) && !chatOpenRef.current) {
                setUnreadMentions((prev) => Math.min(99, prev + 1));
            }
        });
        s.on('pokemon:chat_pinned', (payload: { messageId: string | null }) => {
            setPinnedChatId(payload?.messageId || null);
        });
        s.on('pokemon:chat_updated', (msg: RoomChatMessage) => {
            if (!msg) return;
            setRoomChat((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
        });
        s.on('pokemon:watch_target', (payload: WatchTarget) => {
            setWatchTarget({
                ...payload,
                guesses: normalizeGuesses(payload.guesses || [])
            });
        });
        s.on('pokemon:rejoined', (payload: { room: RoomState; personalHistory?: PokemonGuess[]; guesses?: PokemonGuess[] }) => {
            setRoom(payload.room);
            setPlayers(payload.room.players || []);
            setStarted(payload.room.started ?? false);
            setResults(normalizeGuesses(payload.personalHistory || payload.guesses || []));
            setView('game');
            if (payload.room.started) {
                setActiveAttributes((payload.room.options.attributes || defaultOptions) as AttributeKey[]);
            }
            setActiveGameRoom?.({ code: payload.room.code, mode: payload.room.options?.mode });
        });

        return () => {
            s.disconnect();
        };
    }, [currentUser?._id]);
useEffect(() => {
        setSuggestions(filteredSuggestions);
    }, [filteredSuggestions]);

    const isMyTurn =
        !started || currentTurn === null || currentTurn === socket?.id || room?.options?.mode === 'turns_shared';
    const roomMaxPlayers = room?.options?.mode === 'solo' ? 1 : room?.options?.maxPlayers || players.length;
    const displayPlayers = started ? players : Array.from({ length: roomMaxPlayers }).map((_, i) => players[i] || null);
    const tableColumns = useMemo(() => buildColumns(activeAttributes), [activeAttributes]);

    const displayedResults = watchTarget ? normalizeGuesses(watchTarget.guesses || []) : normalizeGuesses(results);
    const activeGameCodes = activeGames.map((g) => (typeof g === 'string' ? g : g.code));
    const showActiveGames = activeGames.length > 0 && (!room || !activeGameCodes.includes(room.code));
    const chatUsers = useMemo(() => {
        const map = new Map<string, string>();
        players.forEach((p) => {
            if (p?.name) map.set(p.name.toLowerCase(), p.name);
        });
        return map;
    }, [players]);
    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isMentionedInChat = (msg: RoomChatMessage) => {
        if (!msg || msg.system) return false;
        if (msg.userId && currentUser?._id && msg.userId === currentUser._id) return false;
        const idToken = currentUser?._id ? `<@${currentUser._id}>` : '';
        if (idToken && msg.content?.includes(idToken)) return true;
        const name = currentUser?.name?.trim();
        if (!name) return false;
        const re = new RegExp(`(^|\\s)@${escapeRegex(name)}\\b`, 'i');
        return re.test(msg.content || '');
    };

    return (
        <section className="max-w-7xl mx-auto py-8 min-h-[85vh] flex flex-col gap-6 px-4">
            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Pokémon DLE
                </h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setPokedexOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition shadow-lg border border-gray-700"
                    >
                        <FaBook className="text-red-400" />
                        <span className="hidden md:inline font-bold">Pokédex</span>
                    </button>
                </div>
            </div>

            <PokedexModal isOpen={pokedexOpen} onClose={() => setPokedexOpen(false)} />

            {showActiveGames && (
                <div className="bg-blue-900/40 border border-blue-500/30 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaHistory className="text-blue-300" />
                        <span className="text-white font-semibold">Parties en cours: {activeGames.length}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {activeGames.map((g) => {
                            const code = typeof g === 'string' ? g : g.code;
                            return (
                                <button
                                    key={code}
                                    onClick={() => handleJoin(code)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition"
                                >
                                    Reprendre {code}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {!room && (
                <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl">
                    <div className="flex justify-center gap-4 mb-8">
                        <button
                            onClick={() => setView('landing')}
                            className={`px-8 py-3 rounded-2xl font-bold transition-all ${view === 'landing' ? 'bg-blue-600 text-white transform scale-105 shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'}`}
                        >
                            Salles
                        </button>
                        <button
                            onClick={() => setView('create')}
                            className={`px-8 py-3 rounded-2xl font-bold transition-all ${view === 'create' ? 'bg-purple-600 text-white transform scale-105 shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'}`}
                        >
                            Créer
                        </button>
                    </div>

                    {view === 'create' && (
                        <div className="grid lg:grid-cols-2 gap-10 animation-fade-in">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-white mb-4 border-b border-gray-800 pb-2">
                                    Configuration de la partie
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Mode de jeu</label>
                                        <select
                                            value={mode}
                                            onChange={(e) => setMode(e.target.value as GameOptions['mode'])}
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        >
                                            <option value="solo">Solo</option>
                                            <option value="multi_individual">Battle Royale</option>
                                            <option value="multi_same">Race (Même Pokémon)</option>
                                            <option value="turns_shared">Coopération</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Joueurs Max</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={maxPlayersLimit}
                                            value={maxPlayers}
                                            onChange={(e) => {
                                                const next = Number(e.target.value);
                                                const safe = Number.isNaN(next) ? 1 : next;
                                                const minPlayers = mode === 'solo' ? 1 : 2;
                                                setMaxPlayers(Math.max(minPlayers, Math.min(maxPlayersLimit, safe)));
                                            }}
                                            disabled={mode === 'solo'}
                                            className={`w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition ${mode === 'solo' && 'opacity-50 cursor-not-allowed'}`}
                                        />
                                    </div>
                                    {mode === 'multi_same' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-400">
                                                Variante de Course
                                            </label>
                                            <select
                                                value={raceMode}
                                                onChange={(e) => setRaceMode(e.target.value as NonNullable<GameOptions['raceMode']>)}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition outline-none"
                                            >
                                                <option value="same">Même Pokémon pour tous</option>
                                                <option value="different">Pokémon différent par joueur</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-300">Paramètres de difficulté</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(mode === 'multi_same' || mode === 'turns_shared') && (
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500">Temps/PKM (min)</label>
                                                <input
                                                    type="number"
                                                    placeholder="2"
                                                    value={timeLimit}
                                                    onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : 0)}
                                                    className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-500">Temps Global (min)</label>
                                            <input
                                                type="number"
                                                placeholder="8"
                                                value={globalTimeLimit || ''}
                                                onChange={(e) =>
                                                    setGlobalTimeLimit(
                                                        e.target.value ? parseFloat(e.target.value) : null
                                                    )
                                                }
                                                className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-500">Essais Max</label>
                                            <input
                                                type="number"
                                                placeholder="8"
                                                value={attemptLimit || ''}
                                                onChange={(e) =>
                                                    setAttemptLimit(e.target.value ? parseInt(e.target.value) : null)
                                                }
                                                className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-300">Indices affichés</label>
                                    <div className="flex flex-wrap gap-2">
                                        {allOptions.map((opt) => (
                                            <OptionChip
                                                key={opt.key}
                                                label={opt.label}
                                                active={attributes.includes(opt.key)}
                                                premium={opt.premium}
                                                disabled={!!opt.premium && !isPremium}
                                                onClick={() => {
                                                    if (opt.premium && !isPremium) return;
                                                    setAttributes((prev) =>
                                                        prev.includes(opt.key)
                                                            ? prev.filter((k) => k !== opt.key)
                                                            : [...prev, opt.key]
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-8 flex flex-col h-full justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-4 border-b border-gray-800 pb-2">
                                        Générations incluses
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <OptionChip
                                            label="Toutes"
                                            active={generations.length === availableGenerations.length}
                                            onClick={() => setGenerations(availableGenerations)}
                                        />
                                        {ALL_GENERATIONS.map((g) => {
                                            const isPremiumGen = PREMIUM_GENERATIONS.includes(g);
                                            return (
                                                <OptionChip
                                                    key={g}
                                                    label={`G${g}`}
                                                    active={generations.includes(g)}
                                                    premium={isPremiumGen}
                                                    disabled={!isPremium && isPremiumGen}
                                                    onClick={() => {
                                                        if (!isPremium && isPremiumGen) return;
                                                        setGenerations((prev) =>
                                                            prev.includes(g)
                                                                ? prev.filter((x) => x !== g)
                                                                : [...prev, g].sort()
                                                        );
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div
                                            className={`w-6 h-6 rounded border flex items-center justify-center transition ${isPrivateRoom ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-600'}`}
                                        >
                                            {isPrivateRoom && <FaBolt className="text-white text-xs" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={isPrivateRoom}
                                            onChange={(e) => setIsPrivateRoom(e.target.checked)}
                                            className="hidden"
                                        />
                                        <span className="text-gray-300 group-hover:text-white transition">
                                            Partie privée (non listée)
                                        </span>
                                    </label>
                                    <button
                                        onClick={handleCreate}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl py-4 rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                                    >
                                        <FaBolt /> Lancer la partie
                                    </button>
                                    {error && (
                                        <p className="text-red-400 text-center font-semibold bg-red-900/20 py-2 rounded-lg border border-red-900/50">
                                            {error}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'landing' && (
                        <div className="grid lg:grid-cols-3 gap-8 animation-fade-in">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-bold text-white">Salles Publiques</h3>
                                    <button
                                        onClick={() => socket?.emit('pokemon:rooms', (l: PublicRoom[]) => setRoomsList(l || []))}
                                        className="text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        Actualiser
                                    </button>
                                </div>
                                {roomsList.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700 text-gray-500">
                                        <FaUsers className="mx-auto text-4xl mb-4 opacity-50" />
                                        <p>Aucune salle publique pour le moment.</p>
                                        <p className="text-sm">Créez-en une pour commencer !</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {(() => {
                                            const friendIds = new Set(
                                                (currentUserFriends || []).map((f) => (f._id || f).toString())
                                            );
                                            return roomsList.map((r) => {
                                                const roomPlayers = r.players ?? [];
                                                const roomFriends = roomPlayers.filter(
                                                    (p) =>
                                                        p.userId &&
                                                        friendIds.has(p.userId.toString()) &&
                                                        p.userId !== currentUser?._id
                                                );
                                                return (
                                                    <div
                                                        key={r.code}
                                                        className="bg-gray-800 hover:bg-gray-750 border border-gray-700 p-5 rounded-xl flex justify-between items-center transition-all group shadow-lg"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="font-bold text-white text-lg">
                                                                    {r.code}
                                                                </h4>
                                                                <span
                                                                    className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${r.started ? 'bg-yellow-600/20 text-yellow-400' : 'bg-green-600/20 text-green-400'}`}
                                                                >
                                                                    {r.started ? 'En cours' : 'En attente'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-4 mt-1">
                                                                <p className="text-sm text-gray-400">
                                                                    Mode:{' '}
                                                                    <span className="text-gray-200 font-medium">
                                                                        {r.options?.mode ? translateMode(r.options.mode) : 'Inconnu'}
                                                                    </span>
                                                                </p>
                                                                <p className="text-sm text-gray-400">
                                                                    Chef:{' '}
                                                                    <span className="text-blue-400 font-medium">
                                                                        {r.hostName || 'Inconnu'}
                                                                    </span>
                                                                </p>
                                                                <p className="text-sm text-gray-400 flex items-center gap-1">
                                                                    <FaUsers size={12} />{' '}
                                                                    <span className="text-gray-200 font-medium">
                                                                        {roomPlayers.length} /{' '}
                                                                        {r.options?.maxPlayers || 4}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            {roomFriends.length > 0 && (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <div className="flex -space-x-2">
                                                                        {roomFriends.slice(0, 3).map((f, idx) => (
                                                                            <img
                                                                                key={idx}
                                                                                src={f.avatar}
                                                                                title={f.name}
                                                                                className="w-5 h-5 rounded-full border border-gray-900 bg-gray-800"
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-[10px] text-green-400 font-bold">
                                                                        {roomFriends.length} ami
                                                                        {roomFriends.length > 1 ? 's' : ''} présent
                                                                        {roomFriends.length > 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleJoin(r.code)}
                                                            disabled={r.started}
                                                            className={`px-5 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 ${
                                                                r.started
                                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md hover:shadow-lg'
                                                            }`}
                                                        >
                                                            {r.started ? <FaBan /> : <FaPlay />}
                                                            {r.started ? 'En cours' : 'Rejoindre'}
                                                        </button>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                            </div>
                            <div className="h-fit">
                                <h3 className="text-lg font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                    Code Privé
                                </h3>
                                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                                    <div className="mb-4">
                                        <label className="text-sm text-gray-400 mb-1 block">
                                            Entrez le code de la salle
                                        </label>
                                        <input
                                            value={roomCode}
                                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                            placeholder="CODE"
                                            className="w-full bg-gray-950 border border-gray-600 rounded-xl px-4 py-3 text-white text-center font-mono text-2xl tracking-widest uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleJoin()}
                                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
                                    >
                                        Rejoindre
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {room && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col shadow-2xl overflow-hidden relative">
                    <div className="p-6 border-b border-gray-800 bg-gray-900/80 backdrop-blur flex flex-wrap justify-between items-center gap-4 sticky top-0 z-30">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-bold text-white font-mono tracking-wider">{room.code}</h2>
                                {isPrivateRoom && (
                                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">PRIVÉE</span>
                                )}
                            </div>
                            <div className="flex gap-4 text-sm text-gray-400 mt-1">
                                <span className="flex items-center gap-1">
                                    <FaUsers /> {players.length}/{room.options.maxPlayers}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FaPlay /> {translateMode(room.options.mode)}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {room.hostId === socket?.id && !started && (
                                <button
                                    onClick={handleStart}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105"
                                >
                                    Lancer la partie
                                </button>
                            )}
                            <button
                                onClick={handleBackToMenu}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition"
                            >
                                Menu
                            </button>
                            <button
                                onClick={room.hostId === socket?.id ? handleDisband : handleLeave}
                                className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-900 rounded-xl transition"
                            >
                                {room.hostId === socket?.id ? 'Fermer la salle' : 'Quitter la salle'}
                            </button>
                            {started && (
                                <button
                                    onClick={handleForfeit}
                                    className="px-4 py-2 bg-orange-900/50 text-orange-400 border border-orange-900 rounded-xl hover:bg-orange-900/80 transition"
                                >
                                    Abandonner
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 min-h-[500px] flex flex-col gap-6 relative">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {displayPlayers.map((p, idx) => (
                                <PlayerSlot
                                    key={p ? p.id : `slot-${idx}`}
                                    player={p}
                                    isHost={p?.id === room.hostId}
                                    isCurrentTurn={currentTurn === p?.id}
                                    canWatch={
                                        started && room.options.mode === 'multi_individual' && p?.id !== socket?.id
                                    }
                                    onWatch={() => handleWatch(p?.id)}
                                    navigateTo={navigateTo}
                                />
                            ))}
                        </div>

                        {watchTarget && (
                            <div className="bg-gray-950 border border-purple-500/30 rounded-xl p-4 relative overflow-hidden shadow-2xl animate-fade-in-up">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-gray-200 flex items-center gap-2">
                                        <FaEye className="text-purple-400" /> Spectateur :{' '}
                                        <span className="text-white">{watchTarget.playerName}</span>
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleWatchNavigate(-1)}
                                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition"
                                        >
                                            ?
                                        </button>
                                        <button
                                            onClick={() => setWatchTarget(null)}
                                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 text-sm font-bold transition"
                                        >
                                            Arrêter
                                        </button>
                                        <button
                                            onClick={() => handleWatchNavigate(1)}
                                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition"
                                        >
                                            ?
                                        </button>
                                    </div>
                                </div>
                                {watchTarget.target && (
                                    <div className="flex gap-4 items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                        <img
                                            src={watchTarget.target.image}
                                            className="w-20 h-20 rounded object-contain bg-gray-800/50"
                                        />
                                        <div>
                                            <p className="text-xs text-purple-400 uppercase font-bold tracking-wider">
                                                Cible à trouver
                                            </p>
                                            <p className="font-bold text-2xl text-white">{formatPokemonName(watchTarget.target.name)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {started && !watchTarget && (
                            <div className="flex gap-3 relative z-20 max-w-3xl mx-auto w-full">
                                <div className="relative flex-1 group">
                                    <input
                                        value={guessInput}
                                        onChange={(e) => {
                                            setGuessInput(e.target.value);
                                            setSuggestions([]);
                                        }}
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            (suggestions.length
                                                ? setGuessInput(suggestions[0].displayName)
                                                : handleGuess())
                                        }
                                        placeholder={
                                            isMyTurn ? 'Entrez un nom de Pokémon...' : 'Attendez votre tour...'
                                        }
                                        disabled={!isMyTurn}
                                        className={`w-full bg-gray-800 border-2 ${isMyTurn ? 'border-blue-500 shadow-blue-900/20 shadow-lg' : 'border-gray-700 opacity-75'} text-white px-6 py-4 rounded-xl focus:outline-none text-lg transition-all scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent`}
                                        style={{ scrollbarWidth: 'thin' }}
                                    />
                                    {suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 w-full bg-gray-800 border border-gray-700 rounded-xl mt-2 overflow-hidden shadow-2xl max-h-60 overflow-y-auto z-50 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                            {suggestions.map((s) => (
                                                <button
                                                    key={s._id}
                                                    onClick={() => {
                                                        setGuessInput(s.displayName);
                                                        setSuggestions([]);
                                                    }}
                                                    className="w-full text-left px-5 py-3 hover:bg-gray-700 text-gray-200 flex items-center gap-3 transition-colors border-b border-gray-700/50 last:border-0"
                                                >
                                                    <img
                                                        src={s.image}
                                                        className="w-8 h-8 object-contain"
                                                        loading="lazy"
                                                        alt=""
                                                    />
                                                    <span className="font-medium">{formatPokemonName(s.displayName || s.namefr || s.name)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleGuess}
                                    disabled={!isMyTurn}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white px-8 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95"
                                >
                                    Valider
                                </button>
                            </div>
                        )}

                        {started && (
                            <div
                                className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/50 shadow-inner scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
                                style={{ scrollbarWidth: 'thin' }}
                            >
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4 border-b border-gray-800">Pokémon</th>
                                            {tableColumns.map((c) => (
                                                <th key={c.key} className="p-4 border-b border-gray-800 text-center">
                                                    {c.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800 text-gray-200">
                                        {displayedResults
                                            .slice()
                                            .reverse()
                                            .map(
                                                (
                                                    row,
                                                    i
                                                ) => (
                                                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                                                        <td className="p-3 font-bold flex items-center gap-3">
                                                            {row.guessData?.image ? (
                                                                <img
                                                                    src={row.guessData.image}
                                                                    className="w-10 h-10 rounded bg-gray-800 p-1"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 bg-gray-800 rounded"></div>
                                                            )}
                                                            {formatPokemonName(row.guessData?.displayName || row.guess)}
                                                        </td>
                                                        {tableColumns.map((c) => (
                                                            <td key={c.key} className="p-3 text-center">
                                                                {renderCell(c, row)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                )
                                            )}
                                        {displayedResults.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={tableColumns.length + 1}
                                                    className="p-8 text-center text-gray-500 italic"
                                                >
                                                    Aucun essai pour le moment. À vous de jouer !
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {room && (
                <div className="fixed right-4 bottom-4 z-40 w-[360px] max-w-[90vw]">
                    <div
                        className={`rounded-2xl border border-gray-800 shadow-2xl bg-gray-950/95 backdrop-blur-xl transition-all ${chatOpen ? 'max-h-[70vh]' : 'max-h-14'}`}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <button
                                onClick={() => setChatOpen((prev) => !prev)}
                                className="font-bold text-gray-200 flex items-center gap-2"
                            >
                                <span>Chat de salle</span>
                                {unreadMentions > 0 && (
                                    <span className="min-w-[18px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                                        {unreadMentions}
                                    </span>
                                )}
                            </button>
                            <div className="text-xs text-gray-500">{roomChat.length} messages</div>
                        </div>
                        {chatOpen && (
                            <div className="p-4">
                                {pinnedChatId && (
                                    <div className="mb-3 p-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-xs flex items-center gap-2">
                                        <span className="font-bold">Épinglé:</span>
                                        <span className="truncate">
                                            {roomChat.find((m) => m.id === pinnedChatId)?.content || 'Message'}
                                        </span>
                                    </div>
                                )}
                                <div className="max-h-56 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                                    {roomChat.length === 0 ? (
                                        <div className="text-xs text-gray-500 italic">Aucun message pour le moment.</div>
                                    ) : (
                                        roomChat.map((msg) => {
                                            const mentioned = isMentionedInChat(msg);
                                            return (
                                                <div
                                                    key={msg.id}
                                                    onContextMenu={(e) => handleChatContextMenu(e, msg)}
                                                    data-contextmenu="allow"
                                                    className={`flex gap-2 rounded-lg p-2 ${msg.system ? 'text-gray-500 italic' : 'text-gray-200'} ${mentioned ? 'bg-blue-900/30 border border-blue-500/30' : ''}`}
                                                >
                                                    {msg.system ? (
                                                        <span className="text-xs">SYS: {msg.content}</span>
                                                    ) : (
                                                        <>
                                                            <img
                                                                src={msg.avatar || 'https://placehold.co/64x64/111827/ffffff?text=U'}
                                                                className="w-6 h-6 rounded-full object-cover border border-gray-700"
                                                            />
                                                            <div className="text-xs">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-white">{msg.name}</span>
                                                                    <span className="text-[10px] text-gray-500" data-timestamp>{new Date(msg.createdAt).toLocaleTimeString([], {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                    {room?.hostId === socket?.id && (
                                                                        <button
                                                                            onClick={() => handleChatPin(msg.id)}
                                                                            className="text-[10px] text-yellow-400 hover:text-yellow-300 font-bold"
                                                                        >
                                                                            {pinnedChatId === msg.id ? 'Desepingler' : 'Epingler'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <MentionText
                                                                    text={msg.content}
                                                                    navigateTo={navigateTo}
                                                                    knownUsers={chatUsers}
                                                                    className="text-gray-300"
                                                                />
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {(msg.reactions || []).map((r) => (
                                                                        <button
                                                                            key={r.emoji}
                                                                            onClick={() => handleChatReact(msg.id, r.emoji)}
                                                                            className="px-2 py-0.5 rounded-full text-[10px] border border-gray-700 text-gray-200 hover:border-blue-400"
                                                                        >
                                                                            <span className="mr-1">{r.emoji}</span>
                                                                            <span>{r.users?.length || 0}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                                        placeholder="Écrire un message..."
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
                                    />
                                    <button
                                        onClick={handleChatSend}
                                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition"
                                    >
                                        Envoyer
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showResultMessage && summary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div
                        className={`relative max-w-2xl w-full rounded-3xl p-1 bg-gradient-to-br ${summary.winner?.id === socket?.id ? 'from-green-500 to-emerald-700' : 'from-red-500 to-rose-700'} shadow-2xl transform scale-100`}
                    >
                        <div className="bg-gray-900 rounded-[22px] p-8 text-center h-full">
                            <button
                                onClick={() => setShowResultMessage(false)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            >
                                <FaTimesCircle size={28} />
                            </button>

                            <div className="mb-6 flex justify-center">
                                {summary.winner?.id === socket?.id ? (
                                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-2 ring-4 ring-green-500/30">
                                        <FaTrophy size={48} />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-2 ring-4 ring-red-500/30">
                                        <FaTimesCircle size={48} />
                                    </div>
                                )}
                            </div>

                            <h2
                                className={`text-5xl font-extrabold mb-3 ${summary.winner?.id === socket?.id ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300' : 'text-white'}`}
                            >
                                {summary.winner?.id === socket?.id ? 'VICTOIRE !' : 'DÉFAITE'}
                            </h2>
                            <p className="text-2xl text-gray-300 mb-8 font-medium">
                                {summary.reason === 'found'
                                    ? `${summary.winner?.name} a trouvé la réponse !`
                                    : summary.reason === 'time'
                                      ? 'Le temps est écoulé !'
                                      : 'La partie est terminée.'}
                            </p>

                            {(summary.mode !== 'multi_individual' || summary.winner?.id === socket?.id) &&
                                summary.players.find((p) => p.id === socket?.id)?.target && (
                                    <div className="bg-gray-800/50 p-4 rounded-xl mb-8 border border-gray-700 inline-flex items-center gap-4 text-left">
                                        <img
                                            src={summary.players.find((p) => p.id === socket?.id)?.target?.image}
                                            className="w-16 h-16 object-contain"
                                        />
                                        <div>
                                            <p className="text-sm text-gray-500 uppercase font-bold">
                                                La réponse était
                                            </p>
                                            <p className="text-xl font-bold text-white">
                                                {formatPokemonName(summary.players.find((p) => p.id === socket?.id)?.target?.name)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            <div className="flex justify-center gap-4">
                                {summary.reason === 'forfeit' || summary.reason === 'disbanded' ? (
                                    <button
                                        onClick={() => {
                                            setShowResultMessage(false);
                                            resetGame();
                                        }}
                                        className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 hover:scale-105 transition shadow-lg"
                                    >
                                        Retour au menu
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleBackToRoom}
                                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition"
                                        >
                                            Retour au salon
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowResultMessage(false);
                                                resetGame();
                                            }}
                                            className="px-6 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition"
                                        >
                                            Retour au menu
                                        </button>
                                    </>
                                )}
                            </div>
                            {summary.logs && summary.logs.length > 0 && (
                                <div className="mt-6 text-left bg-gray-950/60 border border-gray-800 rounded-xl p-4">
                                    <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                                        Journal de salle
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-300 max-h-32 overflow-y-auto">
                                        {summary.logs.slice(-10).map((log, idx) => (
                                            <div key={`${log}-${idx}`}>SYS: {log}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {chatContextMenu && (
                <ContextMenu {...chatContextMenu} onClose={() => setChatContextMenu(null)} />
            )}
        </section>
    );
};

type OptionChipProps = { label: string; active: boolean; onClick: () => void; premium?: boolean; disabled?: boolean };

const OptionChip = ({ label, active, onClick, premium, disabled }: OptionChipProps) => (
    <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${
            disabled
                ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'
                : active
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
        }`}
    >
        <span>{label}</span>
        {premium && <span className="text-[9px] px-2 py-0.5 rounded-full bg-pink-600/70 text-white">Premium</span>}
    </button>
);

type PlayerSlotProps = { player: GamePlayer | null; isHost: boolean; isCurrentTurn: boolean; canWatch: boolean; onWatch: () => void; navigateTo: NavigateTo };

const PlayerSlot = ({ player, isHost, isCurrentTurn, canWatch, onWatch, navigateTo }: PlayerSlotProps) => {
    if (!player)
        return (
            <div className="h-28 rounded-xl border-2 border-dashed border-gray-800 flex items-center justify-center text-gray-700 font-bold bg-gray-900/30">
                Libre
            </div>
        );
    return (
        <div
            className={`relative h-28 rounded-xl p-3 flex flex-col justify-between transition-all ${isCurrentTurn ? 'bg-blue-900/20 border-2 border-blue-500 shadow-blue-900/20 shadow-lg scale-[1.02]' : 'bg-gray-800 border border-gray-700'}`}
        >
            <div className="flex items-start gap-2 overflow-hidden">
                <img
                    src={player.avatar || 'https://placehold.co/100'}
                    className="w-10 h-10 rounded-full bg-gray-900 border border-gray-600 flex-shrink-0 cursor-pointer hover:ring-2 ring-blue-500 transition"
                    onClick={() => navigateTo(`/user/${player.name}`)}
                />
                <div className="flex-1 min-w-0 text-left">
                    <p
                        className="font-bold text-sm text-gray-100 truncate leading-tight cursor-pointer hover:text-blue-400 transition"
                        onClick={() => navigateTo(`/user/${player.name}`)}
                    >
                        {player.name}
                    </p>
                    {isHost && (
                        <span className="text-[10px] text-yellow-500 flex items-center gap-1">
                            <FaTrophy size={8} /> Hôte
                        </span>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-end mt-2">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Score</span>
                    <span className="font-mono text-blue-400 font-bold text-lg">
                        {Math.round((player.bestScore || 0) * 100)}%
                    </span>
                </div>
                {canWatch && (
                    <button
                        onClick={onWatch}
                        className="p-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg transition"
                    >
                        <FaEye size={14} />
                    </button>
                )}
                {player.guesses?.length > 0 && (
                    <span className="text-xs text-gray-500">{player.guesses.length} essais</span>
                )}
            </div>
        </div>
    );
};

const buildColumns = (attrs: AttributeKey[] = []): TableColumn[] => {
    const columns: TableColumn[] = [];
    attrs.forEach((attr) => {
        if (attr === 'types') {
            columns.push({ key: 'type1', label: 'Type 1' });
            columns.push({ key: 'type2', label: 'Type 2' });
            return;
        }
        if (attr === 'weight') columns.push({ key: 'weight', label: 'Poids' });
        if (attr === 'size') columns.push({ key: 'size', label: 'Taille' });
        if (attr === 'generation') columns.push({ key: 'generation', label: 'Gen' });
        if (attr === 'colors') columns.push({ key: 'colors', label: 'Couleur' });
        if (attr === 'evolution') columns.push({ key: 'evolution', label: 'Evo' });
        if (attr === 'captureRate') columns.push({ key: 'captureRate', label: 'Capture' });
        if (attr === 'baseHappiness') columns.push({ key: 'baseHappiness', label: 'Bonheur' });
        if (attr === 'index') columns.push({ key: 'index', label: 'Idx' });
        if (attr === 'legendary') columns.push({ key: 'legendary', label: 'Lég' });
        if (attr === 'fabulous') columns.push({ key: 'fabulous', label: 'Fab' });
        if (attr === 'mega') columns.push({ key: 'mega', label: 'Méga' });
        if (attr === 'maxEvolution') columns.push({ key: 'maxEvolution', label: 'Max' });
        if (attr === 'ashTeam') columns.push({ key: 'ashTeam', label: 'Ash' });
        if (attr === 'genderDiff') columns.push({ key: 'genderDiff', label: 'Genre' });
        if (attr === 'formSwitch') columns.push({ key: 'formSwitch', label: 'Forme' });
    });
    return columns;
};

const renderCell = (col: TableColumn, row: PokemonGuess) => {
    const info = row.result?.[col.key];
    const data = (row.guessData ?? {}) as Partial<PokemonData>;
    let content = '-';
    let colorClass = 'bg-gray-800 text-gray-500';
    let indicator = '';

    const numericKeys = ['weight', 'size', 'generation', 'captureRate', 'baseHappiness', 'index', 'evolution'];

    if (info) {
        if (info.state === 'equal') {
            colorClass = 'bg-green-500/20 text-green-400 border border-green-500/30';
        } else if (info.state === 'partial' || info.state === 'close') {
            colorClass = 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
        } else if (info.state === 'up' || info.state === 'down') {
            colorClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
            if (numericKeys.includes(col.key)) {
                indicator = info.state === 'up' ? '>' : '<';
            }
        } else {
            colorClass = 'bg-gray-700/50 text-gray-400';
        }

        if (info.guessValue !== undefined && info.targetValue !== undefined && numericKeys.includes(col.key)) {
            const guess = parseFloat(info.guessValue);
            const target = parseFloat(info.targetValue);
            if (!isNaN(guess) && !isNaN(target) && target !== 0) {
                const diff = Math.abs(guess - target);
                const threshold = Math.abs(target) * 0.1;
                if (diff <= threshold && diff > 0) {
                    colorClass = 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
                }
            }
        }
    }

    switch (col.key) {
        case 'type1':
            content = formatType(data.type1fr) || '-';
            break;
        case 'type2':
            content = data.type2fr && data.type2fr !== 'none' ? formatType(data.type2fr) : 'Aucun';
            break;
        case 'weight':
            content = data.weight ? `${data.weight}kg` : '-';
            break;
        case 'size':
            content = data.size ? `${data.size}m` : '-';
            break;
        case 'generation':
            content = data.generation !== undefined ? String(data.generation) : '-';
            break;
        case 'colors':
            content = data.colors
                ? Array.isArray(data.colors)
                    ? data.colors.map(translateColor).join('/')
                    : translateColor(data.colors)
                : '-';
            break;
        case 'evolution':
            content = data.evolutionStage !== undefined ? String(data.evolutionStage) : '-';
            break;
        case 'captureRate':
            content = data.captureRate !== undefined ? String(data.captureRate) : '-';
            break;
        case 'baseHappiness':
            content = data.baseHappiness !== undefined ? String(data.baseHappiness) : '-';
            break;
        case 'index':
            content = data.index !== undefined ? String(data.index) : '-';
            break;
        case 'legendary':
            content = data.legendary ? 'Oui' : 'Non';
            break;
        case 'fabulous':
            content = data.fabulous ? 'Oui' : 'Non';
            break;
        case 'mega':
            content = data.mega ? 'Oui' : 'Non';
            break;
        case 'maxEvolution':
            content = data.maxEvolution ? 'Oui' : 'Non';
            break;
        case 'ashTeam':
            content = data.ashTeam ? 'Oui' : 'Non';
            break;
        case 'genderDiff':
            content = data.genderDiff ? 'Oui' : 'Non';
            break;
        case 'formSwitch':
            content = data.formSwitch ? 'Oui' : 'Non';
            break;
        default:
            content = '-';
    }

    return (
        <span
            className={`px-2 py-1 rounded text-xs font-mono font-bold flex items-center justify-center gap-1 ${colorClass}`}
        >
            {indicator && <span className="text-sm">{indicator}</span>}
            {content}
        </span>
    );
};

export default Pokemon;


























































































































