import AccountModel from "../models/Account";
import ForumModel from "../models/Forum";
import FriendRequestModel from "../models/FriendRequest";
import FriendsModel from "../models/Friends";
import LogModel from "../models/Log";
import { IAccount } from "../types";
import { createGift } from "./premium.service";

export const getAdminUser = async (adminId: string): Promise<IAccount> => {
    const admin = await AccountModel.findById(adminId);
    if (!admin) throw new Error("Admin introuvable");
    if (!admin.badges?.admin && !admin.badges?.owner && admin.name !== "admin") {
        throw new Error("Accès refusé");
    }
    return admin;
};

export const getGlobalStats = async (adminId: string): Promise<any> => {
    await getAdminUser(adminId);

    const now = new Date();
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalAccounts,
        activeAccounts,
        moderatedAccounts,
        totalAdmins,
        totalOwners,
        totalVerified,
        totalPremium,
        totalPosts,
        totalReposts,
        totalPostsLast7,
        totalFriendRequests,
    ] = await Promise.all([
        AccountModel.countDocuments({}),
        AccountModel.countDocuments({ desactivated: false }),
        AccountModel.countDocuments({ desactivated: true }),
        AccountModel.countDocuments({ "badges.admin": true }),
        AccountModel.countDocuments({ "badges.owner": true }),
        AccountModel.countDocuments({ "badges.verified": true }),
        AccountModel.countDocuments({ "badges.premium": true }),
        ForumModel.countDocuments({}),
        ForumModel.countDocuments({ repostOf: { $ne: null } }),
        ForumModel.countDocuments({ createdAt: { $gte: last7 } }),
        FriendRequestModel.countDocuments({}),
    ]);

    const commentsAgg = await ForumModel.aggregate([
        { $project: { count: { $size: "$comments" } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    const likesAgg = await ForumModel.aggregate([
        { $project: { count: { $size: "$likes" } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    const friendsAgg = await FriendsModel.aggregate([
        { $project: { count: { $size: "$list" } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    const postsPerDay = await ForumModel.aggregate([
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

export const moderateUser = async (adminId: string, userId: string, desactivated: boolean): Promise<IAccount> => {
    await getAdminUser(adminId);
    const updated = await AccountModel.findByIdAndUpdate(
        userId,
        { $set: { desactivated: !!desactivated } },
        { new: true },
    );
    if (!updated) throw new Error("Utilisateur introuvable");
    return updated;
};

export const updateBadges = async (adminId: string, userId: string, badgesUpdate: any): Promise<IAccount> => {
    const admin = await getAdminUser(adminId);
    const isOwner = admin.badges?.owner || admin.name === "admin";

    const allowed: any = {};
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

    const updated = await AccountModel.findByIdAndUpdate(
        userId,
        { $set: allowed },
        { new: true },
    );
    if (!updated) throw new Error("Utilisateur introuvable");
    return updated;
};

export const listAdmins = async (adminId: string): Promise<IAccount[]> => {
    await getAdminUser(adminId);
    return await AccountModel.find({
        $or: [{ "badges.admin": true }, { "badges.owner": true }],
    });
};

export const updateUserAdmin = async (adminId: string, userId: string, payload: any): Promise<IAccount> => {
    await getAdminUser(adminId);
    const update: any = {};
    if (typeof payload?.name === "string") update.name = payload.name;
    if (typeof payload?.avatar === "string") update.avatar = payload.avatar;
    if (!update.name && !update.avatar) {
        throw new Error("Aucune donnée à mettre à jour");
    }
    const updated = await AccountModel.findByIdAndUpdate(
        userId,
        { $set: update },
        { new: true },
    );
    if (!updated) throw new Error("Utilisateur introuvable");
    return updated;
};

export const updatePremiumAdmin = async (adminId: string, userId: string, payload: any): Promise<IAccount> => {
    await getAdminUser(adminId);

    const tier = payload?.tier;
    const untilRaw = payload?.until;

    const update: any = {};
    if (tier === "games_one" || tier === "games_plus" || tier === null) {
        update.premiumTier = tier;
    }

    if (typeof untilRaw === "string") {
        const date = new Date(untilRaw);
        if (!Number.isNaN(date.getTime())) {
            update.premiumUntil = date;
        }
    } else if (untilRaw === null) {
        update.premiumUntil = null;
    }

    if (payload?.clear === true) {
        update.premiumTier = null;
        update.premiumUntil = null;
        update.premiumGrantedBy = null;
        update["badges.premium"] = false;
        update.banner = null;
    } else if (update.premiumTier) {
        update["badges.premium"] = true;
        update.premiumGrantedBy = adminId;
    }

    const updated = await AccountModel.findByIdAndUpdate(
        userId,
        { $set: update },
        { new: true },
    );
    if (!updated) throw new Error("Utilisateur introuvable");
    return updated;
};

export const getSystemLogs = async (adminId: string): Promise<any[]> => {
    await getAdminUser(adminId);
    return await LogModel.find({}).sort({ createdAt: -1 }).limit(100).populate('userId', 'name').populate('targetId', 'name');
};

export const getUserLogsAdmin = async (adminId: string, userId: string): Promise<any[]> => {
    await getAdminUser(adminId);
    return await LogModel.find({ userId }).sort({ createdAt: -1 }).limit(100);
};

export const createPremiumGiftAdmin = async (
    adminId: string,
    tier: "games_one" | "games_plus",
    durationDays: number = 30,
    expiresInDays: number | null = 30
) => {
    await getAdminUser(adminId);
    return await createGift(adminId, tier, durationDays, expiresInDays);
};
