const { Schema, model } = require("mongoose");

const FriendsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      unique: true,
      required: true,
    },
    pending: [
      {
        type: Schema.Types.ObjectId,
        ref: "FriendRequest",
      },
    ],
    list: [
      {
        type: Schema.Types.ObjectId,
        ref: "Account",
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = new model("Friends", FriendsSchema);
