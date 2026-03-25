import { Document, Types } from 'mongoose';

export interface IBadgeRanking {
    tier: 'none' | 'gold' | 'silver' | 'bronze';
    top10: boolean;
    dailyCheck: boolean;
}

export interface IBadges {
    owner: boolean;
    verified: boolean;
    premium: boolean;
    admin: boolean;
    ranking: IBadgeRanking;
}

export interface IGameStats {
    matchesPlayed: number;
    victories: number;
    losses: number;
    winRate: number;
    longestStreak: number;
}

export interface IStats {
    matchesPlayed: number;
    victories: number;
    losses: number;
    winRate: number;
    favoriteGame: string;
    longestStreak: number;
    mostPlayedOpponent: string;
    pokemon: {
        solo: IGameStats;
        multi_unique: IGameStats;
        multi_same: IGameStats;
        multi_turn: IGameStats;
    };
}

export interface IAccountSettings {
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
}

export interface IAccount extends Document {
    name: string;
    mail: string;
    avatar: string;
    bio?: string;
    banner?: string;
    password?: string;
    desactivated: boolean;
    badges: IBadges;
    stats: IStats;
    settings?: IAccountSettings;
    premiumTier?: "games_one" | "games_plus" | null;
    premiumUntil?: Date | null;
    premiumGrantedBy?: any;
    createdAt: Date;
    updatedAt: Date;
}
