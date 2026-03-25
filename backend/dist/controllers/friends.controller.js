"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestsController = exports.getFriendsController = exports.getFriendController = exports.deleteFriendController = void 0;
const friends_service_1 = require("../services/friends.service");
const params_1 = require("../utils/params");
const deleteFriendController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const { target } = req.body;
        const d = await (0, friends_service_1.deleteFriend)(userId, target);
        res.status(200).json(d);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.deleteFriendController = deleteFriendController;
const getFriendController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const { target } = req.body;
        const f = await (0, friends_service_1.listFriends)(userId);
        const d = f.list.find((friend) => friend._id.toString() === target);
        res.status(200).json(d);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getFriendController = getFriendController;
const getFriendsController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const d = await (0, friends_service_1.listFriends)(userId);
        res.status(200).json(d.list || []);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getFriendsController = getFriendsController;
const getRequestsController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const d = await (0, friends_service_1.listRequests)(userId);
        res.status(200).json(d || []);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getRequestsController = getRequestsController;
