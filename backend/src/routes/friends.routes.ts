import { Router } from "express";
import {
    deleteFriendController,
    getRequestsController,
    getFriendsController,
    getFriendController,
} from "../controllers/friends.controller";

const router = Router();

router.delete("/:id", deleteFriendController);
router.get("/:id", getFriendController);
router.get("/:id/friends", getFriendsController);
router.get("/:id/requests", getRequestsController);

export default router;
