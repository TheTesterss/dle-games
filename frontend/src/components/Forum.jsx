import { useEffect, useState } from 'react';
import ForumSession from '../utils/ForumSession';
import { useAuth } from '../hooks/useAuth';
import { FaArrowUp } from "react-icons/fa";
import PostCard from './PostCard';
import Session from '../utils/Session';
import { baseURL } from '../utils/d';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ForumPage = ({ navigateTo }) => {
  const [posts, setPosts] = useState([]);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await ForumSession.getAllPosts();
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(sorted);
      } catch (err) {
        console.error('Erreur récupération posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!newContent.trim() && !newImage && !newImageFile) return;

    let imageUrl = newImage.trim() || null;

    if (newImageFile) {
      if (newImageFile.size > MAX_IMAGE_SIZE) {
        alert("Image trop volumineuse (max 5MB)");
        return;
      }
      try {
        const formData = new FormData();
        formData.append('image', newImageFile);
        const res = await fetch(`${baseURL}/create_link`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          mode: 'cors'
        });
        if (!res.ok) throw new Error("Erreur lors de l'upload de l'image");
        const data = await res.json();
        imageUrl = data.url;
      } catch (err) {
        console.error(err);
        return;
      }
    }

    try {
      const newPost = await ForumSession.createPost(currentUser._id, newContent, imageUrl);
      setPosts(prev => [newPost, ...prev]);
      setNewContent('');
      setNewImage('');
      setNewImageFile(null);
    } catch (err) {
      console.error('Erreur création post:', err);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const updated = await ForumSession.toggleLike(currentUser._id, postId);
      setPosts(prev => prev.map(p => (p._id === postId ? updated : p)));
    } catch (err) {
      console.error('Erreur like:', err);
    }
  };

  const handleAddComment = async (postId, content) => {
    if (!content.trim()) return;
    try {
      const updated = await ForumSession.addComment(currentUser._id, postId, content);
      setPosts(prev => prev.map(p => (p._id === postId ? updated : p)));
    } catch (err) {
      console.error('Erreur ajout commentaire:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await ForumSession.deletePost(currentUser._id, postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const updated = await ForumSession.deleteComment(currentUser._id, postId, commentId);
      setPosts(prev => prev.map(p => (p._id === postId ? updated : p)));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl p-4 space-y-6 mt-12 mb-12 relative">
        <div className="bg-gray-900 shadow-2xl rounded-2xl border border-gray-700/50 p-6 space-y-4 mb-8">
          <div className="flex gap-4 items-start">
            <img src={currentUser.avatar || ''} alt="avatar" className="w-12 h-12 rounded-full border-2 border-blue-500 shadow-md" />
            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Exprime-toi..." rows={3} className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <input
  type="file"
  accept="image/*"
  onChange={(e) => setNewImageFile(e.target.files[0])}
  className="w-full text-sm text-gray-200 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 cursor-pointer
             file:bg-blue-500 file:text-white file:px-3 file:py-1 file:rounded-full file:border-0
             hover:file:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
          <button onClick={handleCreatePost} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition duration-300 shadow-lg">Publier</button>
          <button
  onClick={() => scrollTo({ top: 400, behavior: 'smooth' })}
  className="fixed bottom-4 right-4 p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg z-50"
>
  <FaArrowUp />
</button>
        </div>

        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onToggleLike={handleToggleLike}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
            navigateTo={navigateTo}
            currentUserId={currentUser._id}
          />
        ))}
      </div>
    </div>
  );
};

export default ForumPage;
