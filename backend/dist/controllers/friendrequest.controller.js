"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestController = exports.getAllRequestsController = exports.createRequestController = exports.cancelRequestController = exports.denyRequestController = exports.acceptRequestController = void 0;
const friendrequest_service_1 = require("../services/friendrequest.service");
const params_1 = require("../utils/params");
const acceptRequestController = async (req, res) => {
    try {
        const reqId = (0, params_1.asString)(req.params.id);
        const d = await (0, friendrequest_service_1.acceptRequest)(reqId);
        res.status(200).json(d);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.acceptRequestController = acceptRequestController;
const denyRequestController = async (req, res) => {
    try {
        const reqId = (0, params_1.asString)(req.params.id);
        const d = await (0, friendrequest_service_1.denyRequest)(reqId);
        res.status(200).json(d);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.denyRequestController = denyRequestController;
const cancelRequestController = async (req, res) => {
    try {
        const reqId = (0, params_1.asString)(req.params.id);
        const d = await (0, friendrequest_service_1.cancelRequest)(reqId);
        res.status(200).json(d);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.cancelRequestController = cancelRequestController;
const createRequestController = async (req, res) => {
    try {
        const { from, to } = req.body;
        const d = await (0, friendrequest_service_1.createRequest)(from, to);
        res.status(200).json(d);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.createRequestController = createRequestController;
const getAllRequestsController = async (req, res) => {
    try {
        const requests = await (0, friendrequest_service_1.getAllRequests)();
        res.status(200).json(requests);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getAllRequestsController = getAllRequestsController;
const getRequestController = async (req, res) => {
    try {
        const reqId = (0, params_1.asString)(req.params.id);
        const request = await (0, friendrequest_service_1.getRequest)(reqId);
        res.status(200).json(request);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getRequestController = getRequestController;
