const FriendsModel = require("../models/Friends");
const AccountModel = require("../models/Account");

const listFriends = async (userId) => {
  try {
    const friendsRecord = await FriendsModel.findOne({ id: userId });

    if (!friendsRecord) {
      throw new Error("Friends record not found");
    }
    console.log(friendsRecord);
    const friendsDetails = await AccountModel.find({
      id: { $in: friendsRecord.list },
      desactivated: false,
    });
    console.log(friendsDetails);
    return friendsDetails;
  } catch (e) {
    throw new Error("Error listing friends: " + e.message);
  }
};

const getUser = async (userId) => {
  try {
    const user = await AccountModel.findOne({
      id: userId,
      desactivated: false,
    });

    if (!user) {
      throw new Error("User not found or deactivated");
    }

    return user;
  } catch (e) {
    throw new Error("Error fetching user info: " + e.message);
  }
};

const deleteFriend = async (userId1, userId2) => {
  try {
    await FriendsModel.findOneAndUpdate(
      { id: userId1 },
      { $pull: { list: userId2 } },
    );

    await FriendsModel.findOneAndUpdate(
      { id: userId2 },
      { $pull: { list: userId1 } },
    );

    return { success: true };
  } catch (e) {
    throw new Error("Error removing friend: " + e.message);
  }
};

const listRequests = async (userId) => {
  try {
    const friendsRecord = await FriendsModel.findOne({ id: userId });

    if (!friendsRecord) {
      throw new Error("Friends record not found");
    }

    if (friendsRecord.pending.length === 0) {
      return [];
    }

    const { FriendRequestModel } = await import("../models/FriendRequest");

    const pendingRequests = await FriendRequestModel.find({
      id: { $in: friendsRecord.pending },
      status: "pending",
    });

    const sendersIds = pendingRequests.map((req) => req.from);
    const sendersDetails = await AccountModel.find({
      id: { $in: sendersIds },
      desactivated: false,
    });

    const req = pendingRequests.map((request) => {
      const senderInfo = sendersDetails.find(
        (sender) => sender.id === request.from,
      );
      return {
        request: request,
        senderInfo: senderInfo,
      };
    });

    return req;
  } catch (e) {
    throw new Error("Error listing friend requests: " + e.message);
  }
};

module.exports = {
  listFriends,
  listRequests,
  getUser,
  deleteFriend,
};
