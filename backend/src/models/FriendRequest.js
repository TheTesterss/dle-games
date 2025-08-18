const { Schema, model } = require("mongoose");

const FriendRequestSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = new model("FriendRequest", FriendRequestSchema);
