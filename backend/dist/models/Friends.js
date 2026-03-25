"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const FriendsSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        unique: true,
        required: true,
    },
    pending: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "FriendRequest",
        },
    ],
    list: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Account",
        },
    ],
    blocked: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Account",
        },
    ],
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("Friends", FriendsSchema);
