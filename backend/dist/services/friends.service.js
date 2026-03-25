"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRequests = exports.deleteFriend = exports.getUser = exports.listFriends = void 0;
const Friends_1 = __importDefault(require("../models/Friends"));
const Account_1 = __importDefault(require("../models/Account"));
const listFriends = async (userId) => {
    try {
        let friendsRecord = await Friends_1.default.findOne({ user: userId });
        if (!friendsRecord) {
            friendsRecord = await Friends_1.default.create({ user: userId, pending: [], list: [] });
        }
        return friendsRecord;
    }
    catch (e) {
        throw new Error("Error listing friends: " + e.message);
    }
};
exports.listFriends = listFriends;
const getUser = async (userId) => {
    try {
        const user = await Account_1.default.findOne({
            _id: userId,
            desactivated: false,
        });
        if (!user) {
            throw new Error("User not found or deactivated");
        }
        return user;
    }
    catch (e) {
        throw new Error("Error fetching user info: " + e.message);
    }
};
exports.getUser = getUser;
const deleteFriend = async (userId1, userId2) => {
    try {
        await Friends_1.default.findOneAndUpdate({ user: userId1 }, { $pull: { list: userId2 } });
        await Friends_1.default.findOneAndUpdate({ user: userId2 }, { $pull: { list: userId1 } });
        return { success: true };
    }
    catch (e) {
        throw new Error("Error removing friend: " + e.message);
    }
};
exports.deleteFriend = deleteFriend;
const listRequests = async (userId) => {
    try {
        let friendsRecord = await Friends_1.default.findOne({ user: userId });
        if (!friendsRecord) {
            friendsRecord = await Friends_1.default.create({ user: userId, pending: [], list: [] });
        }
        return friendsRecord.pending;
    }
    catch (e) {
        throw new Error("Error listing friend requests: " + e.message);
    }
};
exports.listRequests = listRequests;
