"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const FriendRequestSchema = new mongoose_1.Schema({
    from: { type: mongoose_1.Schema.Types.ObjectId, ref: "Account", required: true },
    to: { type: mongoose_1.Schema.Types.ObjectId, ref: "Account", required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("FriendRequest", FriendRequestSchema);
