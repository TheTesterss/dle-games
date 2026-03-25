import { Router } from "express";
import {
    cancelRequestController,
    createRequestController,
    acceptRequestController,
    denyRequestController,
    getAllRequestsController,
    getRequestController,
} from "../controllers/friendrequest.controller";

const router = Router();

router.post("/:id/accept", acceptRequestController);
router.post("/", createRequestController);
router.patch("/:id", cancelRequestController);
router.delete("/:id/deny", denyRequestController);
router.get("/", getAllRequestsController);
router.get("/:id", getRequestController);

export default router;
