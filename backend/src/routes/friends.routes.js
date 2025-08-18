const express = require("express");
const {
  deleteFriendController,
  getRequestsController,
  getFriendsController,
  getFriendController,
} = require("../controllers/friends.controller");

const router = express.Router();

router.delete("/:id", deleteFriendController);
router.get("/:id", getFriendController);
router.get("/:id/friends", getFriendsController);
router.get("/:id/requests", getRequestsController);

module.exports = router;
