import FriendsModel from "../models/Friends";
import AccountModel from "../models/Account";
import { IAccount } from "../types";

export const listFriends = async (userId: string) => {
    try {
        let friendsRecord = await FriendsModel.findOne({ user: userId });
        if (!friendsRecord) {
            friendsRecord = await FriendsModel.create({ user: userId, pending: [], list: [] });
        }
        return friendsRecord;
    } catch (e: any) {
        throw new Error("Error listing friends: " + e.message);
    }
};

export const getUser = async (userId: string): Promise<IAccount> => {
    try {
        const user = await AccountModel.findOne({
            _id: userId,
            desactivated: false,
        });

        if (!user) {
            throw new Error("User not found or deactivated");
        }

        return user;
    } catch (e: any) {
        throw new Error("Error fetching user info: " + e.message);
    }
};

export const deleteFriend = async (userId1: string, userId2: string) => {
    try {
        await FriendsModel.findOneAndUpdate(
            { user: userId1 },
            { $pull: { list: userId2 } },
        );

        await FriendsModel.findOneAndUpdate(
            { user: userId2 },
            { $pull: { list: userId1 } },
        );

        return { success: true };
    } catch (e: any) {
        throw new Error("Error removing friend: " + e.message);
    }
};

export const listRequests = async (userId: string) => {
    try {
        let friendsRecord = await FriendsModel.findOne({ user: userId });
        if (!friendsRecord) {
            friendsRecord = await FriendsModel.create({ user: userId, pending: [], list: [] });
        }
        return friendsRecord.pending;
    } catch (e: any) {
        throw new Error("Error listing friend requests: " + e.message);
    }
};
