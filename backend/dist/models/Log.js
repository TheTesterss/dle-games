"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const LogSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Account", required: false },
    action: { type: String, required: true },
    targetId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Account", required: false },
    details: { type: mongoose_1.Schema.Types.Mixed },
    level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' }
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("Log", LogSchema);
