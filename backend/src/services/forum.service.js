const ForumModel = require("../models/Forum");

const createPost = async (userId, content, image) => {
  const post = new ForumModel({
    user: userId,
    content,
    image,
  });
  return await post.save();
};

const deletePost = async (postId, userId) => {
  const post = await ForumModel.findOneAndDelete({
    _id: postId,
    user: userId,
  });

  if (!post) throw new Error("Post introuvable ou non autorisé");

  return { success: true };
};

const addComment = async (postId, userId, content) => {
  const post = await ForumModel.findById(postId);
  if (!post) throw new Error("Post introuvable");

  post.comments.push({ user: userId, content });
  await post.save();

  return post;
};

const deleteComment = async (postId, commentId, userId) => {
  const post = await ForumModel.findById(postId);
  if (!post) throw new Error("Post introuvable");

  post.comments = post.comments.filter(
    (c) => c._id.toString() !== commentId || c.user.toString() !== userId,
  );

  await post.save();
  return post;
};

const toggleLike = async (postId, userId) => {
  const post = await ForumModel.findById(postId);
  if (!post) throw new Error("Post introuvable");

  const index = post.likes.findIndex((id) => id.toString() === userId);

  if (index > -1) {
    post.likes.splice(index, 1);
  } else {
    post.likes.push(userId);
  }

  await post.save();
  return post;
};

const getUserPosts = async (userId) => {
  return await ForumModel.find({ user: userId })
    .sort({ createdAt: -1 });
};

const getPost = async (postId) => {
  return await ForumModel.findById(postId)
};

const getAllPosts = async () => {
  return await ForumModel.find({})
    .sort({ createdAt: -1 });
};

module.exports = {
  createPost,
  deletePost,
  addComment,
  deleteComment,
  toggleLike,
  getUserPosts,
  getPost,
  getAllPosts
};
