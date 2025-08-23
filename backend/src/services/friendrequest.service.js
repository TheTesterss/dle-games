const FriendRequestModel = require("../models/FriendRequest");
const FriendsModel = require("../models/Friends");

const acceptRequest = async (requestId) => {
  try {
    const request = await FriendRequestModel.findOne({ _id: requestId });

    if (!request) {
      throw new Error("Friend request not found");
    }

    await FriendsModel.findOneAndUpdate(
      { user: request.from },
      { $addToSet: { list: request.to } },
    );

    await FriendsModel.findOneAndUpdate(
      { user: request.to },
      { $addToSet: { list: request.from } },
    );

    await FriendsModel.findOneAndUpdate(
      { user: request.to },
      { $pull: { pending: requestId } },
    );

    await FriendsModel.findOneAndUpdate(
      { user: request.from },
      { $pull: { pending: requestId } },
    );

    await FriendRequestModel.findOneAndDelete({ _id: requestId });

    return { success: true };
  } catch (e) {
    throw new Error("Error accepting friend request: " + e.message);
  }
};

const denyRequest = async (requestId) => {
  try {
    const request = await FriendRequestModel.findOne({ _id: requestId });

    if (!request) {
      throw new Error("Friend request not found");
    }

    await FriendsModel.findOneAndUpdate(
      { user: request.to },
      { $pull: { pending: requestId } },
    );
    await FriendsModel.findOneAndUpdate(
      { user: request.from },
      { $pull: { pending: requestId } },
    );

    await FriendRequestModel.findOneAndDelete({ _id: requestId });

    return { success: true };
  } catch (e) {
    throw new Error("Error rejecting friend request: " + e.message);
  }
};

const createRequest = async (fromUserId, toUserId) => {
  try {
    const newRequest = new FriendRequestModel({
      from: fromUserId,
      to: toUserId,
    });

    await newRequest.save();
    await FriendsModel.findOneAndUpdate(
      { user: toUserId },
      { $addToSet: { pending: newRequest._id } },
    );

    await FriendsModel.findOneAndUpdate(
      { user: fromUserId },
      { $addToSet: { pending: newRequest._id } },
    );

    return newRequest;
  } catch (e) {
    throw new Error("Error creating friend request: " + e.message);
  }
};

const cancelRequest = async (requestId) => {
  try {
    const request = await FriendRequestModel.findOne({ _id: requestId });

    if (!request) {
      throw new Error("Friend request not found");
    }

    await FriendsModel.findOneAndUpdate(
      { user: request.to },
      { $pull: { pending: requestId } },
    );
    await FriendsModel.findOneAndUpdate(
      { user: request.from },
      { $pull: { pending: requestId } },
    );

    await FriendRequestModel.findOneAndDelete({ _id: requestId });

    return { success: true };
  } catch (e) {
    throw new Error("Error deleting friend request: " + e.message);
  }
};

const getAllRequests = async () => {
  try {
    const requests = await FriendRequestModel.find({});
    return requests;
  } catch (e) {
    throw new Error("Error fetching all friend requests: " + e.message);
  }
};

const getRequest = async (requestId) => {
  try {
    const request = await FriendRequestModel.findOne({ _id: requestId });
    if (!request) {
      throw new Error("Friend request not found");
    }
    return request;
  } catch (e) {
    throw new Error("Error fetching friend request: " + e.message);
  }
};

module.exports = {
  acceptRequest,
  denyRequest,
  cancelRequest,
  createRequest,
  getAllRequests,
  getRequest,
};
