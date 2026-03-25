import PremiumGiftModel, { IPremiumGift } from "../models/PremiumGift";
import AccountModel from "../models/Account";
import LogModel from "../models/Log";
import { Types } from "mongoose";

const generateCode = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 16; i += 1) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
};

const calcExpiry = (days?: number | null) => {
    if (!days) return null;
    const now = new Date();
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
};

export const createGift = async (
    userId: string,
    tier: "games_one" | "games_plus",
    durationDays: number = 30,
    expiresInDays: number | null = 30
): Promise<IPremiumGift> => {
    const code = generateCode();
    const gift = new PremiumGiftModel({
        code,
        tier,
        createdBy: new Types.ObjectId(userId),
        expiresAt: calcExpiry(expiresInDays),
        durationDays
    });
    const saved = await gift.save();
    try {
        await LogModel.create({
            userId: new Types.ObjectId(userId),
            action: "PREMIUM_GIFT_CREATED",
            details: {
                code,
                tier,
                durationDays,
                expiresAt: saved.expiresAt
            },
            level: "info"
        });
    } catch (err) {
        console.error("Error logging premium gift creation:", err);
    }
    return saved;
};

export const getGiftStatus = async (code: string) => {
    const gift = await PremiumGiftModel.findOne({ code }).lean();
    if (!gift) return { status: "invalid" };
    const now = new Date();
    if (gift.expiresAt && new Date(gift.expiresAt).getTime() <= now.getTime()) {
        return { status: "expired", gift };
    }
    if (gift.claimedBy) {
        return { status: "claimed", gift };
    }
    return { status: "active", gift };
};

export const claimGift = async (code: string, userId: string) => {
    const now = new Date();
    const gift = await PremiumGiftModel.findOneAndUpdate(
        {
            code,
            claimedBy: null,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
        },
        {
            $set: { claimedBy: new Types.ObjectId(userId), claimedAt: now }
        },
        { new: true }
    );

    if (!gift) {
        const status = await getGiftStatus(code);
        return { ok: false, status: status.status };
    }

    const tier = gift.tier;
    const durationDays = gift.durationDays || 30;
    const user = await AccountModel.findById(userId);
    if (!user) return { ok: false, status: "invalid" };

    const currentUntil = user.premiumUntil ? new Date(user.premiumUntil) : null;
    const base = currentUntil && currentUntil > now ? currentUntil : now;
    const newUntil = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);

    user.premiumTier = tier;
    user.premiumUntil = newUntil;
    user.badges = { ...user.badges, premium: true };
    await user.save();

    try {
        await LogModel.create({
            userId: new Types.ObjectId(userId),
            action: "PREMIUM_GIFT_CLAIMED",
            targetId: gift.createdBy ? new Types.ObjectId(gift.createdBy) : undefined,
            details: {
                code,
                tier,
                durationDays,
                expiresAt: gift.expiresAt,
                claimedAt: now
            },
            level: "info"
        });
        if (gift.createdBy) {
            await LogModel.create({
                userId: new Types.ObjectId(gift.createdBy),
                action: "PREMIUM_GIFT_REDEEMED",
                targetId: new Types.ObjectId(userId),
                details: {
                    code,
                    tier,
                    durationDays,
                    claimedAt: now
                },
                level: "info"
            });
        }
    } catch (err) {
        console.error("Error logging premium gift claim:", err);
    }

    return { ok: true, status: "claimed", gift };
};
