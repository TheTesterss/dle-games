const AccountModel = require("../models/Account");
const FriendsModel = require("../models/Friends");

const createAccount = async (userData) => {
  try {
    const newAccount = new AccountModel({
      ...userData,
      desactivated: false,
    });
    const newFriends = new FriendsModel({
      user: newAccount._id,
      pending: [],
      list: [],
    });
    await newFriends.save();
    return await newAccount.save();
  } catch (e) {
    throw new Error("Error creating account: " + e.message);
  }
};

const updateAccount = async (id, userData) => {
  try {
    const updatedAccount = await AccountModel.findOneAndUpdate(
      { _id: id },
      { $set: userData },
      { new: true, runValidators: true },
    );

    if (!updatedAccount) {
      throw new Error("Account not found");
    }

    return updatedAccount;
  } catch (e) {
    throw new Error("Error updating account: " + e.message);
  }
};

const deleteAccount = async (id) => {
  try {
    const deletedAccount = await AccountModel.findOneAndDelete({ id: id });

    if (!deletedAccount) {
      throw new Error("Account not found");
    }

    return deletedAccount;
  } catch (e) {
    throw new Error("Error deleting account: " + e.message);
  }
};

const desactiveAccount = async (id) => {
  try {
    const reactivatedAccount = await AccountModel.findOneAndUpdate(
      { _id: id },
      { $set: { desactivated: true } },
      { new: true },
    );

    if (!reactivatedAccount) {
      throw new Error("Account not found");
    }

    return reactivatedAccount;
  } catch (e) {
    throw new Error("Error desactivating account: " + e.message);
  }
};

const reactivateAccount = async (id) => {
  try {
    const reactivatedAccount = await AccountModel.findOneAndUpdate(
      { _id: id },
      { $set: { desactivated: false } },
      { new: true },
    );

    if (!reactivatedAccount) {
      throw new Error("Account not found");
    }

    return reactivatedAccount;
  } catch (e) {
    throw new Error("Error reactivating account: " + e.message);
  }
};

const listUsers = async () => {
  try {
    return await AccountModel.find({ desactivated: false });
  } catch (e) {
    throw new Error("Error fetching users: " + e.message);
  }
};

const getUser = async (d, t) => {
  try {
    let query = {};

    if (t === "id") {
      query = { _id: d };
    } else if (t === "name" || t === "nom") {
      query = { name: d };
    } else if (t === "mail" || t === "email") {
      query = { mail: d };
    } else {
      throw new Error("Invalid search type. Use 'id', 'name', or 'mail'");
    }

    const user = await AccountModel.findOne(query);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (e) {
    throw new Error("Error fetching user: " + e.message);
  }
};

const listAllUsers = async () => {
  try {
    return await AccountModel.find({});
  } catch (e) {
    throw new Error("Error fetching all users: " + e.message);
  }
};

module.exports = {
  listAllUsers,
  getUser,
  updateAccount,
  deleteAccount,
  createAccount,
};
