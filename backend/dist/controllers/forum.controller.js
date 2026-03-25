"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAnswersController = exports.getUserRepostsController = exports.repostPostController = exports.getFeedController = exports.getAllPostsController = exports.getPostController = exports.getUserPostsController = exports.toggleLikeController = exports.deleteCommentController = exports.addCommentController = exports.togglePinPostController = exports.updatePostController = exports.deletePostController = exports.createPostController = void 0;
const forum_service_1 = require("../services/forum.service");
const params_1 = require("../utils/params");
const createPostController = async (req, res) => {
    try {
        const { content, image, images, video, videos, repostOf, allowComments, allowReposts } = req.body;
        const userId = (0, params_1.asString)(req.params.id);
        const imageList = Array.isArray(images) ? images : (images ? [images] : []);
        const videoList = Array.isArray(videos) ? videos : (videos ? [videos] : []);
        const post = await (0, forum_service_1.createPost)(userId, content, imageList, image || null, repostOf || null, allowComments !== false, allowReposts !== false, videoList, video || null);
        res.status(201).json(post);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.createPostController = createPostController;
const deletePostController = async (req, res) => {
    try {
        const postId = (0, params_1.asString)(req.params.postId);
        const userId = (0, params_1.asString)(req.params.id);
        const result = await (0, forum_service_1.deletePost)(postId, userId);
        res.status(200).json(result);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.deletePostController = deletePostController;
const updatePostController = async (req, res) => {
    try {
        const postId = (0, params_1.asString)(req.params.postId);
        const userId = (0, params_1.asString)(req.params.id);
        const { content } = req.body;
        const post = await (0, forum_service_1.updatePost)(postId, userId, content || "");
        res.status(200).json(post);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.updatePostController = updatePostController;
const togglePinPostController = async (req, res) => {
    try {
        const postId = (0, params_1.asString)(req.params.postId);
        const userId = (0, params_1.asString)(req.params.id);
        const post = await (0, forum_service_1.togglePinPost)(postId, userId);
        res.status(200).json(post);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.togglePinPostController = togglePinPostController;
const addCommentController = async (req, res) => {
    try {
        const postId = (0, params_1.asString)(req.params.postId);
        const { content, images, videos } = req.body;
        const userId = (0, params_1.asString)(req.params.id);
        const imageList = Array.isArray(images) ? images : (images ? [images] : []);
        const videoList = Array.isArray(videos) ? videos : (videos ? [videos] : []);
        const post = await (0, forum_service_1.addComment)(postId, userId, content, imageList, videoList);
        res.status(200).json(post);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.addCommentController = addCommentController;
const deleteCommentController = async (req, res) => {
    try {
        const postId = (0, params_1.asString)(req.params.postId);
        const commentId = (0, params_1.asString)(req.params.commentId);
        const userId = (0, params_1.asString)(req.params.id);
        const post = await (0, forum_service_1.deleteComment)(postId, commentId, userId);
        res.status(200).json(post);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.deleteCommentController = deleteCommentController;
const toggleLikeController = async (req, res) => {
    try {
        const postId = (0, params_1.asString)(req.params.postId);
        const userId = (0, params_1.asString)(req.params.id);
        const post = await (0, forum_service_1.toggleLike)(postId, userId);
        res.status(200).json(post);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.toggleLikeController = toggleLikeController;
const getUserPostsController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const posts = await (0, forum_service_1.getUserPosts)(userId);
        res.status(200).json(posts);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getUserPostsController = getUserPostsController;
const getPostController = async (req, res) => {
    try {
        const postId = (0, params_1.asString)(req.params.postId);
        const post = await (0, forum_service_1.getPost)(postId);
        res.status(200).json(post);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getPostController = getPostController;
const getAllPostsController = async (req, res) => {
    try {
        const posts = await (0, forum_service_1.getAllPosts)();
        res.status(200).json(posts);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getAllPostsController = getAllPostsController;
const getFeedController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const posts = await (0, forum_service_1.getFeedForUser)(userId);
        res.status(200).json(posts);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getFeedController = getFeedController;
const repostPostController = async (req, res) => {
    try {
        const postId = (0, params_1.asString)(req.params.postId);
        const userId = (0, params_1.asString)(req.params.id);
        const { content } = req.body;
        const post = await (0, forum_service_1.repostPost)(userId, postId, content || "");
        res.status(201).json(post);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.repostPostController = repostPostController;
const getUserRepostsController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const posts = await (0, forum_service_1.getUserReposts)(userId);
        res.status(200).json(posts);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getUserRepostsController = getUserRepostsController;
const getUserAnswersController = async (req, res) => {
    try {
        const userId = (0, params_1.asString)(req.params.id);
        const answers = await (0, forum_service_1.getUserAnswers)(userId);
        res.status(200).json(answers);
    }
    catch (e) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};
exports.getUserAnswersController = getUserAnswersController;
