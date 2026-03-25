import { Router } from "express";
import {
    createGiftController,
    getGiftStatusController,
    claimGiftController
} from "../controllers/premium.controller";

const router = Router();

router.post("/gifts", createGiftController);
router.get("/gifts/:code", getGiftStatusController);
router.post("/gifts/:code/claim", claimGiftController);

export default router;
