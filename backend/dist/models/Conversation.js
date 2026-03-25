"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ConversationSchema = new mongoose_1.Schema({
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Account",
        },
    ],
    lastMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "PrivateMessage",
    },
    pinnedBy: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Account",
        },
    ],
    lastReadAt: {
        type: Map,
        of: Date,
        default: {},
    },
    lastReadMessage: {
        type: Map,
        of: mongoose_1.Schema.Types.ObjectId,
        ref: "PrivateMessage",
        default: {},
    },
}, {
    timestamps: true,
});
ConversationSchema.index({ participants: 1 });
exports.default = (0, mongoose_1.model)("Conversation", ConversationSchema);
