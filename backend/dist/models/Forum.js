"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CommentSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "Account", required: true },
    content: { type: String, default: "" },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
}, { timestamps: true });
const ForumSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "Account", required: true },
    content: { type: String, default: "" },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    pinnedOnProfile: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
    allowReposts: { type: Boolean, default: true },
    image: { type: String },
    video: { type: String },
    repostOf: { type: mongoose_1.Schema.Types.ObjectId, ref: "Forum" },
    seenBy: { type: [mongoose_1.Schema.Types.ObjectId], ref: "Account", default: [] },
    likes: { type: [mongoose_1.Schema.Types.ObjectId], ref: "Account", default: [] },
    comments: [CommentSchema],
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Forum", ForumSchema);
