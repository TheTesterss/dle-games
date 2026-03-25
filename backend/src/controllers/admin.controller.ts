import { Request, Response } from "express";
import {
    getGlobalStats,
    moderateUser,
    updateBadges,
    listAdmins,
    updateUserAdmin,
    updatePremiumAdmin,
    createPremiumGiftAdmin,
    getSystemLogs,
    getUserLogsAdmin
} from "../services/admin.service";
import { asString } from "../utils/params";

export const getGlobalStatsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = asString(req.params.id);
        const stats = await getGlobalStats(adminId);
        res.status(200).json(stats);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const moderateUserController = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = asString(req.params.id);
        const userId = asString(req.params.userId);
        const { desactivated } = req.body;
        const updated = await moderateUser(adminId, userId, desactivated);
        res.status(200).json(updated);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const updateBadgesController = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = asString(req.params.id);
        const userId = asString(req.params.userId);
        const badges = req.body?.badges || {};
        const updated = await updateBadges(adminId, userId, badges);
        res.status(200).json(updated);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const listAdminsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = asString(req.params.id);
        const admins = await listAdmins(adminId);
        res.status(200).json(admins);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const updateUserAdminController = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = asString(req.params.id);
        const userId = asString(req.params.userId);
        const updated = await updateUserAdmin(adminId, userId, req.body || {});
        res.status(200).json(updated);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const updatePremiumAdminController = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = asString(req.params.id);
        const userId = asString(req.params.userId);
        const updated = await updatePremiumAdmin(adminId, userId, req.body || {});
        res.status(200).json(updated);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const createPremiumGiftAdminController = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = asString(req.params.id);
        const { tier, durationDays, expiresInDays } = req.body || {};
        if (tier !== "games_one" && tier !== "games_plus") {
            res.status(400).json({ message: "Tier invalide", code: 400 });
            return;
        }
        const gift = await createPremiumGiftAdmin(
            adminId,
            tier,
            typeof durationDays === "number" ? durationDays : 30,
            typeof expiresInDays === "number" ? expiresInDays : 30
        );
        res.status(200).json({
            code: gift.code,
            tier: gift.tier,
            expiresAt: gift.expiresAt,
            durationDays: gift.durationDays
        });
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getSystemLogsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = asString(req.params.id);
        const logs = await getSystemLogs(adminId);
        res.status(200).json(logs);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getUserLogsAdminController = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = asString(req.params.id);
        const userId = asString(req.params.userId);
        const logs = await getUserLogsAdmin(adminId, userId);
        res.status(200).json(logs);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
