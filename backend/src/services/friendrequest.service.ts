import FriendRequestModel, { IFriendRequest } from "../models/FriendRequest";
import FriendsModel from "../models/Friends";
import { Types } from "mongoose";

export const acceptRequest = async (requestId: string): Promise<{ success: boolean }> => {
    try {
        const request = await FriendRequestModel.findOne({ _id: requestId });

        if (!request) {
            throw new Error("Friend request not found");
        }

        await FriendsModel.findOneAndUpdate(
            { user: request.from },
            { $addToSet: { list: request.to } },
        );

        await FriendsModel.findOneAndUpdate(
            { user: request.to },
            { $addToSet: { list: request.from } },
        );

        await FriendsModel.findOneAndUpdate(
            { user: request.to },
            { $pull: { pending: requestId } },
        );

        await FriendsModel.findOneAndUpdate(
            { user: request.from },
            { $pull: { pending: requestId } },
        );

        await FriendRequestModel.findOneAndDelete({ _id: requestId });

        return { success: true };
    } catch (e: any) {
        throw new Error("Error accepting friend request: " + e.message);
    }
};

export const denyRequest = async (requestId: string): Promise<{ success: boolean }> => {
    try {
        const request = await FriendRequestModel.findOne({ _id: requestId });

        if (!request) {
            throw new Error("Friend request not found");
        }

        await FriendsModel.findOneAndUpdate(
            { user: request.to },
            { $pull: { pending: requestId } },
        );
        await FriendsModel.findOneAndUpdate(
            { user: request.from },
            { $pull: { pending: requestId } },
        );

        await FriendRequestModel.findOneAndDelete({ _id: requestId });

        return { success: true };
    } catch (e: any) {
        throw new Error("Error rejecting friend request: " + e.message);
    }
};

export const createRequest = async (fromUserId: string, toUserId: string): Promise<IFriendRequest> => {
    try {
        const newRequest = new FriendRequestModel({
            from: fromUserId,
            to: toUserId,
        });

        await newRequest.save();
        await FriendsModel.findOneAndUpdate(
            { user: toUserId },
            { $addToSet: { pending: newRequest._id } },
        );

        return newRequest;
    } catch (e: any) {
        throw new Error("Error creating friend request: " + e.message);
    }
};

export const cancelRequest = async (requestId: string): Promise<{ success: boolean }> => {
    try {
        const request = await FriendRequestModel.findOne({ _id: requestId });

        if (!request) {
            throw new Error("Friend request not found");
        }

        await FriendsModel.findOneAndUpdate(
            { user: request.to },
            { $pull: { pending: requestId } },
        );
        await FriendsModel.findOneAndUpdate(
            { user: request.from },
            { $pull: { pending: requestId } },
        );

        await FriendRequestModel.findOneAndDelete({ _id: requestId });

        return { success: true };
    } catch (e: any) {
        throw new Error("Error deleting friend request: " + e.message);
    }
};

export const getAllRequests = async (): Promise<IFriendRequest[]> => {
    try {
        const requests = await FriendRequestModel.find({});
        return requests;
    } catch (e: any) {
        throw new Error("Error fetching all friend requests: " + e.message);
    }
};

export const getRequest = async (requestId: string): Promise<IFriendRequest> => {
    try {
        const request = await FriendRequestModel.findOne({ _id: requestId });
        if (!request) {
            throw new Error("Friend request not found");
        }
        return request;
    } catch (e: any) {
        throw new Error("Error fetching friend request: " + e.message);
    }
};
