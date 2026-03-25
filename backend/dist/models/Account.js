"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AccountSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    mail: { type: String, unique: true, required: true },
    avatar: { type: String, required: true },
    bio: { type: String, default: "" },
    banner: { type: String, default: null },
    password: { type: String, required: true },
    desactivated: { type: Boolean, default: false },
    badges: {
        owner: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },
        premium: { type: Boolean, default: false },
        admin: { type: Boolean, default: false },
        ranking: {
            tier: { type: String, default: "none" },
            top10: { type: Boolean, default: false },
            dailyCheck: { type: Boolean, default: false },
        },
    },
    stats: {
        matchesPlayed: { type: Number, default: 0 },
        victories: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        winRate: { type: Number, default: 0 },
        favoriteGame: { type: String, default: "" },
        longestStreak: { type: Number, default: 0 },
        mostPlayedOpponent: { type: String, default: "" },
        pokemon: {
            solo: {
                matchesPlayed: { type: Number, default: 0 },
                victories: { type: Number, default: 0 },
                losses: { type: Number, default: 0 },
                winRate: { type: Number, default: 0 },
                longestStreak: { type: Number, default: 0 },
            },
            multi_unique: {
                matchesPlayed: { type: Number, default: 0 },
                victories: { type: Number, default: 0 },
                losses: { type: Number, default: 0 },
                winRate: { type: Number, default: 0 },
                longestStreak: { type: Number, default: 0 },
            },
            multi_same: {
                matchesPlayed: { type: Number, default: 0 },
                victories: { type: Number, default: 0 },
                losses: { type: Number, default: 0 },
                winRate: { type: Number, default: 0 },
                longestStreak: { type: Number, default: 0 },
            },
            multi_turn: {
                matchesPlayed: { type: Number, default: 0 },
                victories: { type: Number, default: 0 },
                losses: { type: Number, default: 0 },
                winRate: { type: Number, default: 0 },
                longestStreak: { type: Number, default: 0 },
            },
        },
    },
    premiumTier: {
        type: String,
        enum: ["games_one", "games_plus", null],
        default: null,
    },
    premiumUntil: {
        type: Date,
        default: null,
    },
    premiumGrantedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        default: null,
    },
    settings: {
        text: {
            autoPunctuation: { type: Boolean, default: true },
            smartMentions: { type: Boolean, default: true },
            showTimestamps: { type: Boolean, default: true },
            compactMode: { type: Boolean, default: false },
        },
        ui: {
            highContrast: { type: Boolean, default: false },
            reduceMotion: { type: Boolean, default: false },
            largeText: { type: Boolean, default: false },
        },
        messages: {
            hideOnlineStatus: { type: Boolean, default: false },
            muteNonFriends: { type: Boolean, default: false },
        },
        notifications: {
            enabled: { type: Boolean, default: true },
            messages: { type: Boolean, default: true },
            friendRequests: { type: Boolean, default: true },
            gameInvites: { type: Boolean, default: true },
            marketing: { type: Boolean, default: false },
            digest: { type: Boolean, default: true },
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: false },
            push: { type: Boolean, default: false },
            quietHours: {
                enabled: { type: Boolean, default: false },
                start: { type: String, default: "22:00" },
                end: { type: String, default: "08:00" },
            },
        },
    },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("Account", AccountSchema);
