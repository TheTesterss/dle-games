"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PremiumGiftSchema = new mongoose_1.Schema({
    code: { type: String, unique: true, required: true, index: true },
    tier: { type: String, enum: ["games_one", "games_plus"], required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Account", required: true },
    claimedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Account", default: null },
    claimedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    durationDays: { type: Number, default: 30 }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("PremiumGift", PremiumGiftSchema);
