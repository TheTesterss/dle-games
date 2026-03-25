import { Request, Response } from "express";
import {
    deleteFriend,
    listFriends,
    listRequests,
} from "../services/friends.service";
import { asString } from "../utils/params";

export const deleteFriendController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const { target } = req.body;
        const d = await deleteFriend(userId, target);
        res.status(200).json(d);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getFriendController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const { target } = req.body;
        const f = await listFriends(userId);
        const d = f.list.find((friend: any) => friend._id.toString() === target);
        res.status(200).json(d);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getFriendsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const d = await listFriends(userId);
        res.status(200).json(d.list || []);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getRequestsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const d = await listRequests(userId);
        res.status(200).json(d || []);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
