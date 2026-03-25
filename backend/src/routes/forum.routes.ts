import { Router } from "express";
import {
    createPostController,
    deletePostController,
    addCommentController,
    deleteCommentController,
    toggleLikeController,
    getUserPostsController,
    getPostController,
    getAllPostsController,
    getFeedController,
    repostPostController,
    getUserRepostsController,
    getUserAnswersController,
    updatePostController,
    togglePinPostController,
} from "../controllers/forum.controller";

const router = Router();

router.post("/:id/posts", createPostController);
router.patch("/:id/posts/:postId", updatePostController);
router.patch("/:id/posts/:postId/pin", togglePinPostController);
router.delete("/:id/posts/:postId", deletePostController);
router.post("/:id/posts/:postId/comments", addCommentController);
router.post("/:id/posts/:postId/repost", repostPostController);
router.delete(
    "/:id/posts/:postId/comments/:commentId",
    deleteCommentController,
);
router.get("/posts", getAllPostsController)
router.post("/:id/posts/:postId/like", toggleLikeController);
router.get("/:id/posts", getUserPostsController);
router.get("/:id/reposts", getUserRepostsController);
router.get("/:id/answers", getUserAnswersController);
router.get("/:id/feed", getFeedController);
router.get("/posts/:postId", getPostController);

export default router;
