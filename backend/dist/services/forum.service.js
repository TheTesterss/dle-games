"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAnswers = exports.getUserReposts = exports.repostPost = exports.getFeedForUser = exports.getAllPosts = exports.getPost = exports.getUserPosts = exports.toggleLike = exports.togglePinPost = exports.updatePost = exports.deleteComment = exports.addComment = exports.deletePost = exports.createPost = void 0;
const Forum_1 = __importDefault(require("../models/Forum"));
const Account_1 = __importDefault(require("../models/Account"));
const mongoose_1 = require("mongoose");
const isModerator = async (userId) => {
    const user = await Account_1.default.findById(userId);
    return !!(user?.badges?.admin || user?.badges?.owner);
};
const createPost = async (userId, content, images = [], image = null, repostOf = null, allowComments = true, allowReposts = true, videos = [], video = null) => {
    const user = await Account_1.default.findById(userId).lean();
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
    const post = new Forum_1.default({
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
exports.createPost = createPost;
const deletePost = async (postId, userId) => {
    const canModerate = await isModerator(userId);
    const query = canModerate ? { _id: postId } : { _id: postId, user: userId };
    const post = await Forum_1.default.findOneAndDelete(query);
    if (!post)
        throw new Error("Post introuvable ou non autorisé");
    return { success: true };
};
exports.deletePost = deletePost;
const addComment = async (postId, userId, content, images = [], videos = []) => {
    const post = await Forum_1.default.findById(postId);
    if (!post)
        throw new Error("Post introuvable");
    if (post.allowComments === false)
        throw new Error("Commentaires désactivés");
    const user = await Account_1.default.findById(userId).lean();
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
    post.comments.push({ user: new mongoose_1.Types.ObjectId(userId), content, images, videos, createdAt: new Date() });
    await post.save();
    return post;
};
exports.addComment = addComment;
const deleteComment = async (postId, commentId, userId) => {
    const post = await Forum_1.default.findById(postId);
    if (!post)
        throw new Error("Post introuvable");
    const canModerate = await isModerator(userId);
    post.comments = post.comments.filter((c) => {
        if (c._id.toString() !== commentId)
            return true;
        if (canModerate)
            return false;
        return c.user.toString() !== userId;
    });
    await post.save();
    return post;
};
exports.deleteComment = deleteComment;
const updatePost = async (postId, userId, content) => {
    const post = await Forum_1.default.findById(postId);
    if (!post)
        throw new Error("Post introuvable");
    if (post.user.toString() !== userId)
        throw new Error("Non autorisé");
    post.content = content;
    await post.save();
    return post;
};
exports.updatePost = updatePost;
const togglePinPost = async (postId, userId) => {
    const post = await Forum_1.default.findById(postId);
    if (!post)
        throw new Error("Post introuvable");
    const canModerate = await isModerator(userId);
    if (post.user.toString() !== userId && !canModerate)
        throw new Error("Non autorisé");
    const nextPinned = !post.pinnedOnProfile;
    if (nextPinned) {
        await Forum_1.default.updateMany({ user: post.user, pinnedOnProfile: true, _id: { $ne: post._id } }, { $set: { pinnedOnProfile: false } });
    }
    post.pinnedOnProfile = nextPinned;
    await post.save();
    return post;
};
exports.togglePinPost = togglePinPost;
const toggleLike = async (postId, userId) => {
    const post = await Forum_1.default.findById(postId);
    if (!post)
        throw new Error("Post introuvable");
    const index = post.likes.findIndex((id) => id.toString() === userId);
    if (index > -1) {
        post.likes.splice(index, 1);
    }
    else {
        post.likes.push(new mongoose_1.Types.ObjectId(userId));
    }
    await post.save();
    return post;
};
exports.toggleLike = toggleLike;
const getUserPosts = async (userId) => {
    return await Forum_1.default.find({ user: userId })
        .sort({ createdAt: -1 });
};
exports.getUserPosts = getUserPosts;
const getPost = async (postId) => {
    return await Forum_1.default.findById(postId);
};
exports.getPost = getPost;
const getAllPosts = async () => {
    return await Forum_1.default.find({})
        .sort({ createdAt: -1 });
};
exports.getAllPosts = getAllPosts;
const getFeedForUser = async (userId) => {
    const posts = await Forum_1.default.find({});
    const ranked = posts
        .map((post) => {
        const hasSeen = (post.seenBy || []).some((id) => id.toString() === userId);
        return {
            post,
            hasSeen,
            likeCount: (post.likes || []).length,
            createdAt: post.createdAt || new Date(0),
        };
    })
        .sort((a, b) => {
        if (a.hasSeen !== b.hasSeen)
            return a.hasSeen ? 1 : -1;
        if (b.likeCount !== a.likeCount)
            return b.likeCount - a.likeCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
        .map((entry) => entry.post);
    const ids = ranked.map((p) => p._id);
    if (ids.length > 0) {
        await Forum_1.default.updateMany({ _id: { $in: ids } }, { $addToSet: { seenBy: new mongoose_1.Types.ObjectId(userId) } });
    }
    return ranked;
};
exports.getFeedForUser = getFeedForUser;
const repostPost = async (userId, postId, content = "") => {
    const original = await Forum_1.default.findById(postId);
    if (!original)
        throw new Error("Post introuvable");
    if (original.repostOf)
        throw new Error("Impossible de repost un repost");
    if (original.allowReposts === false)
        throw new Error("Reposts désactivés");
    const repost = new Forum_1.default({
        user: userId,
        content,
        repostOf: postId,
        allowComments: true,
        allowReposts: true,
    });
    return await repost.save();
};
exports.repostPost = repostPost;
const getUserReposts = async (userId) => {
    return await Forum_1.default.find({ user: userId, repostOf: { $ne: null } })
        .sort({ createdAt: -1 });
};
exports.getUserReposts = getUserReposts;
const getUserAnswers = async (userId) => {
    const posts = await Forum_1.default.find({ "comments.user": userId })
        .sort({ createdAt: -1 });
    return posts.map((post) => {
        const answers = post.comments.filter((comment) => comment.user.toString() === userId);
        return { post, answers };
    });
};
exports.getUserAnswers = getUserAnswers;
