import { Schema, model, Document, Types } from "mongoose";

export interface IFriends extends Document {
    user: Types.ObjectId;
    pending: Types.ObjectId[];
    list: Types.ObjectId[];
    blocked: Types.ObjectId[];
}

const FriendsSchema = new Schema<IFriends>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            unique: true,
            required: true,
        },
        pending: [
            {
                type: Schema.Types.ObjectId,
                ref: "FriendRequest",
            },
        ],
        list: [
            {
                type: Schema.Types.ObjectId,
                ref: "Account",
            },
        ],
        blocked: [
            {
                type: Schema.Types.ObjectId,
                ref: "Account",
            },
        ],
    },
    {
        timestamps: true,
    },
);

export default model<IFriends>("Friends", FriendsSchema);
