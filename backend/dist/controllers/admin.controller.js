"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserLogsAdminController = exports.getSystemLogsController = exports.createPremiumGiftAdminController = exports.updatePremiumAdminController = exports.updateUserAdminController = exports.listAdminsController = exports.updateBadgesController = exports.moderateUserController = exports.getGlobalStatsController = void 0;
const admin_service_1 = require("../services/admin.service");
const params_1 = require("../utils/params");
const getGlobalStatsController = async (req, res) => {
    try {
        const adminId = (0, params_1.asString)(req.params.id);
        const stats = await (0, admin_service_1.getGlobalStats)(adminId);
        res.status(200).json(stats);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getGlobalStatsController = getGlobalStatsController;
const moderateUserController = async (req, res) => {
    try {
        const adminId = (0, params_1.asString)(req.params.id);
        const userId = (0, params_1.asString)(req.params.userId);
        const { desactivated } = req.body;
        const updated = await (0, admin_service_1.moderateUser)(adminId, userId, desactivated);
        res.status(200).json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.moderateUserController = moderateUserController;
const updateBadgesController = async (req, res) => {
    try {
        const adminId = (0, params_1.asString)(req.params.id);
        const userId = (0, params_1.asString)(req.params.userId);
        const badges = req.body?.badges || {};
        const updated = await (0, admin_service_1.updateBadges)(adminId, userId, badges);
        res.status(200).json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.updateBadgesController = updateBadgesController;
const listAdminsController = async (req, res) => {
    try {
        const adminId = (0, params_1.asString)(req.params.id);
        const admins = await (0, admin_service_1.listAdmins)(adminId);
        res.status(200).json(admins);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.listAdminsController = listAdminsController;
const updateUserAdminController = async (req, res) => {
    try {
        const adminId = (0, params_1.asString)(req.params.id);
        const userId = (0, params_1.asString)(req.params.userId);
        const updated = await (0, admin_service_1.updateUserAdmin)(adminId, userId, req.body || {});
        res.status(200).json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.updateUserAdminController = updateUserAdminController;
const updatePremiumAdminController = async (req, res) => {
    try {
        const adminId = (0, params_1.asString)(req.params.id);
        const userId = (0, params_1.asString)(req.params.userId);
        const updated = await (0, admin_service_1.updatePremiumAdmin)(adminId, userId, req.body || {});
        res.status(200).json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.updatePremiumAdminController = updatePremiumAdminController;
const createPremiumGiftAdminController = async (req, res) => {
    try {
        const adminId = (0, params_1.asString)(req.params.id);
        const { tier, durationDays, expiresInDays } = req.body || {};
        if (tier !== "games_one" && tier !== "games_plus") {
            res.status(400).json({ message: "Tier invalide", code: 400 });
            return;
        }
        const gift = await (0, admin_service_1.createPremiumGiftAdmin)(adminId, tier, typeof durationDays === "number" ? durationDays : 30, typeof expiresInDays === "number" ? expiresInDays : 30);
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
exports.createPremiumGiftAdminController = createPremiumGiftAdminController;
const getSystemLogsController = async (req, res) => {
    try {
        const adminId = (0, params_1.asString)(req.params.id);
        const logs = await (0, admin_service_1.getSystemLogs)(adminId);
        res.status(200).json(logs);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getSystemLogsController = getSystemLogsController;
const getUserLogsAdminController = async (req, res) => {
    try {
        const adminId = (0, params_1.asString)(req.params.id);
        const userId = (0, params_1.asString)(req.params.userId);
        const logs = await (0, admin_service_1.getUserLogsAdmin)(adminId, userId);
        res.status(200).json(logs);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getUserLogsAdminController = getUserLogsAdminController;
