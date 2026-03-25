import React, { useEffect, useRef, useState } from 'react';
import ForumSession from '../../utils/ForumSession';
import Session from '../../utils/Session';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowUp, FaImage, FaVideo, FaSmile } from 'react-icons/fa';
import PostCard from './PostCard';
import { baseURL } from '../../utils/d';
import { Post, Account } from '../../types';
import { AuthContextType } from '../../contexts/authContext';
import EmojiPicker from '../utils/EmojiPicker';

interface ForumPageProps {
    navigateTo: (path: string) => void;
}

const ForumPage: React.FC<ForumPageProps> = ({ navigateTo }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const { currentUser, isAuthenticated, getUsers, currentUserFriends } = useAuth() as AuthContextType;
    const [loading, setLoading] = useState(true);
    const [newContent, setNewContent] = useState('');
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);
    const [allowComments, setAllowComments] = useState(true);
    const [allowReposts, setAllowReposts] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [knownUsers, setKnownUsers] = useState<Map<string, any>>(new Map());
    const [friendsInfo, setFriendsInfo] = useState<Account[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const premiumTier = currentUser?.premiumTier ?? (currentUser?.badges?.premium ? 'games_one' : null);
    const maxImages = premiumTier ? 10 : 4;
    const maxPostLength = premiumTier ? 2048 : 512;
    const maxUploadSize = premiumTier === 'games_plus' ? 500 * 1024 * 1024 : premiumTier ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    const allowVideo = !!premiumTier;
    const autoPunctuation = currentUser?.settings?.text?.autoPunctuation !== false;

    const applyTextSettings = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed || !autoPunctuation) return trimmed;
        if (/[.!?…]$/.test(trimmed)) return trimmed;
        if (/[A-Za-z0-9À-ÿ)]$/.test(trimmed)) return `${trimmed}.`;
        return trimmed;
    };

    useEffect(() => {
        const fetchPosts = async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }
            try {
                const data = currentUser?._id
                    ? await ForumSession.getFeed(currentUser._id)
                    : await ForumSession.getAllPosts();
                setPosts(data);
            } catch (err) {
                console.error('Erreur récupération posts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [currentUser?._id, isAuthenticated]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getUsers();
                const names = new Map(
                    (users || [])
                        .filter((u) => u.name && u.name !== 'admin' && !u.badges?.admin && !u.badges?.owner)
                        .map((u) => [u.name.toLowerCase(), u])
                );
                setKnownUsers(names);
            } catch (err) {
                console.error('Erreur récupération users:', err);
            }
        };
        fetchUsers();
    }, [getUsers]);

    useEffect(() => {
        const fetchFriendsInfo = async () => {
            if (!currentUserFriends?.length) {
                setFriendsInfo([]);
                return;
            }
            try {
                    const entries = await Promise.all(
                        currentUserFriends.map(async (f) => {
                            try {
                                return await Session.getUserById(f._id);
                            } catch (err) {
                                return null;
                            }
                        })
                    );
                setFriendsInfo(entries.filter((e): e is Account => e !== null));
            } catch (err) {
                setFriendsInfo([]);
            }
        };
        fetchFriendsInfo();
    }, [currentUserFriends]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!showEmojiPicker) return;
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    const handleCreatePost = async () => {
        const finalContent = applyTextSettings(newContent);
        if (!finalContent && newImageFiles.length === 0) return;
        if (finalContent.length > maxPostLength) return;
        if (!currentUser) return;

        if (newImageFiles.length > maxImages) {
            alert(`Vous pouvez ajouter jusqu'à ${maxImages} images.`);
            return;
        }

        const oversized = newImageFiles.find((file) => file.size > maxUploadSize);
        if (oversized) {
            alert('Fichier trop volumineux pour votre offre.');
            return;
        }

        if (newVideoFiles.length > 0) {
            if (!allowVideo) {
                alert('Vidéo réservée aux comptes premium.');
                return;
            }
            if (newVideoFiles.length > 1) {
                alert('Une seule vidéo est autorisée.');
                return;
            }
            const oversizedVideo = newVideoFiles.find((file) => file.size > maxUploadSize);
            if (oversizedVideo) {
                alert('Vidéo trop volumineuse pour votre offre.');
                return;
            }
        }

        let imageUrls: string[] = [];
        let videoUrls: string[] = [];

        if (newImageFiles.length > 0 || newVideoFiles.length > 0) {
            try {
                const formData = new FormData();
                if (currentUser?._id) formData.append('userId', currentUser._id);
                newImageFiles.forEach((file) => formData.append('images', file));
                newVideoFiles.forEach((file) => formData.append('videos', file));
                const res = await fetch(`${baseURL}/create_link`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                    mode: 'cors'
                });
                if (!res.ok) throw new Error("Erreur lors de l'upload de média");
                const data = await res.json();
                imageUrls = data.urls || (data.url ? [data.url] : []);
                videoUrls = data.videoUrls || (data.videoUrl ? [data.videoUrl] : []);
            } catch (err) {
                console.error(err);
                return;
            }
        }

        try {
            const newPost = await ForumSession.createPost(
                currentUser._id,
                finalContent,
                imageUrls,
                null,
                null,
                allowComments,
                allowReposts,
                videoUrls
            );
            setPosts((prev) => [newPost, ...prev]);
            setNewContent('');
            setNewImageFiles([]);
            setNewVideoFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (videoInputRef.current) videoInputRef.current.value = '';
            setAllowComments(true);
            setAllowReposts(true);
        } catch (err) {
            console.error('Erreur création post:', err);
        }
    };

    const handleToggleLike = async (postId: string) => {
        if (!currentUser) return;
        try {
            const updated = await ForumSession.toggleLike(currentUser._id, postId);
            setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
        } catch (err) {
            console.error('Erreur like:', err);
        }
    };

    const handleAddComment = async (postId: string, content: string, images: string[] = []) => {
        if ((!content.trim() && images.length === 0) || !currentUser) return;
        try {
            const updated = await ForumSession.addComment(currentUser._id, postId, content, images);
            setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
        } catch (err) {
            console.error('Erreur ajout commentaire:', err);
        }
    };

    const handleRepost = async (postId: string, content = '') => {
        if (!currentUser) return Promise.reject();
        try {
            const repost = await ForumSession.repostPost(currentUser._id, postId, content);
            setPosts((prev) => [repost, ...prev]);
            return repost;
        } catch (err) {
            console.error('Erreur repost:', err);
            return Promise.reject(err);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!currentUser) return;
        try {
            await ForumSession.deletePost(currentUser._id, postId);
            setPosts((prev) => prev.filter((p) => p._id !== postId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdatePost = async (postId: string, content: string) => {
        if (!currentUser) return Promise.reject();
        try {
            const updated = await ForumSession.updatePost(currentUser._id, postId, content);
            setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
            return updated;
        } catch (err) {
            console.error(err);
            return Promise.reject(err);
        }
    };

    const handleDeleteComment = async (postId: string, commentId: string) => {
        if (!currentUser) return;
        try {
            const updated = await ForumSession.deleteComment(currentUser._id, postId, commentId);
            setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
        } catch (err) {
            console.error(err);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="flex flex-col flex-grow items-center justify-center px-4 mt-12">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">Accès réservé</h2>
                <p className="max-w-xl text-center text-white mb-6">
                    Pour voir et publier des posts, vous devez avoir un compte. :)
                </p>
                <div className="flex items-center gap-4 mb-12">
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
                    >
                        Retour
                    </button>
                    <button
                        onClick={() => navigateTo('/login')}
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    >
                        Se connecter / Créer un compte
                    </button>
                </div>
            </main>
        );
    }

    if (loading) return <p className="text-center mt-10">Chargement...</p>;

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-xl p-4 space-y-6 mt-12 mb-12 relative">
                <div className="bg-gray-900 shadow-2xl rounded-2xl border border-gray-700/50 p-6 space-y-4 mb-8">
                    <div className="flex gap-4 items-start">
                        <img
                            src={currentUser?.avatar || ''}
                            alt="avatar"
                            className="w-12 h-12 rounded-full border-2 border-blue-500 shadow-md"
                        />
                        <textarea
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="Exprime-toi..."
                            rows={3}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setAllowComments((prev) => !prev)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${allowComments
                                ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30'
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            Autoriser les réponses
                        </button>
                        <button
                            type="button"
                            onClick={() => setAllowReposts((prev) => !prev)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${allowReposts
                                ? 'bg-green-600 border-green-400 text-white shadow-md shadow-green-600/30'
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            Autoriser les reposts
                        </button>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 relative">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    const selected = Array.from(e.target.files || []);
                                    setNewImageFiles((prev) => {
                                        const merged = [...prev, ...selected];
                                        const seen = new Set<string>();
                                        return merged
                                            .filter((file) => {
                                                const key = `${file.name}:${file.size}:${file.lastModified}`;
                                                if (seen.has(key)) return false;
                                                seen.add(key);
                                                return true;
                                            })
                                            .slice(0, maxImages);
                                    });
                                    e.currentTarget.value = '';
                                }}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700 transition"
                            >
                                <FaImage />
                                <span>Images</span>
                            </button>
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/*"
                                onChange={(e) => setNewVideoFiles(Array.from(e.target.files || []).slice(0, 1))}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (!allowVideo) return;
                                    videoInputRef.current?.click();
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700 transition ${!allowVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <FaVideo />
                                <span>Vidéos</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700 transition"
                            >
                                <FaSmile />
                                <span>Emojis</span>
                            </button>
                            {showEmojiPicker && (
                                <div
                                    ref={emojiPickerRef}
                                    className="absolute left-0 top-12 z-30 w-[320px] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl"
                                >
                                    <EmojiPicker
                                        premiumTier={premiumTier}
                                        onSelect={(emoji) => {
                                            setNewContent((prev) => `${prev}${emoji}`);
                                            setShowEmojiPicker(false);
                                        }}
                                    />
                                </div>
                            )}
                            {(newImageFiles.length > 0 || newVideoFiles.length > 0) && (
                                <span className="text-sm text-gray-400">
                                    {newImageFiles.length + newVideoFiles.length} / {maxImages + (allowVideo ? 1 : 0)}
                                </span>
                            )}
                        </div>
                        <span
                            className={`text-sm font-semibold ${newContent.length > maxPostLength
                                ? 'text-red-400'
                                : newContent.length > maxPostLength * 0.85
                                    ? 'text-orange-400'
                                    : 'text-gray-400'
                                }`}
                        >
                            {newContent.length}/{maxPostLength}
                        </span>
                    </div>
                    {(newImageFiles.length > 0 || newVideoFiles.length > 0) && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {newImageFiles.map((file, idx) => (
                                <div key={`preview-img-${idx}`} className="relative group">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Prévisualisation ${idx + 1}`}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setNewImageFiles((prev) => prev.filter((_, i) => i !== idx))}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition"
                                    >
                                        X
                                    </button>
                                </div>
                            ))}
                            {newVideoFiles.map((file, idx) => (
                                <div key={`preview-vid-${idx}`} className="relative group">
                                    <video
                                        src={URL.createObjectURL(file)}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-600 bg-black"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setNewVideoFiles((prev) => prev.filter((_, i) => i !== idx))}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition"
                                    >
                                        X
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={handleCreatePost}
                        disabled={newContent.length > maxPostLength}
                        className={`w-full py-2.5 rounded-xl font-semibold transition duration-300 shadow-lg ${newContent.length > maxPostLength
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        Publier
                    </button>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="fixed bottom-4 right-4 p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg z-50"
                    >
                        <FaArrowUp />
                    </button>
                </div>

                {friendsInfo.length > 0 && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6">
                        <h3 className="text-xl font-bold text-white mb-4">Vos amis</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {friendsInfo.map((friend) => (
                                <button
                                    key={friend._id}
                                    onClick={() => navigateTo(`/user/${friend.name}`)}
                                    className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-center"
                                >
                                    <img
                                        src={friend.avatar}
                                        alt={friend.name}
                                        className="w-12 h-12 rounded-full object-cover group-hover:ring-2 ring-blue-500 transition"
                                    />
                                    <span className="text-xs font-semibold text-gray-200 truncate w-full">
                                        {friend.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {posts.map((post) => (
                    <PostCard
                        key={post._id}
                        post={post}
                        isListView={true}
                        currentUserFriends={currentUserFriends.map(f => f._id)}
                        onToggleLike={handleToggleLike}
                        onAddComment={handleAddComment}
                        onDeletePost={handleDeletePost}
                        onDeleteComment={handleDeleteComment}
                        onUpdatePost={handleUpdatePost}
                        onRepost={handleRepost}
                        navigateTo={navigateTo}
                        currentUserId={currentUser?._id}
                        currentUserBadges={currentUser?.badges}
                        currentUserPremiumTier={currentUser?.premiumTier || null}
                        knownUsers={knownUsers}
                    />
                ))}
            </div>
        </div>
    );
};

export default ForumPage;


