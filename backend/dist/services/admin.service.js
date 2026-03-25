"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPremiumGiftAdmin = exports.getUserLogsAdmin = exports.getSystemLogs = exports.updatePremiumAdmin = exports.updateUserAdmin = exports.listAdmins = exports.updateBadges = exports.moderateUser = exports.getGlobalStats = exports.getAdminUser = void 0;
const Account_1 = __importDefault(require("../models/Account"));
const Forum_1 = __importDefault(require("../models/Forum"));
const FriendRequest_1 = __importDefault(require("../models/FriendRequest"));
const Friends_1 = __importDefault(require("../models/Friends"));
const Log_1 = __importDefault(require("../models/Log"));
const premium_service_1 = require("./premium.service");
const getAdminUser = async (adminId) => {
    const admin = await Account_1.default.findById(adminId);
    if (!admin)
        throw new Error("Admin introuvable");
    if (!admin.badges?.admin && !admin.badges?.owner && admin.name !== "admin") {
        throw new Error("Accès refusé");
    }
    return admin;
};
exports.getAdminUser = getAdminUser;
const getGlobalStats = async (adminId) => {
    await (0, exports.getAdminUser)(adminId);
    const now = new Date();
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [totalAccounts, activeAccounts, moderatedAccounts, totalAdmins, totalOwners, totalVerified, totalPremium, totalPosts, totalReposts, totalPostsLast7, totalFriendRequests,] = await Promise.all([
        Account_1.default.countDocuments({}),
        Account_1.default.countDocuments({ desactivated: false }),
        Account_1.default.countDocuments({ desactivated: true }),
        Account_1.default.countDocuments({ "badges.admin": true }),
        Account_1.default.countDocuments({ "badges.owner": true }),
        Account_1.default.countDocuments({ "badges.verified": true }),
        Account_1.default.countDocuments({ "badges.premium": true }),
        Forum_1.default.countDocuments({}),
        Forum_1.default.countDocuments({ repostOf: { $ne: null } }),
        Forum_1.default.countDocuments({ createdAt: { $gte: last7 } }),
        FriendRequest_1.default.countDocuments({}),
    ]);
    const commentsAgg = await Forum_1.default.aggregate([
        { $project: { count: { $size: "$comments" } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
    ]);
    const likesAgg = await Forum_1.default.aggregate([
        { $project: { count: { $size: "$likes" } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
    ]);
    const friendsAgg = await Friends_1.default.aggregate([
        { $project: { count: { $size: "$list" } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
    ]);
    const postsPerDay = await Forum_1.default.aggregate([
        { $match: { createdAt: { $gte: last7 } } },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                total: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    return {
        totals: {
            accounts: totalAccounts,
            activeAccounts,
            moderatedAccounts,
            admins: totalAdmins,
            owners: totalOwners,
            verified: totalVerified,
            premium: totalPremium,
            posts: totalPosts,
            reposts: totalReposts,
            comments: commentsAgg[0]?.total || 0,
            likes: likesAgg[0]?.total || 0,
            friendRequests: totalFriendRequests,
            friends: friendsAgg[0]?.total || 0,
        },
        recent: {
            postsLast7: totalPostsLast7,
            postsPerDay,
        },
    };
};
exports.getGlobalStats = getGlobalStats;
const moderateUser = async (adminId, userId, desactivated) => {
    await (0, exports.getAdminUser)(adminId);
    const updated = await Account_1.default.findByIdAndUpdate(userId, { $set: { desactivated: !!desactivated } }, { new: true });
    if (!updated)
        throw new Error("Utilisateur introuvable");
    return updated;
};
exports.moderateUser = moderateUser;
const updateBadges = async (adminId, userId, badgesUpdate) => {
    const admin = await (0, exports.getAdminUser)(adminId);
    const isOwner = admin.badges?.owner || admin.name === "admin";
    const allowed = {};
    if (typeof badgesUpdate?.verified === "boolean") {
        allowed["badges.verified"] = badgesUpdate.verified;
    }
    if (typeof badgesUpdate?.premium === "boolean") {
        allowed["badges.premium"] = badgesUpdate.premium;
    }
    if (typeof badgesUpdate?.ranking?.tier === "string") {
        allowed["badges.ranking.tier"] = badgesUpdate.ranking.tier;
        allowed["badges.ranking.dailyCheck"] = true;
    }
    if (typeof badgesUpdate?.ranking?.top10 === "boolean") {
        allowed["badges.ranking.top10"] = badgesUpdate.ranking.top10;
        allowed["badges.ranking.dailyCheck"] = true;
    }
    if (isOwner) {
        if (typeof badgesUpdate?.admin === "boolean") {
            allowed["badges.admin"] = badgesUpdate.admin;
        }
        if (typeof badgesUpdate?.owner === "boolean") {
            allowed["badges.owner"] = badgesUpdate.owner;
        }
    }
    const updated = await Account_1.default.findByIdAndUpdate(userId, { $set: allowed }, { new: true });
    if (!updated)
        throw new Error("Utilisateur introuvable");
    return updated;
};
exports.updateBadges = updateBadges;
const listAdmins = async (adminId) => {
    await (0, exports.getAdminUser)(adminId);
    return await Account_1.default.find({
        $or: [{ "badges.admin": true }, { "badges.owner": true }],
    });
};
exports.listAdmins = listAdmins;
const updateUserAdmin = async (adminId, userId, payload) => {
    await (0, exports.getAdminUser)(adminId);
    const update = {};
    if (typeof payload?.name === "string")
        update.name = payload.name;
    if (typeof payload?.avatar === "string")
        update.avatar = payload.avatar;
    if (!update.name && !update.avatar) {
        throw new Error("Aucune donnée à mettre à jour");
    }
    const updated = await Account_1.default.findByIdAndUpdate(userId, { $set: update }, { new: true });
    if (!updated)
        throw new Error("Utilisateur introuvable");
    return updated;
};
exports.updateUserAdmin = updateUserAdmin;
const updatePremiumAdmin = async (adminId, userId, payload) => {
    await (0, exports.getAdminUser)(adminId);
    const tier = payload?.tier;
    const untilRaw = payload?.until;
    const update = {};
    if (tier === "games_one" || tier === "games_plus" || tier === null) {
        update.premiumTier = tier;
    }
    if (typeof untilRaw === "string") {
        const date = new Date(untilRaw);
        if (!Number.isNaN(date.getTime())) {
            update.premiumUntil = date;
        }
    }
    else if (untilRaw === null) {
        update.premiumUntil = null;
    }
    if (payload?.clear === true) {
        update.premiumTier = null;
        update.premiumUntil = null;
        update.premiumGrantedBy = null;
        update["badges.premium"] = false;
        update.banner = null;
    }
    else if (update.premiumTier) {
        update["badges.premium"] = true;
        update.premiumGrantedBy = adminId;
    }
    const updated = await Account_1.default.findByIdAndUpdate(userId, { $set: update }, { new: true });
    if (!updated)
        throw new Error("Utilisateur introuvable");
    return updated;
};
exports.updatePremiumAdmin = updatePremiumAdmin;
const getSystemLogs = async (adminId) => {
    await (0, exports.getAdminUser)(adminId);
    return await Log_1.default.find({}).sort({ createdAt: -1 }).limit(100).populate('userId', 'name').populate('targetId', 'name');
};
exports.getSystemLogs = getSystemLogs;
const getUserLogsAdmin = async (adminId, userId) => {
    await (0, exports.getAdminUser)(adminId);
    return await Log_1.default.find({ userId }).sort({ createdAt: -1 }).limit(100);
};
exports.getUserLogsAdmin = getUserLogsAdmin;
const createPremiumGiftAdmin = async (adminId, tier, durationDays = 30, expiresInDays = 30) => {
    await (0, exports.getAdminUser)(adminId);
    return await (0, premium_service_1.createGift)(adminId, tier, durationDays, expiresInDays);
};
exports.createPremiumGiftAdmin = createPremiumGiftAdmin;
