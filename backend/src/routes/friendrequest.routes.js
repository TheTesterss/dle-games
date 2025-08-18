const express = require("express");
const {
  cancelRequestController,
  createRequestController,
  acceptRequestController,
  denyRequestController,
} = require("../controllers/friendrequest.controller");

const router = express.Router();

router.post("/:id/accept", acceptRequestController);
router.post("/", createRequestController);
router.patch("/:id", cancelRequestController);
router.delete("/:id/deny", denyRequestController);

module.exports = router;
