import React, { useState, useEffect, useRef } from 'react';
import ForumSession from '../../utils/ForumSession';
import AdminSession from '../../utils/AdminSession';
import { useAuth } from '../../hooks/useAuth';
import PostCard from '../forum/PostCard';
import MentionText from '../utils/MentionText';
import GiftCard, { extractGiftCodes } from '../features/GiftCard';
import { baseURL } from '../../utils/d';
import {
    FaCrown,
    FaCheckCircle,
    FaGem,
    FaTrophy,
    FaMedal,
    FaCheck,
    FaUserShield,
    FaGamepad,
    FaChartBar,
    FaTimesCircle,
    FaBolt
} from 'react-icons/fa';
import { Account, Post } from '../../types';

interface UserProfileProps {
    navigateTo: (path: string) => void;
    name: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ navigateTo, name }) => {
    const { currentUser, sendFriendRequest, getUser, getUsers, updateUser, currentUserFriends } = useAuth();
    const [foundUser, setFoundUser] = useState<Partial<Account>>({
        _id: '-1',
        name: 'Unknown User',
        avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
        badges: {
            owner: false,
            verified: false,
            premium: false,
            admin: false,
            ranking: { tier: 'none', top10: false, dailyCheck: false }
        },
        stats: {
            matchesPlayed: 0,
            victories: 0,
            losses: 0,
            winRate: 0,
            favoriteGame: 'Unknown Game',
            longestStreak: 0,
            mostPlayedOpponent: 'Unknown Opponent',
            pokemon: {
                solo: { victories: 0, matchesPlayed: 0, winRate: 0, longestStreak: 0 },
                multi_unique: { victories: 0, matchesPlayed: 0, winRate: 0, longestStreak: 0 },
                multi_same: { victories: 0, matchesPlayed: 0, winRate: 0, longestStreak: 0 },
                multi_turn: { victories: 0, matchesPlayed: 0, winRate: 0, longestStreak: 0 }
            }
        },
        desactivated: false
    });
    const [message, setMessage] = useState('');
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [userReposts, setUserReposts] = useState<Post[]>([]);
    const [userAnswers, setUserAnswers] = useState<Array<{ post: Post; answers: any[] }>>([]);
    const [visiblePosts, setVisiblePosts] = useState(5);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'answers'>('posts');
    const [statsTab, setStatsTab] = useState<'global' | 'solo' | 'multi_unique' | 'multi_same' | 'multi_turn'>('global');
    const [knownUsers, setKnownUsers] = useState<Map<string, string>>(new Map());
    const [bioInput, setBioInput] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [profileMessage, setProfileMessage] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [bannerUploading, setBannerUploading] = useState(false);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const isAdmin = !!(currentUser?.badges?.admin || currentUser?.badges?.owner);
    const isSelf = !!(currentUser?._id && currentUser._id === foundUser._id);

    useEffect(() => {
        const fetchUser = async () => {
            if (!name || name === 'undefined') {
                navigateTo('/');
                return;
            }
            try {
                const user = await getUser(name);
                if (!user) return;

                const u: any = { ...user };
                if (user.createdAt) {
                    const date = new Date(user.createdAt);
                    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
                    u.inscription = new Intl.DateTimeFormat('fr-FR', options).format(date);
                }
                setFoundUser(u);
                setBioInput(u.bio || '');
                setNameInput(u.name || '');

                if (u._id && u._id !== '-1') {
                    try {
                        setLoadingPosts(true);
                        const [posts, reposts, answers] = await Promise.all([
                            ForumSession.getUserPosts(u._id),
                            ForumSession.getUserReposts(u._id),
                            ForumSession.getUserAnswers(u._id)
                        ]);
                        setUserPosts(posts || []);
                        setUserReposts(reposts || []);
                        setUserAnswers(answers || []);
                    } catch (error) {
                        console.error('Erreur lors du chargement des posts:', error);
                    } finally {
                        setLoadingPosts(false);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
    }, [name, getUser, navigateTo]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersList = await getUsers();
                const names = new Map(
                    (usersList || [])
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

    const handleAddFriend = () => {
        if (!currentUser?._id) {
            navigateTo('/login');
        } else if (foundUser._id) {
            sendFriendRequest(currentUser._id, foundUser._id)
                .then(() => {
                    setMessage("Demande d'ami envoyée !");
                })
                .catch((err) => {
                    console.error(err);
                    setMessage("Erreur lors de l'envoi de la demande d'ami.");
                });
        }
    };


    const uploadSingleImage = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('image', file);
            if (currentUser?._id) formData.append('userId', currentUser._id);
            const res = await fetch(`${baseURL}/create_link`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.url || null;
        } catch (err) {
            return null;
        }
    };

    const handleAvatarChange = async (file: File) => {
        if (!isSelf || !currentUser) return;
        setAvatarUploading(true);
        const url = await uploadSingleImage(file);
        if (url) {
            try {
                const updated = await updateUser({ avatar: url });
                setFoundUser((prev) => ({ ...prev, avatar: updated.avatar }));
                setProfileMessage('Avatar mis à jour.');
            } catch (err) {
                setProfileMessage("Erreur lors de la mise à jour de l'avatar.");
            }
        } else {
            setProfileMessage("Impossible d'uploader l'avatar.");
        }
        setAvatarUploading(false);
    };

    const handleBannerChange = async (file: File) => {
        if (!isSelf || !currentUser) return;
        const isPremium = !!(currentUser?.premiumTier || currentUser?.badges?.premium);
        if (!isPremium) {
            setProfileMessage('Bannière image réservée aux comptes premium.');
            return;
        }
        setBannerUploading(true);
        const url = await uploadSingleImage(file);
        if (url) {
            try {
                const updated = await updateUser({ banner: url });
                setFoundUser((prev) => ({ ...prev, banner: updated.banner }));
                setProfileMessage('Bannière mise à jour.');
            } catch (err) {
                setProfileMessage("Erreur lors de la mise à jour de la bannière.");
            }
        } else {
            setProfileMessage("Impossible d'uploader la bannière.");
        }
        setBannerUploading(false);
    };

    const handleSaveBio = async () => {
        if (!isSelf || !currentUser) return;
        try {
            const updated = await updateUser({ bio: bioInput });
            setFoundUser((prev) => ({ ...prev, bio: updated.bio }));
            setProfileMessage('Bio mise à jour.');
        } catch (err) {
            setProfileMessage('Erreur lors de la mise à jour de la bio.');
        }
    };

    const handleSaveName = async () => {
        if (!isSelf || !currentUser) return;
        const trimmed = nameInput.trim();
        if (!trimmed) return;
        try {
            const updated = await updateUser({ name: trimmed });
            setFoundUser((prev) => ({ ...prev, name: updated.name }));
            setProfileMessage('Pseudo mis à jour.');
        } catch (err) {
            setProfileMessage('Erreur lors de la mise à jour du pseudo.');
        }
    };
    const handleLoadMorePosts = () => {
        setVisiblePosts((prev) => prev + 5);
    };

    const handleToggleLike = async (postId: string) => {
        if (!currentUser?._id) return;
        try {
            await ForumSession.toggleLike(currentUser._id, postId);
        } catch (err) {
            console.error('Erreur like:', err);
        }
    };

    const handleAddComment = async (postId: string, content: string, images: string[] = []) => {
        if (!currentUser?._id || (!content.trim() && images.length === 0)) return;
        try {
            await ForumSession.addComment(currentUser._id, postId, content, images);
        } catch (err) {
            console.error('Erreur ajout commentaire:', err);
        }
    };

    const handleRepost = async (postId: string, content = '') => {
        if (!currentUser?._id) return;
        try {
            await ForumSession.repostPost(currentUser._id, postId, content);
        } catch (err) {
            console.error('Erreur repost:', err);
        }
    };
    const handleUpdatePost = async (postId: string, content: string) => {
        if (!currentUser?._id) return Promise.reject();
        try {
            const updated = await ForumSession.updatePost(currentUser._id, postId, content);
            setUserPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
            setUserReposts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
            return updated;
        } catch (err) {
            console.error(err);
            return Promise.reject(err);
        }
    };

    const handleTogglePin = async (postId: string) => {
        if (!currentUser?._id) return Promise.reject();
        try {
            const updated = await ForumSession.togglePinPost(currentUser._id, postId);
            setUserPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
            return updated;
        } catch (err) {
            console.error(err);
            return Promise.reject(err);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!currentUser?._id) return;
        try {
            await ForumSession.deletePost(currentUser._id, postId);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteComment = async (postId: string, commentId: string) => {
        if (!currentUser?._id) return;
        try {
            await ForumSession.deleteComment(currentUser._id, postId, commentId);
        } catch (err) {
            console.error(err);
        }
    };

    const handleModerateUser = async () => {
        if (!isAdmin || !currentUser?._id || !foundUser?._id) return;
        try {
            const updated = await AdminSession.moderateUser(currentUser._id, foundUser._id, !foundUser.desactivated);
            setFoundUser((prev) => ({ ...prev, desactivated: updated.desactivated }));
        } catch (err) {
            console.error(err);
        }
    };

    const renderBadges = () => (
        <span className="flex items-center gap-1 ml-2">
            {foundUser.badges?.owner && <FaCrown className="text-yellow-400" title="Owner" />}
            {foundUser.badges?.verified && <FaCheckCircle className="text-blue-400" title="Verified" />}
            {foundUser.badges?.premium && (
                <FaGem
                    className="text-pink-400"
                    title={
                        foundUser.premiumTier === 'games_plus'
                            ? 'Premium (Games Plus)'
                            : foundUser.premiumTier === 'games_one'
                              ? 'Premium (Games One)'
                              : 'Premium'
                    }
                />
            )}
            {foundUser.badges?.admin && <FaUserShield className="text-red-400" title="Admin" />}
            {foundUser.badges?.ranking?.tier && foundUser.badges.ranking.tier !== 'none' && (
                <FaTrophy
                    className={
                        foundUser.badges.ranking.tier === 'gold'
                            ? 'text-yellow-400'
                            : foundUser.badges.ranking.tier === 'silver'
                                ? 'text-gray-300'
                                : 'text-orange-400'
                    }
                    title="Top classement"
                />
            )}
            {foundUser.badges?.ranking?.top10 && <FaMedal className="text-purple-300" title="Top 10" />}
            {foundUser.badges?.ranking?.dailyCheck && <FaCheck className="text-green-400" title="Check quotidien" />}
        </span>
    );

        const pinnedPosts = userPosts.filter((p) => !p.repostOf && p.pinnedOnProfile);
    const regularPosts = userPosts.filter((p) => !p.repostOf && !p.pinnedOnProfile);
    const totalPosts = pinnedPosts.length + regularPosts.length;
    const postsToShow = [...pinnedPosts, ...regularPosts].slice(0, visiblePosts);
    const hasMorePosts = totalPosts > visiblePosts;

    const renderStatsContent = () => {
        let stats: any = foundUser.stats || {};
        let isMode = false;

        if (statsTab === 'solo') {
            stats = foundUser.stats?.pokemon?.solo || {};
            isMode = true;
        } else if (statsTab === 'multi_unique') {
            stats = foundUser.stats?.pokemon?.multi_unique || {};
            isMode = true;
        } else if (statsTab === 'multi_same') {
            stats = foundUser.stats?.pokemon?.multi_same || {};
            isMode = true;
        } else if (statsTab === 'multi_turn') {
            stats = foundUser.stats?.pokemon?.multi_turn || {};
            isMode = true;
        }

        const matches = stats.matchesPlayed || 0;
        const wins = stats.victories || 0;
        const losses = stats.losses || 0;
        const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) : 0;
        const streak = stats.longestStreak || 0;

        const mutualFriendIds = isSelf
        ? []
        : (currentUserFriends || [])
              .map((f) => f._id)
              .filter((id) => foundUser.friends?.includes(id));
    const mutualFriends = (currentUserFriends || []).filter((f) => mutualFriendIds.includes(f._id));
    return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                <StatCard title="Parties jouées" value={matches} icon={<FaGamepad />} />
                <StatCard title="Victoires" value={wins} color="text-green-400" icon={<FaTrophy />} />
                <StatCard title="Défaites" value={losses} color="text-red-400" icon={<FaTimesCircle />} />
                <StatCard
                    title="Taux de victoire"
                    value={`${winRate}%`}
                    color="text-yellow-400"
                    icon={<FaChartBar />}
                />
                <StatCard title="Meilleure Série" value={streak} color="text-purple-400" icon={<FaBolt />} />
                {!isMode && (
                    <>
                        <StatCard title="Jeu préféré" value={stats.favoriteGame || '-'} />
                        <StatCard title="Adversaire fréquent" value={stats.mostPlayedOpponent || '-'} />
                    </>
                )}
            </div>
        );
    };

    const canEditBanner = isSelf && !!(currentUser?.premiumTier || currentUser?.badges?.premium);
    const mutualFriendIds = isSelf
        ? []
        : (currentUserFriends || [])
              .map((f) => f._id)
              .filter((id) => foundUser.friends?.includes(id));
    const mutualFriends = (currentUserFriends || []).filter((f) => mutualFriendIds.includes(f._id));
    return (
        <div className="w-full">
            <div className="max-w-6xl mx-auto px-4">
                <div className="relative mb-10 w-full overflow-hidden rounded-2xl border border-gray-800 shadow-2xl">
                <div
                    className="h-40 md:h-52 w-full bg-gradient-to-r from-blue-900/70 via-indigo-900/70 to-gray-900/70 cursor-pointer"
                    style={{
                        backgroundImage: foundUser.banner ? `url(${foundUser.banner})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                    onClick={() => {
                        if (canEditBanner) bannerInputRef.current?.click();
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gray-950/80 to-transparent pointer-events-none" />
                {isSelf && (
                    <div className="absolute inset-0 flex items-start justify-end p-4">
                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleBannerChange(file);
                            }}
                        />
                        <button
                            onClick={() => {
                                if (canEditBanner) bannerInputRef.current?.click();
                            }}
                            className={`px-4 py-2 rounded-full bg-black/60 text-white text-xs font-bold transition ${canEditBanner ? 'hover:bg-black/80' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            {bannerUploading ? 'Upload...' : 'Modifier la bannière'}
                        </button>
                    </div>
                )}
                {isSelf && (
                    <div className="absolute left-6 bottom-4 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                        {canEditBanner ? 'Cliquer pour changer la bannière' : 'Bannière image réservée au premium'}
                    </div>
                )}
            </div>
            </div>
            <div className="max-w-6xl mx-auto py-12 gap-12 min-h-[70vh] px-4">
                <div className="flex flex-col md:flex-row gap-12 mb-12">
                <aside className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 p-8 flex flex-col items-center w-full md:w-1/3 mx-auto md:mx-0 h-fit">
                    <div className="relative mb-4">
                        <img
                            src={foundUser.avatar}
                            alt={foundUser.name}
                            className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg object-cover cursor-pointer"
                            onClick={() => isSelf && avatarInputRef.current?.click()}
                        />
                        {isSelf && (
                            <>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleAvatarChange(file);
                                    }}
                                />
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute -bottom-2 right-0 px-3 py-1 rounded-full bg-gray-900 text-[10px] font-bold text-white border border-gray-700 hover:bg-gray-800"
                                >
                                    {avatarUploading ? '...' : 'Changer'}
                                </button>
                            </>
                        )}
                    </div>
                    <h2 className="text-3xl font-extrabold text-blue-500 mb-4 flex items-center justify-center flex-wrap">
                        {foundUser.name}
                        {renderBadges()}
                    </h2>
                    {isSelf && (
                        <div className="w-full mb-4 space-y-3">
                            <div className="flex gap-2">
                                <input
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                                    placeholder="Pseudo"
                                />
                                <button
                                    onClick={handleSaveName}
                                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                                >
                                    Sauver
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                <textarea
                                    value={bioInput}
                                    onChange={(e) => setBioInput(e.target.value)}
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                                    placeholder="Votre bio..."
                                />
                                <button
                                    onClick={handleSaveBio}
                                    className="self-end px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                                >
                                    Mettre à jour
                                </button>
                            </div>
                        </div>
                    )}
                    {!isSelf && foundUser.bio && (
                        <p className="text-sm text-gray-300 text-center mb-4">{foundUser.bio}</p>
                    )}
                    {isAdmin && currentUser?._id !== foundUser._id && (
                        <div className="flex flex-col gap-2 w-full mb-4">
                            <button
                                onClick={handleModerateUser}
                                className={`w-full px-6 py-2 rounded-lg font-bold transition duration-300 ${foundUser.desactivated ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                            >
                                {foundUser.desactivated ? 'Réactiver le compte' : 'Modérer le compte'}
                            </button>
                            <button
                                onClick={() => navigateTo(`/admin/user/${foundUser._id}`)}
                                className="w-full px-6 py-2 rounded-lg font-bold transition duration-300 bg-gray-800 hover:bg-gray-700 text-white"
                            >
                                Voir dashboard admin
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleAddFriend}
                        disabled={!currentUser?._id || currentUser._id === foundUser._id || foundUser._id === '-1'}
                        className={`bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg mb-6 transition duration-300 ${!currentUser?._id || currentUser._id === foundUser._id || foundUser._id === '-1' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Ajouter en ami
                    </button>
                    {profileMessage && (
                        <p className={`text-center text-xs mb-3 ${profileMessage.toLowerCase().includes('erreur') ? 'text-red-400' : 'text-green-400'}`}>
                            {profileMessage}
                        </p>
                    )}
                    {message && (
                        <p
                            className={`text-center text-sm ${message.toLowerCase().includes('successfully') || message.includes('envoyée') ? 'text-green-500' : 'text-red-500'}`}
                        >
                            {message}
                        </p>
                    )}
                                        {!isSelf && mutualFriends.length > 0 && (
                        <div className="w-full mb-4 text-center">
                            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Amis en commun</div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {mutualFriends.slice(0, 6).map((f) => (
                                    <div key={f._id} className="flex items-center gap-2 bg-gray-800/70 rounded-full px-3 py-1">
                                        <img src={f.avatar} className="w-5 h-5 rounded-full" alt={f.name} />
                                        <span className="text-xs text-gray-200">{f.name}</span>
                                    </div>
                                ))}
                                {mutualFriends.length > 6 && (
                                    <span className="text-xs text-gray-400">+{mutualFriends.length - 6}</span>
                                )}
                            </div>
                        </div>
                    )}<div className="w-full mt-auto text-center border-t border-gray-800 pt-4">
                        <p className="text-gray-400">
                            Inscrit le <span className="text-blue-400 font-bold">{(foundUser as any).inscription || 'Indisponible'}</span>
                        </p>
                    </div>
                </aside>

                <section className="relative flex-1 flex flex-col bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden">
                    <div className="p-8 border-b border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="text-3xl font-extrabold text-blue-500 flex items-center gap-3">
                            <FaChartBar /> Statistiques
                        </h3>
                        <div className="flex bg-gray-950 p-1 rounded-lg">
                            {(['global', 'solo', 'multi_unique', 'multi_same', 'multi_turn'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setStatsTab(tab)}
                                    className={`px-3 py-1 rounded-md text-sm font-bold transition ${statsTab === tab ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-8">{renderStatsContent()}</div>
                </section>
            </div>

            <section className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <h3 className="text-3xl font-extrabold text-blue-500 text-center md:text-left">
                        Activité de {foundUser.name}
                    </h3>
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`px-4 py-2 rounded-xl font-semibold transition ${activeTab === 'posts' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                        >
                            Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('reposts')}
                            className={`px-4 py-2 rounded-xl font-semibold transition ${activeTab === 'reposts' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                        >
                            Reposts
                        </button>
                        <button
                            onClick={() => setActiveTab('answers')}
                            className={`px-4 py-2 rounded-xl font-semibold transition ${activeTab === 'answers' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                        >
                            Réponses
                        </button>
                    </div>
                </div>

                {loadingPosts ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : activeTab === 'posts' ? (
                    userPosts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-lg">Aucun post trouvé pour cet utilisateur.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid gap-6">
                                {postsToShow.map((post) => (
                                    <PostCard
                                        key={post._id}
                                        post={post}
                                        onToggleLike={handleToggleLike}
                                        onAddComment={handleAddComment}
                                        onDeletePost={handleDeletePost}
                                        onDeleteComment={handleDeleteComment}
                                        onUpdatePost={handleUpdatePost}
                                        onTogglePin={handleTogglePin}
                                        onRepost={handleRepost}
                                        navigateTo={navigateTo}
                                        currentUserId={currentUser?._id}
                                        currentUserBadges={currentUser?.badges}
                                        currentUserPremiumTier={currentUser?.premiumTier || null}
                                        knownUsers={knownUsers}
                                    />
                                ))}
                            </div>

                            {hasMorePosts && (
                                <div className="flex justify-center pt-6">
                                    <button
                                        onClick={handleLoadMorePosts}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        Voir davantage ({totalPosts - visiblePosts}{' '}
                                        posts restants)
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                ) : activeTab === 'reposts' ? (
                    userReposts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-lg">Aucun repost trouvé.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {userReposts.map((post) => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    onToggleLike={handleToggleLike}
                                    onAddComment={handleAddComment}
                                    onDeletePost={handleDeletePost}
                                    onDeleteComment={handleDeleteComment}
                                    onUpdatePost={handleUpdatePost}
                                        onTogglePin={handleTogglePin}
                                    onRepost={handleRepost}
                                    navigateTo={navigateTo}
                                    currentUserId={currentUser?._id}
                                    currentUserBadges={currentUser?.badges}
                                    currentUserPremiumTier={currentUser?.premiumTier || null}
                                    knownUsers={knownUsers}
                                />
                            ))}
                        </div>
                    )
                ) : userAnswers.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">Aucune réponse trouvée.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {userAnswers.filter((entry) => entry?.post && (entry.answers || []).length > 0).map((entry) => (
                            <AnswerCard
                                key={entry.post?._id}
                                entry={entry}
                                navigateTo={navigateTo}
                                knownUsers={knownUsers}
                                currentUserId={currentUser?._id}
                                isSelf={isSelf}
                                currentUserFriends={currentUserFriends}
                                foundUser={foundUser}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
        </div>
    );
};

interface AnswerCardProps {
    entry: { post: Post; answers: any[] };
    navigateTo: (path: string) => void;
    knownUsers: Map<string, string>;
    currentUserId?: string;
    isSelf: boolean;
    currentUserFriends: Account[];
    foundUser: Partial<Account>;
}

const AnswerCard: React.FC<AnswerCardProps> = ({ entry, navigateTo, knownUsers, currentUserId }) => {
    const { post, answers } = entry;
    return (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-2">Réponses sur ce post</div>
            <PostCard
                post={post}
                onToggleLike={() => {}}
                onAddComment={() => {}}
                onDeletePost={() => {}}
                onDeleteComment={() => {}}
                onRepost={() => Promise.resolve()}
                navigateTo={navigateTo}
                currentUserId={undefined}
                knownUsers={knownUsers}
                currentUserPremiumTier={null}
                isListView
            />
            <div className="space-y-3">
                {answers?.map((answer: any) => (
                    <div key={answer._id} className="bg-gray-900 rounded-xl p-3">
                        <MentionText
                            text={answer.content}
                            knownUsers={knownUsers}
                            onUserClick={(name) => navigateTo(`/user/${name}`)}
                            className="text-gray-300 text-sm"
                        />
                        {extractGiftCodes(answer.content || '').map((code) => (
                            <GiftCard key={`gift-answer-${answer._id}-${code}`} code={code} currentUserId={currentUserId} />
                        ))}
                        {answer.images && answer.images.length > 0 && (
                            <div
                                className={`grid gap-2 mt-2 ${answer.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
                            >
                                {answer.images.map((img: string, idx: number) => (
                                    <img
                                        key={`${img}-${idx}`}
                                        src={img}
                                        alt="answer"
                                        className="w-full max-h-[240px] object-cover rounded-lg"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string | number;
    color?: string;
    icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color = 'text-blue-300', icon }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700/50 flex flex-col items-center justify-center transform transition hover:scale-105 hover:bg-gray-750">
        <div className={`text-3xl font-bold mb-2 ${color} flex items-center gap-3`}>
            {icon} {value}
        </div>
        <div className="text-gray-400 font-semibold text-sm uppercase tracking-wider">{title}</div>
    </div>
);

export default UserProfile;

















