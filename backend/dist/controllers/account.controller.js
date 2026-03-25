"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatsHistoryController = exports.getLogsController = exports.listUsersController = exports.getUserController = exports.deleteAccountController = exports.updateAccountController = exports.createAccountController = void 0;
const account_service_1 = require("../services/account.service");
const params_1 = require("../utils/params");
const asErrorMessage = (error, fallback = "Unexpected server error") => {
    if (!error)
        return fallback;
    if (typeof error === "string")
        return error;
    if (typeof error?.message === "string")
        return error.message;
    try {
        return JSON.stringify(error);
    }
    catch {
        return fallback;
    }
};
const createAccountController = async (req, res) => {
    try {
        const userData = req.body;
        const user = await (0, account_service_1.createAccount)(userData);
        res.status(200).json(user);
    }
    catch (e) {
        if (e.name === "DuplicateAccount") {
            res.status(409).json({ message: e.message, code: 409 });
        }
        else {
            res.status(500).json({ message: asErrorMessage(e), code: 500 });
        }
    }
};
exports.createAccountController = createAccountController;
const updateAccountController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const userData = req.body;
        const user = await (0, account_service_1.updateAccount)(userId, userData);
        res.status(200).json(user);
    }
    catch (e) {
        res.status(500).json({ message: asErrorMessage(e), code: 500 });
    }
};
exports.updateAccountController = updateAccountController;
const deleteAccountController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        await (0, account_service_1.deleteAccount)(userId);
        res.status(200).json();
    }
    catch (e) {
        res.status(500).json({ message: asErrorMessage(e), code: 500 });
    }
};
exports.deleteAccountController = deleteAccountController;
const getUserController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const type = (0, params_1.asString)(req.query.type);
        const requesterId = (0, params_1.asString)(req.query.requesterId);
        const user = await (0, account_service_1.getUser)(userId, type, requesterId);
        res.status(200).json(user);
    }
    catch (e) {
        if (e.name === "UserNotFound") {
            res.status(404).json({ message: e.message, code: 404 });
        }
        else {
            res.status(500).json({ message: asErrorMessage(e), code: 500 });
        }
    }
};
exports.getUserController = getUserController;
const listUsersController = async (req, res) => {
    try {
        res.status(200).json(await (0, account_service_1.listAllUsers)());
    }
    catch (e) {
        res.status(500).json({ message: asErrorMessage(e), code: 500 });
    }
};
exports.listUsersController = listUsersController;
const getLogsController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const logs = await (0, account_service_1.getLogs)(userId);
        res.status(200).json(logs);
    }
    catch (e) {
        res.status(500).json({ message: asErrorMessage(e), code: 500 });
    }
};
exports.getLogsController = getLogsController;
const getStatsHistoryController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const days = parseInt((0, params_1.asString)(req.query.days), 10) || 30;
        const history = await (0, account_service_1.getStatsHistory)(userId, days);
        res.status(200).json(history);
    }
    catch (e) {
        res.status(500).json({ message: asErrorMessage(e), code: 500 });
    }
};
exports.getStatsHistoryController = getStatsHistoryController;
