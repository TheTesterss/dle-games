import { Router } from "express";
import {
    getUserController,
    listUsersController,
    createAccountController,
    updateAccountController,
    deleteAccountController,
    getLogsController,
    getStatsHistoryController,
} from "../controllers/account.controller";

const router = Router();

router.post("/", createAccountController);
router.patch("/:id", updateAccountController);
router.delete("/:id", deleteAccountController);
router.get("/", listUsersController);
router.get("/:id", getUserController);
router.get("/:id/logs", getLogsController);
router.get("/:id/stats_history", getStatsHistoryController);

export default router;
