const express = require("express");
const {
  getUserController,
  listUsersController,
  createAccountController,
  updateAccountController,
  deleteAccountController
} = require("../controllers/account.controller");

const router = express.Router();

router.post("/", createAccountController);
router.patch("/:id", updateAccountController);
router.delete("/:id", deleteAccountController);
router.get("/", listUsersController);
router.get("/:id", getUserController);

module.exports = router;
