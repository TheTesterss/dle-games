import ForumModel from "../models/Forum";
import Account from "../models/Account";
import { IForumPost } from "../models/Forum";
import { Types } from "mongoose";

const isModerator = async (userId: string): Promise<boolean> => {
    const user = await Account.findById(userId);
    return !!(user?.badges?.admin || user?.badges?.owner);
};

export const createPost = async (
    userId: string | Types.ObjectId,
    content: string,
    images: string[] = [],
    image: string | null = null,
    repostOf: string | null = null,
    allowComments: boolean = true,
    allowReposts: boolean = true,
    videos: string[] = [],
    video: string | null = null
): Promise<IForumPost> => {
    const user = await Account.findById(userId).lean();
    const tier = user?.premiumTier || (user?.badges?.premium ? "games_one" : null);
    const maxImages = tier ? 10 : 4;
    const maxLength = tier ? 2048 : 512;
    const allowVideo = !!tier;

    if (content && content.length > maxLength) {
        throw new Error("Contenu trop long pour votre offre");
    }
    if (images.length > maxImages) {
        throw new Error("Trop d'images pour votre offre");
    }
    if ((videos && videos.length > 0) || video) {
        if (!allowVideo) {
            throw new Error("Video reservee aux comptes premium");
        }
        if (videos.length > 1) {
            throw new Error("Une seule video est autorisee");
        }
    }

    const post = new ForumModel({
        user: userId,
        content,
        images,
        image,
        repostOf,
        allowComments,
        allowReposts,
        videos,
        video
    });
    return await post.save();
};

export const deletePost = async (postId: string, userId: string): Promise<{ success: boolean }> => {
    const canModerate = await isModerator(userId);
    const query = canModerate ? { _id: postId } : { _id: postId, user: userId };
    const post = await ForumModel.findOneAndDelete(query);

    if (!post) throw new Error("Post introuvable ou non autorisé");

    return { success: true };
};

export const addComment = async (postId: string, userId: string, content: string, images: string[] = [], videos: string[] = []): Promise<IForumPost> => {
    const post = await ForumModel.findById(postId);
    if (!post) throw new Error("Post introuvable");
    if (post.allowComments === false) throw new Error("Commentaires désactivés");

    const user = await Account.findById(userId).lean();
    const tier = user?.premiumTier || (user?.badges?.premium ? "games_one" : null);
    const maxImages = tier ? 10 : 4;
    const maxLength = tier ? 1024 : 256;
    const allowVideo = !!tier;

    if (content && content.length > maxLength) {
        throw new Error("Contenu trop long pour votre offre");
    }
    if (images.length > maxImages) {
        throw new Error("Trop d'images pour votre offre");
    }
    if (videos && videos.length > 0 && !allowVideo) {
        throw new Error("Video reservee aux comptes premium");
    }
    if (videos && videos.length > 1) {
        throw new Error("Une seule video est autorisee");
    }

    post.comments.push({ user: new Types.ObjectId(userId), content, images, videos, createdAt: new Date() });
    await post.save();

    return post;
};

export const deleteComment = async (postId: string, commentId: string, userId: string): Promise<IForumPost> => {
    const post = await ForumModel.findById(postId);
    if (!post) throw new Error("Post introuvable");

    const canModerate = await isModerator(userId);
    post.comments = post.comments.filter((c: any) => {
        if (c._id.toString() !== commentId) return true;
        if (canModerate) return false;
        return c.user.toString() !== userId;
    });

    await post.save();
    return post;
};

export const updatePost = async (postId: string, userId: string, content: string): Promise<IForumPost> => {
    const post = await ForumModel.findById(postId);
    if (!post) throw new Error("Post introuvable");
    if (post.user.toString() !== userId) throw new Error("Non autorisé");

    post.content = content;
    await post.save();
    return post;
};

export const togglePinPost = async (postId: string, userId: string): Promise<IForumPost> => {
    const post = await ForumModel.findById(postId);
    if (!post) throw new Error("Post introuvable");
    const canModerate = await isModerator(userId);
    if (post.user.toString() !== userId && !canModerate) throw new Error("Non autorisé");

    const nextPinned = !post.pinnedOnProfile;
    if (nextPinned) {
        await ForumModel.updateMany(
            { user: post.user, pinnedOnProfile: true, _id: { $ne: post._id } },
            { $set: { pinnedOnProfile: false } },
        );
    }
    post.pinnedOnProfile = nextPinned;
    await post.save();
    return post;
};

export const toggleLike = async (postId: string, userId: string): Promise<IForumPost> => {
    const post = await ForumModel.findById(postId);
    if (!post) throw new Error("Post introuvable");

    const index = post.likes.findIndex((id: any) => id.toString() === userId);

    if (index > -1) {
        post.likes.splice(index, 1);
    } else {
        post.likes.push(new Types.ObjectId(userId));
    }

    await post.save();
    return post;
};

export const getUserPosts = async (userId: string): Promise<IForumPost[]> => {
    return await ForumModel.find({ user: userId })
        .sort({ createdAt: -1 });
};

export const getPost = async (postId: string): Promise<IForumPost | null> => {
    return await ForumModel.findById(postId);
};

export const getAllPosts = async (): Promise<IForumPost[]> => {
    return await ForumModel.find({})
        .sort({ createdAt: -1 });
};

export const getFeedForUser = async (userId: string): Promise<IForumPost[]> => {
    const posts = await ForumModel.find({});
    const ranked = posts
        .map((post: any) => {
            const hasSeen = (post.seenBy || []).some((id: any) => id.toString() === userId);
            return {
                post,
                hasSeen,
                likeCount: (post.likes || []).length,
                createdAt: post.createdAt || new Date(0),
            };
        })
        .sort((a, b) => {
            if (a.hasSeen !== b.hasSeen) return a.hasSeen ? 1 : -1;
            if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .map((entry) => entry.post);

    const ids = ranked.map((p) => p._id);
    if (ids.length > 0) {
        await ForumModel.updateMany(
            { _id: { $in: ids } },
            { $addToSet: { seenBy: new Types.ObjectId(userId) } },
        );
    }

    return ranked;
};

export const repostPost = async (userId: string, postId: string, content: string = ""): Promise<IForumPost> => {
    const original = await ForumModel.findById(postId);
    if (!original) throw new Error("Post introuvable");
    if (original.repostOf) throw new Error("Impossible de repost un repost");
    if (original.allowReposts === false) throw new Error("Reposts désactivés");

    const repost = new ForumModel({
        user: userId,
        content,
        repostOf: postId,
        allowComments: true,
        allowReposts: true,
    });

    return await repost.save();
};

export const getUserReposts = async (userId: string): Promise<IForumPost[]> => {
    return await ForumModel.find({ user: userId, repostOf: { $ne: null } })
        .sort({ createdAt: -1 });
};

export const getUserAnswers = async (userId: string): Promise<any[]> => {
    const posts = await ForumModel.find({ "comments.user": userId })
        .sort({ createdAt: -1 });

    return posts.map((post) => {
        const answers = post.comments.filter(
            (comment: any) => comment.user.toString() === userId,
        );
        return { post, answers };
    });
};

