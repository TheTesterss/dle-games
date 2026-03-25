import { Request, Response } from "express";
import {
    cancelRequest,
    createRequest,
    denyRequest,
    acceptRequest,
    getAllRequests,
    getRequest,
} from "../services/friendrequest.service";
import { asString } from "../utils/params";

export const acceptRequestController = async (req: Request, res: Response): Promise<void> => {
    try {
        const reqId = asString(req.params.id);
        const d = await acceptRequest(reqId);
        res.status(200).json(d);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const denyRequestController = async (req: Request, res: Response): Promise<void> => {
    try {
        const reqId = asString(req.params.id);
        const d = await denyRequest(reqId);
        res.status(200).json(d);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const cancelRequestController = async (req: Request, res: Response): Promise<void> => {
    try {
        const reqId = asString(req.params.id);
        const d = await cancelRequest(reqId);
        res.status(200).json(d);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const createRequestController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { from, to } = req.body;
        const d = await createRequest(from, to);
        res.status(200).json(d);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getAllRequestsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const requests = await getAllRequests();
        res.status(200).json(requests);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getRequestController = async (req: Request, res: Response): Promise<void> => {
    try {
        const reqId = asString(req.params.id);
        const request = await getRequest(reqId);
        res.status(200).json(request);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
