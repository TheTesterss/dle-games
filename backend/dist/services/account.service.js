"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatsHistory = exports.getLogs = exports.listAllUsers = exports.getUser = exports.deleteAccount = exports.updateAccount = exports.createAccount = void 0;
const Account_1 = __importDefault(require("../models/Account"));
const Friends_1 = __importDefault(require("../models/Friends"));
const Log_1 = __importDefault(require("../models/Log"));
const mongoose_1 = require("mongoose");
const toErrorMessage = (error, fallback = "Unknown error") => {
    if (!error)
        return fallback;
    if (typeof error === "string")
        return error;
    if (typeof error?.message === "string")
        return error.message;
    if (error?.errors && typeof error.errors === "object") {
        const fieldMessages = Object.values(error.errors)
            .map((entry) => entry?.message)
            .filter((msg) => typeof msg === "string");
        if (fieldMessages.length > 0)
            return fieldMessages.join(" | ");
    }
    try {
        return JSON.stringify(error);
    }
    catch {
        return fallback;
    }
};
const normalizePremium = async (user) => {
    if (!user)
        return user;
    const now = new Date();
    const hasTier = !!user.premiumTier;
    const hasUntil = !!user.premiumUntil;
    const isExpired = hasUntil && new Date(user.premiumUntil).getTime() <= now.getTime();
    if (isExpired) {
        await Account_1.default.updateOne({ _id: user._id }, {
            $set: {
                "badges.premium": false,
                premiumTier: null,
                premiumUntil: null,
                premiumGrantedBy: null,
                banner: null,
            },
        });
        user.badges = { ...user.badges, premium: false };
        user.premiumTier = null;
        user.premiumUntil = null;
        user.premiumGrantedBy = null;
        user.banner = null;
        return user;
    }
    if (hasTier && (!user.badges?.premium || user.badges.premium !== true)) {
        await Account_1.default.updateOne({ _id: user._id }, { $set: { "badges.premium": true } });
        user.badges = { ...user.badges, premium: true };
    }
    if (!hasTier && user.badges?.premium) {
        await Account_1.default.updateOne({ _id: user._id }, { $set: { "badges.premium": false } });
        user.badges = { ...user.badges, premium: false };
    }
    return user;
};
const sanitizeSettings = (incoming, existing) => {
    const safe = {
        text: {
            autoPunctuation: existing?.text?.autoPunctuation ?? true,
            smartMentions: existing?.text?.smartMentions ?? true,
            showTimestamps: existing?.text?.showTimestamps ?? true,
            compactMode: existing?.text?.compactMode ?? false,
        },
        ui: {
            highContrast: existing?.ui?.highContrast ?? false,
            reduceMotion: existing?.ui?.reduceMotion ?? false,
            largeText: existing?.ui?.largeText ?? false,
        },
        messages: {
            hideOnlineStatus: existing?.messages?.hideOnlineStatus ?? false,
            muteNonFriends: existing?.messages?.muteNonFriends ?? false,
        },
        notifications: {
            enabled: existing?.notifications?.enabled ?? true,
            messages: existing?.notifications?.messages ?? true,
            friendRequests: existing?.notifications?.friendRequests ?? true,
            gameInvites: existing?.notifications?.gameInvites ?? true,
            marketing: existing?.notifications?.marketing ?? false,
            digest: existing?.notifications?.digest ?? true,
            inApp: existing?.notifications?.inApp ?? true,
            email: existing?.notifications?.email ?? false,
            push: existing?.notifications?.push ?? false,
            quietHours: {
                enabled: existing?.notifications?.quietHours?.enabled ?? false,
                start: existing?.notifications?.quietHours?.start ?? "22:00",
                end: existing?.notifications?.quietHours?.end ?? "08:00",
            },
        },
    };
    if (!incoming || typeof incoming !== "object")
        return safe;
    const mergeBool = (value, fallback) => typeof value === "boolean" ? value : fallback;
    const mergeTime = (value, fallback) => typeof value === "string" && /^\d{2}:\d{2}$/.test(value) ? value : fallback;
    return {
        text: {
            autoPunctuation: mergeBool(incoming?.text?.autoPunctuation, safe.text.autoPunctuation),
            smartMentions: mergeBool(incoming?.text?.smartMentions, safe.text.smartMentions),
            showTimestamps: mergeBool(incoming?.text?.showTimestamps, safe.text.showTimestamps),
            compactMode: mergeBool(incoming?.text?.compactMode, safe.text.compactMode),
        },
        ui: {
            highContrast: mergeBool(incoming?.ui?.highContrast, safe.ui.highContrast),
            reduceMotion: mergeBool(incoming?.ui?.reduceMotion, safe.ui.reduceMotion),
            largeText: mergeBool(incoming?.ui?.largeText, safe.ui.largeText),
        },
        messages: {
            hideOnlineStatus: mergeBool(incoming?.messages?.hideOnlineStatus, safe.messages.hideOnlineStatus),
            muteNonFriends: mergeBool(incoming?.messages?.muteNonFriends, safe.messages.muteNonFriends),
        },
        notifications: {
            enabled: mergeBool(incoming?.notifications?.enabled, safe.notifications.enabled),
            messages: mergeBool(incoming?.notifications?.messages, safe.notifications.messages),
            friendRequests: mergeBool(incoming?.notifications?.friendRequests, safe.notifications.friendRequests),
            gameInvites: mergeBool(incoming?.notifications?.gameInvites, safe.notifications.gameInvites),
            marketing: mergeBool(incoming?.notifications?.marketing, safe.notifications.marketing),
            digest: mergeBool(incoming?.notifications?.digest, safe.notifications.digest),
            inApp: mergeBool(incoming?.notifications?.inApp, safe.notifications.inApp),
            email: mergeBool(incoming?.notifications?.email, safe.notifications.email),
            push: mergeBool(incoming?.notifications?.push, safe.notifications.push),
            quietHours: {
                enabled: mergeBool(incoming?.notifications?.quietHours?.enabled, safe.notifications.quietHours.enabled),
                start: mergeTime(incoming?.notifications?.quietHours?.start, safe.notifications.quietHours.start),
                end: mergeTime(incoming?.notifications?.quietHours?.end, safe.notifications.quietHours.end),
            },
        },
    };
};
const createAccount = async (userData) => {
    try {
        const existing = await Account_1.default.findOne({ $or: [{ mail: userData.mail }, { name: userData.name }] });
        if (existing) {
            const error = new Error("Un compte avec cet email ou ce pseudo existe déjà");
            error.name = "DuplicateAccount";
            throw error;
        }
        const newAccount = new Account_1.default({
            ...userData,
            desactivated: false,
            stats: {
                matchesPlayed: 0,
                victories: 0,
                losses: 0,
                winRate: 0,
                favoriteGame: "",
                longestStreak: 0,
                mostPlayedOpponent: "",
                pokemon: {
                    solo: { matchesPlayed: 0, victories: 0, losses: 0, winRate: 0, longestStreak: 0 },
                    multi_unique: { matchesPlayed: 0, victories: 0, losses: 0, winRate: 0, longestStreak: 0 },
                    multi_same: { matchesPlayed: 0, victories: 0, losses: 0, winRate: 0, longestStreak: 0 },
                    multi_turn: { matchesPlayed: 0, victories: 0, losses: 0, winRate: 0, longestStreak: 0 },
                },
                ...userData.stats,
            },
        });
        const newFriends = new Friends_1.default({
            user: newAccount._id,
            pending: [],
            list: [],
        });
        await newFriends.save();
        return await newAccount.save();
    }
    catch (e) {
        if (e.name === "DuplicateAccount")
            throw e;
        throw new Error(`Error creating account: ${toErrorMessage(e)}`);
    }
};
exports.createAccount = createAccount;
const updateAccount = async (id, userData) => {
    try {
        const existing = await Account_1.default.findById(id);
        if (!existing) {
            throw new Error("Account not found");
        }
        const sanitized = { ...userData };
        delete sanitized.premiumTier;
        delete sanitized.premiumUntil;
        delete sanitized.premiumGrantedBy;
        if (sanitized.badges && typeof sanitized.badges === "object") {
            delete sanitized.badges.premium;
            delete sanitized.badges.admin;
            delete sanitized.badges.owner;
            delete sanitized.badges.verified;
        }
        if (typeof sanitized.banner === "string" && !existing.premiumTier) {
            throw new Error("Acces premium requis pour modifier la banniere");
        }
        if ("settings" in sanitized) {
            sanitized.settings = sanitizeSettings(sanitized.settings, existing.settings);
        }
        const updatedAccount = await Account_1.default.findOneAndUpdate({ _id: id }, { $set: sanitized }, { new: true, runValidators: true });
        if (!updatedAccount) {
            throw new Error("Account not found");
        }
        return updatedAccount;
    }
    catch (e) {
        throw new Error("Error updating account: " + e.message);
    }
};
exports.updateAccount = updateAccount;
const deleteAccount = async (id) => {
    try {
        const deletedAccount = await Account_1.default.findOneAndDelete({ _id: id });
        if (!deletedAccount) {
            throw new Error("Account not found");
        }
        return deletedAccount;
    }
    catch (e) {
        throw new Error("Error deleting account: " + e.message);
    }
};
exports.deleteAccount = deleteAccount;
const getUser = async (d, t, requesterId) => {
    try {
        let query = {};
        if (t === "id") {
            query = { _id: d };
        }
        else if (t === "name" || t === "nom") {
            query = { name: d };
        }
        else if (t === "mail" || t === "email") {
            query = { mail: d };
        }
        else {
            throw new Error("Invalid search type. Use 'id', 'name', or 'mail'");
        }
        const user = await Account_1.default.findOne(query).lean();
        if (!user) {
            const error = new Error("User not found");
            error.name = "UserNotFound";
            throw error;
        }
        await normalizePremium(user);
        if (requesterId && user._id && user._id.toString() !== requesterId.toString()) {
            try {
                const [targetFriendsDoc, myFriendsDoc] = await Promise.all([
                    Friends_1.default.findOne({ user: user._id }).populate("list", "name avatar"),
                    Friends_1.default.findOne({ user: requesterId }),
                ]);
                if (targetFriendsDoc && myFriendsDoc && targetFriendsDoc.list && myFriendsDoc.list) {
                    const myFriendIds = new Set(myFriendsDoc.list.map((id) => id.toString()));
                    user.commonFriends = (targetFriendsDoc.list || [])
                        .filter((f) => f && f._id && myFriendIds.has(f._id.toString()))
                        .map((f) => ({
                        pseudo: f.name,
                        avatar: f.avatar,
                        _id: f._id,
                    }));
                }
                else {
                    user.commonFriends = [];
                }
            }
            catch (err) {
                console.error("Error calculating common friends:", err);
                user.commonFriends = [];
            }
        }
        else {
            user.commonFriends = [];
        }
        return user;
    }
    catch (e) {
        if (e.name === "UserNotFound")
            throw e;
        throw new Error("Error fetching user: " + e.message);
    }
};
exports.getUser = getUser;
const listAllUsers = async () => {
    try {
        const users = await Account_1.default.find({}).lean();
        await Promise.all(users.map((u) => normalizePremium(u)));
        return users;
    }
    catch (e) {
        throw new Error("Error fetching all users: " + e.message);
    }
};
exports.listAllUsers = listAllUsers;
const getLogs = async (userId) => {
    try {
        return await Log_1.default.find({ userId }).sort({ createdAt: -1 }).limit(50);
    }
    catch (e) {
        throw new Error("Error fetching logs: " + e.message);
    }
};
exports.getLogs = getLogs;
const getStatsHistory = async (userId, days = 30) => {
    try {
        const limitDays = Math.max(7, Math.min(90, Number(days) || 30));
        const since = new Date();
        since.setDate(since.getDate() - limitDays + 1);
        since.setHours(0, 0, 0, 0);
        const rows = await Log_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    action: "GAME_END",
                    createdAt: { $gte: since },
                },
            },
            {
                $project: {
                    day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    result: "$details.result",
                },
            },
            {
                $group: {
                    _id: "$day",
                    matches: { $sum: 1 },
                    wins: { $sum: { $cond: [{ $eq: ["$result", "win"] }, 1, 0] } },
                    losses: { $sum: { $cond: [{ $eq: ["$result", "loss"] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const map = new Map(rows.map((r) => [r._id, r]));
        const daily = [];
        for (let i = 0; i < limitDays; i += 1) {
            const d = new Date(since);
            d.setDate(since.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            const row = map.get(key);
            daily.push({
                date: key,
                matches: row?.matches || 0,
                wins: row?.wins || 0,
                losses: row?.losses || 0,
            });
        }
        const byMode = await Log_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    action: "GAME_END",
                    createdAt: { $gte: since },
                },
            },
            {
                $project: {
                    mode: { $ifNull: ["$details.mode", "unknown"] },
                    result: "$details.result",
                },
            },
            {
                $group: {
                    _id: "$mode",
                    matches: { $sum: 1 },
                    wins: { $sum: { $cond: [{ $eq: ["$result", "win"] }, 1, 0] } },
                    losses: { $sum: { $cond: [{ $eq: ["$result", "loss"] }, 1, 0] } },
                },
            },
            { $sort: { matches: -1 } },
        ]);
        const byGame = await Log_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    action: "GAME_END",
                    createdAt: { $gte: since },
                },
            },
            {
                $project: {
                    game: { $ifNull: ["$details.game", "unknown"] },
                    result: "$details.result",
                },
            },
            {
                $group: {
                    _id: "$game",
                    matches: { $sum: 1 },
                    wins: { $sum: { $cond: [{ $eq: ["$result", "win"] }, 1, 0] } },
                    losses: { $sum: { $cond: [{ $eq: ["$result", "loss"] }, 1, 0] } },
                },
            },
            { $sort: { matches: -1 } },
        ]);
        return { daily, byMode, byGame };
    }
    catch (e) {
        throw new Error("Error fetching stats history: " + e.message);
    }
};
exports.getStatsHistory = getStatsHistory;
