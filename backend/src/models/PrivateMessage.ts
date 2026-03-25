import { Schema, model, Document, Types } from "mongoose";

export interface IPrivateMessage extends Document {
    conversation: Types.ObjectId;
    sender: Types.ObjectId;
    content: string;
    image?: string;
    video?: string;
    isRead: boolean;
    isDeleted: boolean;
    isEdited: boolean;
    isPinned: boolean;
    replyTo?: Types.ObjectId;
    reactions?: {
        emoji: string;
        users: Types.ObjectId[];
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const PrivateMessageSchema = new Schema<IPrivateMessage>(
    {
        conversation: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
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
        isRead: {
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
        isPinned: {
            type: Boolean,
            default: false,
        },
        replyTo: {
            type: Schema.Types.ObjectId,
            ref: "PrivateMessage",
            default: null,
        },
        reactions: [
            {
                emoji: { type: String, required: true },
                users: [
                    {
                        type: Schema.Types.ObjectId,
                        ref: "Account",
                    },
                ],
            },
        ],
    },
    {
        timestamps: true,
    },
);

export default model<IPrivateMessage>("PrivateMessage", PrivateMessageSchema);
