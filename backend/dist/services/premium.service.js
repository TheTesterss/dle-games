"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimGift = exports.getGiftStatus = exports.createGift = void 0;
const PremiumGift_1 = __importDefault(require("../models/PremiumGift"));
const Account_1 = __importDefault(require("../models/Account"));
const Log_1 = __importDefault(require("../models/Log"));
const mongoose_1 = require("mongoose");
const generateCode = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 16; i += 1) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
};
const calcExpiry = (days) => {
    if (!days)
        return null;
    const now = new Date();
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
};
const createGift = async (userId, tier, durationDays = 30, expiresInDays = 30) => {
    const code = generateCode();
    const gift = new PremiumGift_1.default({
        code,
        tier,
        createdBy: new mongoose_1.Types.ObjectId(userId),
        expiresAt: calcExpiry(expiresInDays),
        durationDays
    });
    const saved = await gift.save();
    try {
        await Log_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            action: "PREMIUM_GIFT_CREATED",
            details: {
                code,
                tier,
                durationDays,
                expiresAt: saved.expiresAt
            },
            level: "info"
        });
    }
    catch (err) {
        console.error("Error logging premium gift creation:", err);
    }
    return saved;
};
exports.createGift = createGift;
const getGiftStatus = async (code) => {
    const gift = await PremiumGift_1.default.findOne({ code }).lean();
    if (!gift)
        return { status: "invalid" };
    const now = new Date();
    if (gift.expiresAt && new Date(gift.expiresAt).getTime() <= now.getTime()) {
        return { status: "expired", gift };
    }
    if (gift.claimedBy) {
        return { status: "claimed", gift };
    }
    return { status: "active", gift };
};
exports.getGiftStatus = getGiftStatus;
const claimGift = async (code, userId) => {
    const now = new Date();
    const gift = await PremiumGift_1.default.findOneAndUpdate({
        code,
        claimedBy: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    }, {
        $set: { claimedBy: new mongoose_1.Types.ObjectId(userId), claimedAt: now }
    }, { new: true });
    if (!gift) {
        const status = await (0, exports.getGiftStatus)(code);
        return { ok: false, status: status.status };
    }
    const tier = gift.tier;
    const durationDays = gift.durationDays || 30;
    const user = await Account_1.default.findById(userId);
    if (!user)
        return { ok: false, status: "invalid" };
    const currentUntil = user.premiumUntil ? new Date(user.premiumUntil) : null;
    const base = currentUntil && currentUntil > now ? currentUntil : now;
    const newUntil = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);
    user.premiumTier = tier;
    user.premiumUntil = newUntil;
    user.badges = { ...user.badges, premium: true };
    await user.save();
    try {
        await Log_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            action: "PREMIUM_GIFT_CLAIMED",
            targetId: gift.createdBy ? new mongoose_1.Types.ObjectId(gift.createdBy) : undefined,
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
            await Log_1.default.create({
                userId: new mongoose_1.Types.ObjectId(gift.createdBy),
                action: "PREMIUM_GIFT_REDEEMED",
                targetId: new mongoose_1.Types.ObjectId(userId),
                details: {
                    code,
                    tier,
                    durationDays,
                    claimedAt: now
                },
                level: "info"
            });
        }
    }
    catch (err) {
        console.error("Error logging premium gift claim:", err);
    }
    return { ok: true, status: "claimed", gift };
};
exports.claimGift = claimGift;
