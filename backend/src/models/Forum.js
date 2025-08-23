const { Schema, model } = require("mongoose");

const CommentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true
    },
    content: {
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

const ForumSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    image: {
      type: String
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: "Account",
      default: []
    },
    comments: [CommentSchema],
  },
  { timestamps: true }
);

module.exports = model("Forum", ForumSchema);
