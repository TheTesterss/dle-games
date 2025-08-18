const { Request, Response } = require("express");
const {
  createAccount,
  deleteAccount,
  getUser,
  listAllUsers,
  updateAccount,
} = require("../services/account.service");

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
    res.status(500).json({ message: e, code: 500 });
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
    res.status(500).json({ message: e, code: 500 });
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
    res.status(500).json({ message: e, code: 500 });
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
    res.status(500).json({ message: e, code: 500 });
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
    res.status(500).json({ message: e, code: 500 });
  }
};

module.exports = {
  deleteAccountController,
  updateAccountController,
  createAccountController,
  getUserController,
  listUsersController,
};
