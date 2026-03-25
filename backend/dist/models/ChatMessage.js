"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ChatMessageSchema = new mongoose_1.Schema({
    user: {
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
    isPinned: {
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
    pinnedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        default: null,
    },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("ChatMessage", ChatMessageSchema);
