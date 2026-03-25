const AccountModel = require("../models/Account");
const FriendsModel = require("../models/Friends");

const toErrorMessage = (error, fallback = "Unknown error") => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error.message === "string") return error.message;
  if (error.errors && typeof error.errors === "object") {
    const fieldMessages = Object.values(error.errors)
      .map((entry) => entry && entry.message)
      .filter((msg) => typeof msg === "string");
    if (fieldMessages.length > 0) return fieldMessages.join(" | ");
  }
  try {
    return JSON.stringify(error);
  } catch (_) {
    return fallback;
  }
};

const createAccount = async (userData) => {
  try {
    const name = typeof userData?.name === "string" ? userData.name.trim() : "";
    const mail = typeof userData?.mail === "string" ? userData.mail.trim().toLowerCase() : "";
    const password = typeof userData?.password === "string" ? userData.password : "";
    const avatar = typeof userData?.avatar === "string" ? userData.avatar.trim() : "";

    if (!name || !mail || !password || !avatar) {
      const error = new Error("Champs requis manquants: name, mail, password, avatar");
      error.name = "ValidationError";
      throw error;
    }

    const existing = await AccountModel.findOne({ $or: [{ mail }, { name }] });
    if (existing) {
      const error = new Error("Un compte avec cet email ou ce pseudo existe deja");
      error.name = "DuplicateAccount";
      throw error;
    }

    const newAccount = new AccountModel({
      ...userData,
      name,
      mail,
      password,
      avatar,
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
    if (e.name === "DuplicateAccount" || e.name === "ValidationError") throw e;
    throw new Error("Error creating account: " + toErrorMessage(e));
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
