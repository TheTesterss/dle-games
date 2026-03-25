import { Schema, model, Document, Types } from "mongoose";

export interface ILog extends Document {
    userId?: Types.ObjectId;
    action: string;
    targetId?: Types.ObjectId;
    details?: any;
    level: 'info' | 'warning' | 'error';
    createdAt: Date;
}

const LogSchema = new Schema<ILog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "Account", required: false },
        action: { type: String, required: true },
        targetId: { type: Schema.Types.ObjectId, ref: "Account", required: false },
        details: { type: Schema.Types.Mixed },
        level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' }
    },
    {
        timestamps: true,
    },
);

export default model<ILog>("Log", LogSchema);
