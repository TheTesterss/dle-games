const {
  createPost,
  deletePost,
  addComment,
  deleteComment,
  toggleLike,
  getUserPosts,
  getPost,
  getAllPosts,
} = require("../services/forum.service");

const createPostController = async (req, res) => {
  try {
    const { content, image } = req.body;
    const userId = req.params.id;

    const post = await createPost(userId, content, image);
    res.status(201).json(post);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

const deletePostController = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.params.id;

    const result = await deletePost(postId, userId);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

const addCommentController = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.params.id;

    const post = await addComment(postId, userId, content);
    res.status(200).json(post);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

const deleteCommentController = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.params.id;

    const post = await deleteComment(postId, commentId, userId);
    res.status(200).json(post);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

const toggleLikeController = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.params.id;

    const post = await toggleLike(postId, userId);
    res.status(200).json(post);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

const getUserPostsController = async (req, res) => {
  try {
    const userId = req.params.id;
    const posts = await getUserPosts(userId);
    res.status(200).json(posts);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

const getPostController = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await getPost(postId);
    res.status(200).json(post);
  } catch (e) {
    res.status(500).json({ message: e, code: 500 });
  }
};

const getAllPostsController = async (req, res) => {
    try {
        const posts = await getAllPosts();
        res.status(200).json(posts);
    } catch (e) {
        res.status(500).json({ message: e, code: 500 });
    }
};

module.exports = {
  createPostController,
  deletePostController,
  addCommentController,
  deleteCommentController,
  toggleLikeController,
  getUserPostsController,
  getPostController,
  getAllPostsController
};
