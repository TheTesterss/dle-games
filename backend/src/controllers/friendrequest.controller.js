const { Request, Response } = require("express");
const {
  cancelRequest,
  createRequest,
  denyRequest,
  acceptRequest,
} = require("../services/friendrequest.service");

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const acceptRequestController = async (req, res) => {
  try {
    const reqId = req.params.id;
    const d = await acceptRequest(reqId);
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
const denyRequestController = async (req, res) => {
  try {
    const reqId = req.params.id;
    const d = await denyRequest(reqId);
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
const cancelRequestController = async (req, res) => {
  try {
    const reqId = req.params.id;
    const d = await cancelRequest(reqId);
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
const createRequestController = async (req, res) => {
  try {
    const { from, to } = req.body;
    console.log(from, to);
    const d = await createRequest(from, to);
    res.status(200).json(d);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e, code: 500 });
  }
};

module.exports = {
  cancelRequestController,
  createRequestController,
  denyRequestController,
  acceptRequestController,
};
