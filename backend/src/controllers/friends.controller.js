const { Request, Response } = require("express");
const {
  deleteFriend,
  listFriends,
  listRequests,
  getUser,
} = require("../services/friends.service");

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const deleteFriendController = async (req, res) => {
  try {
    const userId = req.params.id;
    const { target } = req.body;
    const d = await deleteFriend(userId, target);
    res.status(200).json(d);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const getFriendController = async (req, res) => {
  try {
    const userId = req.params.id;
    const { target } = req.body;
    const f = await listFriends(userId);
    const d = await f.list.find((friend) => friend._id.toString() === target);
    res.status(200).json(d);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const getFriendsController = async (req, res) => {
  try {
    const userId = req.params.id;
    const d = await listFriends(userId);
    res.status(200).json(d);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const getRequestsController = async (req, res) => {
  try {
    const userId = req.params.id;
    const d = await listRequests(userId);
    res.status(200).json(d);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

module.exports = {
  getFriendsController,
  getRequestsController,
  getFriendController,
  deleteFriendController,
};
