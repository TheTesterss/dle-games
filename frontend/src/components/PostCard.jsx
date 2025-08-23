import React, { useState, useEffect } from 'react';
import Session from '../utils/Session';
import { FaHeart, FaRegHeart, FaCommentDots } from "react-icons/fa";

const PostCard = ({ post, onToggleLike, onAddComment, onDeletePost, onDeleteComment, navigateTo, currentUserId }) => {
  const [commentInput, setCommentInput] = useState('');
  const hasLiked = post.likes.some(id => id.toString() === currentUserId);
  const [comments, setComments] = useState(post.comments || []);
  const [user, setUser] = useState(post.user || {});

  useEffect(() => {
    const fetchComments = async () => {
      const foundComments = await Promise.all(post.comments.map(async (c) => {
        const u = await Session.getUserById(c.user);
        return { ...c, user: u };
      }));
      setComments(foundComments);
    };

    const fetchUser = async () => {
      const foundUser = await Session.getUserById(post.user);
      setUser(foundUser);
    };

    fetchUser();
    fetchComments();
  }, [post.comments, post.user]);

  return (
    <div className="bg-gray-900 shadow-lg rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <img src={user.avatar || 'https://placehold.co/100x100/007bff/ffffff?text=U'} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex flex-col">
          <span className="font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => navigateTo(`/user/${user.name}`)}>{user.name || "Utilisateur inconnu"}</span>
          <span className="text-gray-500 text-xs">{new Date(post.createdAt).toLocaleString()}</span>
        </div>
        {post.user === currentUserId && (
          <button onClick={() => onDeletePost(post._id)} className="ml-auto text-red-500 hover:text-red-700 font-bold">Supprimer</button>
        )}
      </div>

      <p className="mb-3 text-gray-500 font-bold ml-1 text-left">{post.content}</p>
      {post.image && (
  <img
    src={post.image}
    alt="post"
    className="w-full max-h-[500px] object-cover rounded-xl mb-4"
  />
)}


      <div className="flex items-center gap-5 text-gray-600 mb-4">
        <button onClick={() => onToggleLike(post._id)} className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors duration-200">
          {hasLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />} <span className="ml-1">{post.likes.length}</span>
        </button>
        <div className="flex items-center gap-1"><FaCommentDots /><span>{post.comments.length}</span></div>
      </div>

      <div className="space-y-3 mb-3">
        {comments.map(c => (
          <div key={c._id} className="flex items-start gap-3 bg-gray-900 p-3 rounded-xl">
            <img src={c.user.avatar || '/default-avatar.png'} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-semibold text-blue-600 cursor-pointer hover:underline text-sm" onClick={() => navigateTo(`/user/${c.user.name}`)}>{c.user.name}</span>
                {c.user._id === currentUserId && (
                  <button onClick={() => onDeleteComment(post._id, c._id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Supprimer</button>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1 ml-1 text-left">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Écrire un commentaire..." className="flex-1 border bg-gray-800 ring-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <button onClick={() => { if (commentInput.trim()) { onAddComment(post._id, commentInput.trim()); setCommentInput(''); } }} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors duration-200">Envoyer</button>
      </div>
    </div>
  );
};

export default PostCard;