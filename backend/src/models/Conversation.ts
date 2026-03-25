import { Schema, model, Document, Types } from "mongoose";

export interface IConversation extends Document {
    participants: Types.ObjectId[];
    lastMessage?: Types.ObjectId;
    pinnedBy: Types.ObjectId[];
    lastReadAt?: Map<string, Date>;
    lastReadMessage?: Map<string, Types.ObjectId>;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "Account",
            },
        ],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "PrivateMessage",
        },
        pinnedBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "Account",
            },
        ],
        lastReadAt: {
            type: Map,
            of: Date,
            default: {},
        },
        lastReadMessage: {
            type: Map,
            of: Schema.Types.ObjectId,
            ref: "PrivateMessage",
            default: {},
        },
    },
    {
        timestamps: true,
    },
);

ConversationSchema.index({ participants: 1 });

export default model<IConversation>("Conversation", ConversationSchema);
