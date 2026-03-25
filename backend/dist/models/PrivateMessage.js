"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PrivateMessageSchema = new mongoose_1.Schema({
    conversation: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    },
    content: {
        type: String,
        default: "",
    },
    image: {
        type: String,
        default: null,
    },
    video: {
        type: String,
        default: null,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
    replyTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "PrivateMessage",
        default: null,
    },
    reactions: [
        {
            emoji: { type: String, required: true },
            users: [
                {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: "Account",
                },
            ],
        },
    ],
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("PrivateMessage", PrivateMessageSchema);
