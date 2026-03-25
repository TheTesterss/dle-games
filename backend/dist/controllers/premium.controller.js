"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimGiftController = exports.getGiftStatusController = exports.createGiftController = void 0;
const premium_service_1 = require("../services/premium.service");
const params_1 = require("../utils/params");
const createGiftController = async (req, res) => {
    try {
        const { userId, tier, durationDays, expiresInDays } = req.body || {};
        if (!userId || !tier) {
            res.status(400).json({ message: "Parametres manquants", code: 400 });
            return;
        }
        const gift = await (0, premium_service_1.createGift)(userId, tier, durationDays || 30, typeof expiresInDays === "number" ? expiresInDays : 30);
        res.status(200).json({
            code: gift.code,
            tier: gift.tier,
            expiresAt: gift.expiresAt,
            durationDays: gift.durationDays
        });
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.createGiftController = createGiftController;
const getGiftStatusController = async (req, res) => {
    try {
        const code = (0, params_1.asString)(req.params.code);
        const status = await (0, premium_service_1.getGiftStatus)(code);
        if (status.status === "invalid") {
            res.status(404).json({ status: "invalid" });
            return;
        }
        res.status(200).json({
            status: status.status,
            gift: {
                tier: status.gift?.tier,
                expiresAt: status.gift?.expiresAt,
                claimedAt: status.gift?.claimedAt
            }
        });
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getGiftStatusController = getGiftStatusController;
const claimGiftController = async (req, res) => {
    try {
        const code = (0, params_1.asString)(req.params.code);
        const { userId } = req.body || {};
        if (!userId) {
            res.status(400).json({ status: "invalid" });
            return;
        }
        const result = await (0, premium_service_1.claimGift)(code, userId);
        if (!result.ok) {
            res.status(409).json({ status: result.status });
            return;
        }
        res.status(200).json({ status: "claimed" });
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.claimGiftController = claimGiftController;
