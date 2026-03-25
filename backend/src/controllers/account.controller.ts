import { Request, Response } from "express";
import {
    createAccount,
    deleteAccount,
    getUser,
    listAllUsers,
    updateAccount,
    getLogs,
    getStatsHistory,
} from "../services/account.service";
import { asString } from "../utils/params";

const asErrorMessage = (error: any, fallback = "Unexpected server error"): string => {
    if (!error) return fallback;
    if (typeof error === "string") return error;
    if (typeof error?.message === "string") return error.message;
    try {
        return JSON.stringify(error);
    } catch {
        return fallback;
    }
};

export const createAccountController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userData = req.body;
        const user = await createAccount(userData);
        res.status(200).json(user);
    } catch (e: any) {
        if (e.name === "DuplicateAccount") {
            res.status(409).json({ message: e.message, code: 409 });
        } else {
            res.status(500).json({ message: asErrorMessage(e), code: 500 });
        }
    }
};

export const updateAccountController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const userData = req.body;
        const user = await updateAccount(userId, userData);
        res.status(200).json(user);
    } catch (e: any) {
        res.status(500).json({ message: asErrorMessage(e), code: 500 });
    }
};

export const deleteAccountController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        await deleteAccount(userId);
        res.status(200).json();
    } catch (e: any) {
        res.status(500).json({ message: asErrorMessage(e), code: 500 });
    }
};

export const getUserController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const type = asString(req.query.type);
        const requesterId = asString(req.query.requesterId);
        const user = await getUser(userId, type, requesterId);
        res.status(200).json(user);
    } catch (e: any) {
        if (e.name === "UserNotFound") {
            res.status(404).json({ message: e.message, code: 404 });
        } else {
            res.status(500).json({ message: asErrorMessage(e), code: 500 });
        }
    }
};

export const listUsersController = async (req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json(await listAllUsers());
    } catch (e: any) {
        res.status(500).json({ message: asErrorMessage(e), code: 500 });
    }
};

export const getLogsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const logs = await getLogs(userId);
        res.status(200).json(logs);
    } catch (e: any) {
        res.status(500).json({ message: asErrorMessage(e), code: 500 });
    }
};

export const getStatsHistoryController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const days = parseInt(asString(req.query.days), 10) || 30;
        const history = await getStatsHistory(userId, days);
        res.status(200).json(history);
    } catch (e: any) {
        res.status(500).json({ message: asErrorMessage(e), code: 500 });
    }
};
