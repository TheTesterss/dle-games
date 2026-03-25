import { Schema, model, Document, Types } from "mongoose";

export interface IChatMessage extends Document {
    user: Types.ObjectId;
    content: string;
    image?: string;
    video?: string;
    isPinned: boolean;
    isDeleted: boolean;
    isEdited: boolean;
    pinnedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
    {
        user: {
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
        isPinned: {
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
        pinnedBy: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

export default model<IChatMessage>("ChatMessage", ChatMessageSchema);
