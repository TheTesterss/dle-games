"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequest = exports.getAllRequests = exports.cancelRequest = exports.createRequest = exports.denyRequest = exports.acceptRequest = void 0;
const FriendRequest_1 = __importDefault(require("../models/FriendRequest"));
const Friends_1 = __importDefault(require("../models/Friends"));
const acceptRequest = async (requestId) => {
    try {
        const request = await FriendRequest_1.default.findOne({ _id: requestId });
        if (!request) {
            throw new Error("Friend request not found");
        }
        await Friends_1.default.findOneAndUpdate({ user: request.from }, { $addToSet: { list: request.to } });
        await Friends_1.default.findOneAndUpdate({ user: request.to }, { $addToSet: { list: request.from } });
        await Friends_1.default.findOneAndUpdate({ user: request.to }, { $pull: { pending: requestId } });
        await Friends_1.default.findOneAndUpdate({ user: request.from }, { $pull: { pending: requestId } });
        await FriendRequest_1.default.findOneAndDelete({ _id: requestId });
        return { success: true };
    }
    catch (e) {
        throw new Error("Error accepting friend request: " + e.message);
    }
};
exports.acceptRequest = acceptRequest;
const denyRequest = async (requestId) => {
    try {
        const request = await FriendRequest_1.default.findOne({ _id: requestId });
        if (!request) {
            throw new Error("Friend request not found");
        }
        await Friends_1.default.findOneAndUpdate({ user: request.to }, { $pull: { pending: requestId } });
        await Friends_1.default.findOneAndUpdate({ user: request.from }, { $pull: { pending: requestId } });
        await FriendRequest_1.default.findOneAndDelete({ _id: requestId });
        return { success: true };
    }
    catch (e) {
        throw new Error("Error rejecting friend request: " + e.message);
    }
};
exports.denyRequest = denyRequest;
const createRequest = async (fromUserId, toUserId) => {
    try {
        const newRequest = new FriendRequest_1.default({
            from: fromUserId,
            to: toUserId,
        });
        await newRequest.save();
        await Friends_1.default.findOneAndUpdate({ user: toUserId }, { $addToSet: { pending: newRequest._id } });
        return newRequest;
    }
    catch (e) {
        throw new Error("Error creating friend request: " + e.message);
    }
};
exports.createRequest = createRequest;
const cancelRequest = async (requestId) => {
    try {
        const request = await FriendRequest_1.default.findOne({ _id: requestId });
        if (!request) {
            throw new Error("Friend request not found");
        }
        await Friends_1.default.findOneAndUpdate({ user: request.to }, { $pull: { pending: requestId } });
        await Friends_1.default.findOneAndUpdate({ user: request.from }, { $pull: { pending: requestId } });
        await FriendRequest_1.default.findOneAndDelete({ _id: requestId });
        return { success: true };
    }
    catch (e) {
        throw new Error("Error deleting friend request: " + e.message);
    }
};
exports.cancelRequest = cancelRequest;
const getAllRequests = async () => {
    try {
        const requests = await FriendRequest_1.default.find({});
        return requests;
    }
    catch (e) {
        throw new Error("Error fetching all friend requests: " + e.message);
    }
};
exports.getAllRequests = getAllRequests;
const getRequest = async (requestId) => {
    try {
        const request = await FriendRequest_1.default.findOne({ _id: requestId });
        if (!request) {
            throw new Error("Friend request not found");
        }
        return request;
    }
    catch (e) {
        throw new Error("Error fetching friend request: " + e.message);
    }
};
exports.getRequest = getRequest;
