import React, { useEffect, useState } from 'react';
import ForumSession from '../../utils/ForumSession';
import PostCard from './PostCard';
import { useAuth } from '../../hooks/useAuth';
import { AuthContextType } from '../../contexts/authContext';
import { Post } from '../../types';

interface ForumPostProps {
    postId: string;
    navigateTo: (path: string) => void;
}

const ForumPost: React.FC<ForumPostProps> = ({ postId, navigateTo }) => {
    const { currentUser, isAuthenticated, getUsers, currentUserFriends } = useAuth() as AuthContextType;
    const [post, setPost] = useState<Post | null>(null);
    const [knownUsers, setKnownUsers] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getUsers();
                const names = new Map(
                    (users || [])
                        .filter((u) => u.name && u.name !== 'admin' && !u.badges?.admin && !u.badges?.owner)
                        .map((u) => [u.name.toLowerCase(), u.name])
                );
                setKnownUsers(names);
            } catch (err) {
                console.error('Erreur récupération users:', err);
            }
        };
        fetchUsers();
    }, [getUsers]);

    useEffect(() => {
        const fetchPost = async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }
            try {
                const data = await ForumSession.getPost(postId);
                setPost(data);
            } catch (err) {
                console.error('Erreur récupération post:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId, isAuthenticated]);

    const handleToggleLike = async (postIdValue?: string) => {
        const targetId = postIdValue || post?._id;
        if (!targetId || !currentUser) return;
        try {
            const updated = await ForumSession.toggleLike(currentUser._id, targetId);
            setPost(updated);
        } catch (err) {
            console.error('Erreur like:', err);
        }
    };

    const handleAddComment = async (postIdValue: string, content: string, images: string[] = []) => {
        if ((!content.trim() && images.length === 0) || !currentUser) return;
        try {
            const updated = await ForumSession.addComment(currentUser._id, postIdValue, content, images);
            setPost(updated);
        } catch (err) {
            console.error('Erreur ajout commentaire:', err);
        }
    };

    const handleUpdatePost = async (postIdValue: string, content: string) => {
        if (!currentUser) return Promise.reject();
        try {
            const updated = await ForumSession.updatePost(currentUser._id, postIdValue, content);
            setPost(updated);
            return updated;
        } catch (err) {
            console.error(err);
            return Promise.reject(err);
        }
    };

    const handleDeletePost = async (postIdValue: string) => {
        if (!currentUser) return;
        try {
            await ForumSession.deletePost(currentUser._id, postIdValue);
            setPost(null);
        } catch (err) {
            console.error(err);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="flex flex-col flex-grow items-center justify-center px-4 mt-12">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">Accès réservé</h2>
                <p className="max-w-xl text-center text-white mb-6">
                    Pour voir ce post, vous devez avoir un compte. :)
                </p>
                <div className="flex items-center gap-4">
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

    if (loading) return <p className="text-center mt-10 text-white">Chargement...</p>;

    if (!post) {
        return (
            <main className="flex flex-col flex-grow items-center justify-center px-4 mt-12">
                <h2 className="text-3xl font-bold text-center mb-4 text-white">Post introuvable</h2>
                <button
                    onClick={() => navigateTo('/forum')}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                    Retour au forum
                </button>
            </main>
        );
    }

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-xl p-4 space-y-6 mt-12 mb-12">
                <PostCard
                    post={post}
                    isListView={false}
                    currentUserFriends={currentUserFriends.map(f => f._id)}
                    onToggleLike={handleToggleLike}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    onDeleteComment={() => { }}
                    onUpdatePost={handleUpdatePost}
                    onRepost={(id, content) => currentUser ? ForumSession.repostPost(currentUser._id, id, content) : Promise.reject()}
                    navigateTo={navigateTo}
                    currentUserId={currentUser?._id}
                    currentUserBadges={currentUser?.badges}
                    currentUserPremiumTier={currentUser?.premiumTier || null}
                    knownUsers={knownUsers}
                />
            </div>
        </div>
    );
};

export default ForumPost;


