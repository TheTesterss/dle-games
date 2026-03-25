export interface UserStats {
    matchesPlayed: number;
    victories: number;
    losses: number;
    winRate: number;
    favoriteGame: string;
    longestStreak: number;
    mostPlayedOpponent?: string;
    pokemon?: {
        solo: { victories: number; matchesPlayed: number; winRate: number; longestStreak: number };
        multi_unique: { victories: number; matchesPlayed: number; winRate: number; longestStreak: number };
        multi_same: { victories: number; matchesPlayed: number; winRate: number; longestStreak: number };
        multi_turn: { victories: number; matchesPlayed: number; winRate: number; longestStreak: number };
    };
}

export interface UserBadges {
    verified?: boolean;
    admin?: boolean;
    owner?: boolean;
    premium?: boolean;
    ranking?: {
        tier: string;
        top10: boolean;
        dailyCheck: boolean;
    };
}

export interface Account {
    _id: string;
    name: string;
    mail: string;
    avatar: string;
    bio?: string;
    banner?: string;
    password?: string;
    premiumTier?: 'games_one' | 'games_plus' | null;
    premiumUntil?: string | null;
    premiumGrantedBy?: string | null;
    badges: UserBadges;
    stats: UserStats;
    settings?: {
        text: {
            autoPunctuation: boolean;
            smartMentions: boolean;
            showTimestamps: boolean;
            compactMode: boolean;
        };
        ui: {
            highContrast: boolean;
            reduceMotion: boolean;
            largeText: boolean;
        };
        messages: {
            hideOnlineStatus: boolean;
            muteNonFriends: boolean;
        };
        notifications: {
            enabled: boolean;
            messages: boolean;
            friendRequests: boolean;
            gameInvites: boolean;
            marketing: boolean;
            digest: boolean;
            inApp: boolean;
            email: boolean;
            push: boolean;
            quietHours: {
                enabled: boolean;
                start: string;
                end: string;
            };
        };
    };
    friends: string[];
    blocked: string[];
    desactivated?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Post {
    _id: string;
    user: Partial<Account>;
    content: string;
    image?: string;
    images?: string[];
    video?: string;
    videos?: string[];
    pinnedOnProfile?: boolean;
    likes: string[];
    comments: Comment[];
    repostOf?: string | Post;
    allowComments: boolean;
    allowReposts: boolean;
    isDeleted: boolean;
    createdAt: string;
}

export interface Comment {
    _id: string;
    user: Partial<Account>;
    content: string;
    images?: string[];
    videos?: string[];
    createdAt: string;
}

export interface FriendRequest {
    _id: string;
    from: string | Partial<Account>;
    to: string | Partial<Account>;
    status: 'pending' | 'accepted' | 'denied' | 'cancelled';
    createdAt: string;
}

export interface PokemonGuestResult {
    state: 'equal' | 'close' | 'up' | 'down' | 'different' | 'partial' | 'unknown';
    direction?: 'up' | 'down';
    guessValue?: any;
    targetValue?: any;
}

export interface PokemonGuess {
    guess: string;
    score: number;
    result: Record<string, PokemonGuestResult>;
    guessData?: PokemonData;
}

export interface PokemonData {
    _id: string;
    id: number;
    index: number;
    name: string;
    namefr: string;
    displayName: string;
    image: string;
    type1fr: string;
    type2fr: string;
    size: number;
    weight: number;
    generation: number;
    colors: string | string[];
    evolutionStage: number;
    captureRate?: number;
    baseHappiness?: number;
    legendary?: boolean;
    fabulous?: boolean;
    mega?: boolean;
    maxEvolution?: boolean;
    ashTeam?: boolean;
    genderDiff?: boolean;
    formSwitch?: boolean;
}

export interface GamePlayer {
    id: string; // Socket ID
    userId?: string;
    name: string;
    avatar: string;
    bestScore: number;
    guesses: PokemonGuess[];
    target?: PokemonData;
}

export interface GameOptions {
    mode: 'solo' | 'multi_same' | 'multi_individual' | 'turns_shared';
    maxPlayers: number;
    timeLimitSec?: number;
    globalTimeSec?: number;
    attemptLimit?: number;
    attributes: string[];
    generations: number[];
    isPrivate: boolean;
    raceMode?: 'same' | 'different';
}

export interface GameRoom {
    code: string;
    hostId: string;
    hostUserId?: string;
    players: GamePlayer[];
    started: boolean;
    options: GameOptions;
}

export interface GameSummary {
    winner: { id: string; name: string } | null;
    reason: 'found' | 'time' | 'forfeit' | 'disbanded' | 'end';
    players: GamePlayer[];
    mode: string;
    logs?: string[];
}

export interface Message {
    _id: string;
    conversation: string;
    sender: Partial<Account>;
    content: string;
    image?: string;
    video?: string;
    isPinned: boolean;
    isEdited: boolean;
    replyTo?: Message;
    createdAt: string;
    reactions?: { emoji: string; users: string[] }[];
    updatedAt: string;
}

export interface Conversation {
    _id: string;
    participants: Partial<Account>[];
    lastMessage?: Message;
    pinnedBy: string[];
    lastReadAt?: Record<string, string>;
    lastReadMessage?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

export interface AuthContextType {
    currentUser: Account | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<Account>;
    signup: (username: string, email: string, password: string) => Promise<Account>;
    getUser: (name: string) => Promise<Account>;
    logout: () => Promise<void>;
    getUsers: () => Promise<Account[]>;
    updateUser: (userData: Partial<Account>) => Promise<Account>;
    removeFriend: (userId: string, targetId: string) => Promise<any>;
    denyFriendRequest: (reqId: string) => Promise<any>;
    cancelFriendRequest: (reqId: string) => Promise<any>;
    acceptFriendRequest: (reqId: string) => Promise<any>;
    sendFriendRequest: (from: string, to: string) => Promise<FriendRequest>;
    fetchFriendRequests: (userId: string) => Promise<any[]>;
    fetchFriends: (userId: string) => Promise<Account[]>;
    currentUserFriends: Account[];
    currentUserFriendRequests: any[];
    onlineUsers: string[];
    notifications: any[];
    pushNotification: (payload: any) => string;
    removeNotification: (id: string) => void;
    markNotificationsSeen?: (filter?: (n: any) => boolean) => void;
    serverError: boolean;
    activeGameRoom: any;
    setActiveGameRoom: (room: any) => void;
    sendGameInvite?: (targetUserId: string, payload?: any) => void;
}
