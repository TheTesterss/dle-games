import { Schema, model, Document, Types } from "mongoose";

export interface IForumComment {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    content: string;
    images: string[];
    videos: string[];
    createdAt: Date;
}

export interface IForumPost extends Document {
    user: Types.ObjectId;
    content: string;
    images: string[];
    videos: string[];
    pinnedOnProfile?: boolean;
    allowComments: boolean;
    allowReposts: boolean;
    image?: string;
    video?: string;
    repostOf?: Types.ObjectId;
    seenBy: Types.ObjectId[];
    likes: Types.ObjectId[];
    comments: IForumComment[];
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema<IForumComment>(
    {
        user: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        content: { type: String, default: "" },
        images: { type: [String], default: [] },
        videos: { type: [String], default: [] },
    },
    { timestamps: true }
);

const ForumSchema = new Schema<IForumPost>(
    {
        user: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        content: { type: String, default: "" },
        images: { type: [String], default: [] },
        videos: { type: [String], default: [] },
        pinnedOnProfile: { type: Boolean, default: false },
        allowComments: { type: Boolean, default: true },
        allowReposts: { type: Boolean, default: true },
        image: { type: String },
        video: { type: String },
        repostOf: { type: Schema.Types.ObjectId, ref: "Forum" },
        seenBy: { type: [Schema.Types.ObjectId], ref: "Account", default: [] },
        likes: { type: [Schema.Types.ObjectId], ref: "Account", default: [] },
        comments: [CommentSchema],
    },
    { timestamps: true }
);

export default model<IForumPost>("Forum", ForumSchema);
