const { Schema, model } = require("mongoose");

const AccountSchema = new Schema(
  {
    name: { type: String, required: true },
    mail: { type: String, unique: true, required: true },
    avatar: { type: String, required: true },
    password: { type: String, required: true },
    desactivated: { type: Boolean, default: false },
    stats: {
      matchesPlayed: { type: Number, default: 0 },
      victories: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      favoriteGame: { type: String, default: "" },
      longestStreak: { type: Number, default: 0 },
      mostPlayedOpponent: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = new model("Account", AccountSchema);
