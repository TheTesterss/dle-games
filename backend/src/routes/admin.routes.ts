import { Router } from "express";
import {
    getGlobalStatsController,
    moderateUserController,
    updateBadgesController,
    listAdminsController,
    updateUserAdminController,
    updatePremiumAdminController,
    createPremiumGiftAdminController,
    getSystemLogsController,
    getUserLogsAdminController
} from "../controllers/admin.controller";

const router = Router();

router.get("/:id/stats", getGlobalStatsController);
router.post("/:id/moderate/:userId", moderateUserController);
router.post("/:id/badges/:userId", updateBadgesController);
router.post("/:id/users/:userId", updateUserAdminController);
router.post("/:id/users/:userId/premium", updatePremiumAdminController);
router.post("/:id/premium_gifts", createPremiumGiftAdminController);
router.get("/:id/admins", listAdminsController);
router.get("/:id/logs", getSystemLogsController);
router.get("/:id/users/:userId/logs", getUserLogsAdminController);

export default router;
