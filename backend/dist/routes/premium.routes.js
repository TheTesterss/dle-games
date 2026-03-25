"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const premium_controller_1 = require("../controllers/premium.controller");
const router = (0, express_1.Router)();
router.post("/gifts", premium_controller_1.createGiftController);
router.get("/gifts/:code", premium_controller_1.getGiftStatusController);
router.post("/gifts/:code/claim", premium_controller_1.claimGiftController);
exports.default = router;
