import { Request, Response } from "express";
import { createGift, getGiftStatus, claimGift } from "../services/premium.service";
import { asString } from "../utils/params";

export const createGiftController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, tier, durationDays, expiresInDays } = req.body || {};
        if (!userId || !tier) {
            res.status(400).json({ message: "Parametres manquants", code: 400 });
            return;
        }
        const gift = await createGift(userId, tier, durationDays || 30, typeof expiresInDays === "number" ? expiresInDays : 30);
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

export const getGiftStatusController = async (req: Request, res: Response): Promise<void> => {
    try {
        const code = asString(req.params.code);
        const status = await getGiftStatus(code);
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
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const claimGiftController = async (req: Request, res: Response): Promise<void> => {
    try {
        const code = asString(req.params.code);
        const { userId } = req.body || {};
        if (!userId) {
            res.status(400).json({ status: "invalid" });
            return;
        }
        const result = await claimGift(code, userId);
        if (!result.ok) {
            res.status(409).json({ status: result.status });
            return;
        }
        res.status(200).json({ status: "claimed" });
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
