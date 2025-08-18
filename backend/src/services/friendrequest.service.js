const FriendRequestModel = require("../models/FriendRequest");
const FriendsModel = require("../models/Friends");

const acceptRequest = async (requestId) => {
  try {
    const request = await FriendRequestModel.findOne({ id: requestId });

    if (!request) {
      throw new Error("Friend request not found");
    }

    await FriendRequestModel.findOneAndUpdate(
      { id: requestId },
      { $set: { status: "accepted" } },
    );

    await FriendsModel.findOneAndUpdate(
      { id: request.from },
      { $addToSet: { list: request.to } },
    );

    await FriendsModel.findOneAndUpdate(
      { id: request.to },
      { $addToSet: { list: request.from } },
    );

    await FriendsModel.findOneAndUpdate(
      { id: request.to },
      { $pull: { pending: requestId } },
    );

    await FriendsModel.findOneAndUpdate(
      { id: request.from },
      { $pull: { pending: requestId } },
    );

    return { success: true };
  } catch (e) {
    throw new Error("Error accepting friend request: " + e.message);
  }
};

const denyRequest = async (requestId) => {
  try {
    const request = await FriendRequestModel.findOne({ id: requestId });

    if (!request) {
      throw new Error("Friend request not found");
    }

    await FriendRequestModel.findOneAndUpdate(
      { id: requestId },
      { $set: { status: "rejected" } },
    );

    await FriendsModel.findOneAndUpdate(
      { id: request.to },
      { $pull: { pending: requestId } },
    );
    await FriendsModel.findOneAndUpdate(
      { id: request.from },
      { $pull: { pending: requestId } },
    );

    return { success: true };
  } catch (e) {
    throw new Error("Error rejecting friend request: " + e.message);
  }
};

const createRequest = async (fromUserId, toUserId) => {
  try {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newRequest = new FriendRequestModel({
      id: requestId,
      from: fromUserId,
      to: toUserId,
      status: "pending",
    });

    await newRequest.save();
    await FriendsModel.findOneAndUpdate(
      { id: toUserId },
      { $addToSet: { pending: requestId } },
    );

    return newRequest;
  } catch (e) {
    throw new Error("Error creating friend request: " + e.message);
  }
};

const cancelRequest = async (requestId) => {
  try {
    const request = await FriendRequestModel.findOne({ id: requestId });

    if (!request) {
      throw new Error("Friend request not found");
    }

    await FriendRequestModel.findOneAndDelete({ id: requestId });
    await FriendsModel.findOneAndUpdate(
      { id: request.to },
      { $pull: { pending: requestId } },
    );
    await FriendsModel.findOneAndUpdate(
      { id: request.from },
      { $pull: { pending: requestId } },
    );

    return { success: true };
  } catch (e) {
    throw new Error("Error deleting friend request: " + e.message);
  }
};

module.exports = {
  acceptRequest,
  denyRequest,
  cancelRequest,
  createRequest,
};
