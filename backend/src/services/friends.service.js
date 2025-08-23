const FriendsModel = require("../models/Friends");
const AccountModel = require("../models/Account");

const listFriends = async (userId) => {
  try {
    const friendsRecord = await FriendsModel.findOne({ user: userId });

    if (!friendsRecord) {
      throw new Error("Friends record not found");
    }
    return friendsRecord.list;
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
      { user: userId1 },
      { $pull: { list: userId2 } },
    );

    await FriendsModel.findOneAndUpdate(
      { user: userId2 },
      { $pull: { list: userId1 } },
    );

    return { success: true };
  } catch (e) {
    throw new Error("Error removing friend: " + e.message);
  }
};

const listRequests = async (userId) => {
  try {
    const friendsRecord = await FriendsModel.findOne({ user: userId });

    if (!friendsRecord) {
      throw new Error("Friends record not found");
    }

    return friendsRecord.pending;
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
