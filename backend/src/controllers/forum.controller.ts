import { Request, Response } from "express";
import {
    createPost,
    deletePost,
    addComment,
    deleteComment,
    toggleLike,
    getUserPosts,
    getPost,
    getAllPosts,
    getFeedForUser,
    repostPost,
    getUserReposts,
    getUserAnswers,
    updatePost,
    togglePinPost,
} from "../services/forum.service";
import { asString } from "../utils/params";

export const createPostController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content, image, images, video, videos, repostOf, allowComments, allowReposts } = req.body;
        const userId = asString(req.params.id);

        const imageList = Array.isArray(images) ? images : (images ? [images] : []);
        const videoList = Array.isArray(videos) ? videos : (videos ? [videos] : []);
        const post = await createPost(
            userId,
            content,
            imageList,
            image || null,
            repostOf || null,
            allowComments !== false,
            allowReposts !== false,
            videoList,
            video || null
        );
        res.status(201).json(post);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const deletePostController = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = asString(req.params.postId);
        const userId = asString(req.params.id);

        const result = await deletePost(postId, userId);
        res.status(200).json(result);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const updatePostController = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = asString(req.params.postId);
        const userId = asString(req.params.id);
        const { content } = req.body;

        const post = await updatePost(postId, userId, content || "");
        res.status(200).json(post);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const togglePinPostController = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = asString(req.params.postId);
        const userId = asString(req.params.id);
        const post = await togglePinPost(postId, userId);
        res.status(200).json(post);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const addCommentController = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = asString(req.params.postId);
        const { content, images, videos } = req.body;
        const userId = asString(req.params.id);

        const imageList = Array.isArray(images) ? images : (images ? [images] : []);
        const videoList = Array.isArray(videos) ? videos : (videos ? [videos] : []);
        const post = await addComment(postId, userId, content, imageList, videoList);
        res.status(200).json(post);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const deleteCommentController = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = asString(req.params.postId);
        const commentId = asString(req.params.commentId);
        const userId = asString(req.params.id);

        const post = await deleteComment(postId, commentId, userId);
        res.status(200).json(post);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const toggleLikeController = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = asString(req.params.postId);
        const userId = asString(req.params.id);

        const post = await toggleLike(postId, userId);
        res.status(200).json(post);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getUserPostsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const posts = await getUserPosts(userId);
        res.status(200).json(posts);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getPostController = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = asString(req.params.postId);
        const post = await getPost(postId);
        res.status(200).json(post);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getAllPostsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const posts = await getAllPosts();
        res.status(200).json(posts);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getFeedController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const posts = await getFeedForUser(userId);
        res.status(200).json(posts);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const repostPostController = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = asString(req.params.postId);
        const userId = asString(req.params.id);
        const { content } = req.body;

        const post = await repostPost(userId, postId, content || "");
        res.status(201).json(post);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getUserRepostsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const posts = await getUserReposts(userId);
        res.status(200).json(posts);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};

export const getUserAnswersController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = asString(req.params.id);
        const answers = await getUserAnswers(userId);
        res.status(200).json(answers);
    } catch (e: any) {
        res.status(500).json({ message: e.message || e, code: 500 });
    }
};



