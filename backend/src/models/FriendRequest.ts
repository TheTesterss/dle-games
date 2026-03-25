import { Schema, model, Document, Types } from "mongoose";

export interface IFriendRequest extends Document {
    from: Types.ObjectId;
    to: Types.ObjectId;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Date;
    updatedAt: Date;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
    {
        from: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        to: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    },
    {
        timestamps: true,
    },
);

export default model<IFriendRequest>("FriendRequest", FriendRequestSchema);
