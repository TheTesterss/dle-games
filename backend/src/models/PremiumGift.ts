import { Schema, model, Document, Types } from "mongoose";

export interface IPremiumGift extends Document {
    code: string;
    tier: "games_one" | "games_plus";
    createdBy: Types.ObjectId;
    createdAt: Date;
    claimedBy?: Types.ObjectId | null;
    claimedAt?: Date | null;
    expiresAt?: Date | null;
    durationDays: number;
}

const PremiumGiftSchema = new Schema<IPremiumGift>(
    {
        code: { type: String, unique: true, required: true, index: true },
        tier: { type: String, enum: ["games_one", "games_plus"], required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        claimedBy: { type: Schema.Types.ObjectId, ref: "Account", default: null },
        claimedAt: { type: Date, default: null },
        expiresAt: { type: Date, default: null },
        durationDays: { type: Number, default: 30 }
    },
    { timestamps: true }
);

export default model<IPremiumGift>("PremiumGift", PremiumGiftSchema);
