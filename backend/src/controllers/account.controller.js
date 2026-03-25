const { Request, Response } = require("express");
const {
  createAccount,
  deleteAccount,
  getUser,
  listAllUsers,
  updateAccount,
} = require("../services/account.service");

const asErrorMessage = (error, fallback = "Unexpected server error") => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error.message === "string") return error.message;
  try {
    return JSON.stringify(error);
  } catch (_) {
    return fallback;
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const createAccountController = async (req, res) => {
  try {
    const userData = req.body;
    const user = await createAccount(userData);
    res.status(200).json(user);
  } catch (e) {
    if (e.name === "DuplicateAccount") {
      res.status(409).json({ message: asErrorMessage(e), code: 409 });
      return;
    }
    if (e.name === "ValidationError") {
      res.status(400).json({ message: asErrorMessage(e), code: 400 });
      return;
    }
    res.status(500).json({ message: asErrorMessage(e), code: 500 });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const updateAccountController = async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = req.body;
    const user = await updateAccount(userId, userData);
    res.status(200).json(user);
  } catch (e) {
    res.status(500).json({ message: asErrorMessage(e), code: 500 });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const deleteAccountController = async (req, res) => {
  try {
    const userId = req.params.id;
    await deleteAccount(userId);
    res.status(200).json();
  } catch (e) {
    res.status(500).json({ message: asErrorMessage(e), code: 500 });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const getUserController = async (req, res) => {
  try {
    const userId = req.params.id;
    const type = req.query.type;
    const user = await getUser(userId, type);
    res.status(200).json(user);
  } catch (e) {
    res.status(500).json({ message: asErrorMessage(e), code: 500 });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const listUsersController = async (req, res) => {
  try {
    res.status(200).json(await listAllUsers());
  } catch (e) {
    res.status(500).json({ message: asErrorMessage(e), code: 500 });
  }
};

module.exports = {
  deleteAccountController,
  updateAccountController,
  createAccountController,
  getUserController,
  listUsersController,
};
