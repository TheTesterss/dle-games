const express = require("express");
const {
  createPostController,
  deletePostController,
  addCommentController,
  deleteCommentController,
  toggleLikeController,
  getUserPostsController,
  getPostController,
  getAllPostsController,
} = require("../controllers/forum.controller");

const router = express.Router();
router.post("/:id/posts", createPostController);
router.delete("/:id/posts/:postId", deletePostController);
router.post("/:id/posts/:postId/comments", addCommentController);
router.delete(
  "/:id/posts/:postId/comments/:commentId",
  deleteCommentController,
);
router.get("/posts", getAllPostsController)
router.post("/:id/posts/:postId/like", toggleLikeController);
router.get("/:id/posts", getUserPostsController);
router.get("/posts/:postId", getPostController);

module.exports = router;
