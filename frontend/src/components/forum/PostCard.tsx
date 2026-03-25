import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthContextType } from '../../contexts/authContext';
import Session from '../../utils/Session';
import ForumSession from '../../utils/ForumSession';
import { baseURL } from '../../utils/d';
import MentionText from '../utils/MentionText';
import GiftCard, { extractGiftCodes } from '../features/GiftCard';
import ContextMenu, { ContextMenuProps } from '../common/ContextMenu';
import EmojiPicker from '../utils/EmojiPicker';
import {
    FaHeart,
    FaRegHeart,
    FaCommentDots,
    FaRetweet,
    FaCrown,
    FaCheckCircle,
    FaGem,
    FaImage,
    FaVideo,
    FaTrophy,
    FaMedal,
    FaCheck,
    FaUserShield,
    FaTimes,
    FaSearchPlus,
    FaDownload,
    FaEnvelope,
    FaUser,
    FaAt,
    FaIdCard,
    FaTrash,
    FaEdit,
    FaThumbtack,
    FaSmile
} from 'react-icons/fa';
import { Post, Account, Comment as PostComment } from '../../types';

interface MiniPostCardProps {
    post: Post;
    navigateTo: (path: string) => void;
    renderBadges: (targetUser: Partial<Account>) => React.ReactNode;
    knownUsers: Map<string, string>;
    currentUserId?: string;
}

const MiniPostCard: React.FC<MiniPostCardProps> = ({ post, navigateTo, renderBadges, knownUsers, currentUserId }) => {
    return (
        <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-3 mb-3">
                <img
                    src={post.user?.avatar || 'https://placehold.co/100x100/007bff/ffffff?text=U'}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex flex-col">
                    <span className="font-semibold text-blue-500 flex items-center text-sm">
                        {post.user?.name || 'Utilisateur inconnu'}
                        {renderBadges(post.user ?? {})}
                    </span>
                    <span className="text-gray-500 text-xs" data-timestamp>{new Date(post.createdAt).toLocaleString()}</span>
                </div>
            </div>
            {post.content && (
                <MentionText
                    text={post.content}
                    navigateTo={navigateTo}
                    className="text-gray-400 text-sm font-medium text-left line-clamp-3"
                />
            )}
            {extractGiftCodes(post.content || '').map((code) => (
                <GiftCard key={`gift-mini-${post._id}-${code}`} code={code} currentUserId={currentUserId} />
            ))}
            {post.images && post.images.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-hidden max-h-24">
                    {post.images.map((img, i) => (
                        <img key={i} src={img} className="w-24 h-24 object-cover rounded-lg opacity-80" alt="mini" />
                    ))}
                </div>
            )}
        </div>
    );
};

interface LightboxProps {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ images, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(false);

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setZoom(false);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        setZoom(false);
    };

    const toggleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoom(!zoom);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % images.length);
            if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [images.length, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
            >
                <FaTimes />
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                    src={images[currentIndex]}
                    alt={`View ${currentIndex + 1}`}
                    className={`transition-transform duration-300 ease-in-out ${zoom ? 'scale-150 cursor-zoom-out' : 'max-w-full max-h-[90vh] object-contain cursor-zoom-in'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleZoom(e);
                    }}
                />
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
                <a
                    href={images[currentIndex]}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-blue-600 transition"
                    onClick={(e) => e.stopPropagation()}
                    title="Ouvrir original / Enregistrer"
                >
                    <FaDownload />
                </a>
                <button
                    onClick={toggleZoom}
                    className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-blue-600 transition"
                >
                    <FaSearchPlus />
                </button>
            </div>

            {images.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-4 text-white text-4xl hover:bg-black/20 rounded-full transition"
                    >
                        &#10094;
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-4 text-white text-4xl hover:bg-black/20 rounded-full transition"
                    >
                        &#10095;
                    </button>
                </>
            )}
        </div>
    );
};

interface PostCardProps {
    post: Post;
    onToggleLike: (postId: string) => void;
    onAddComment: (postId: string, content: string, images: string[], videos: string[]) => void;
    onDeletePost: (postId: string) => void;
    onDeleteComment: (postId: string, commentId: string) => void;
    onUpdatePost?: (postId: string, content: string) => Promise<Post>;
    onTogglePin?: (postId: string) => Promise<Post>;
    onRepost: (postId: string, content?: string) => Promise<Post | void>;
    navigateTo: (path: string) => void;
    currentUserId?: string;
    knownUsers: Map<string, any>;
    currentUserBadges?: any;
    currentUserPremiumTier?: 'games_one' | 'games_plus' | null;
    isListView?: boolean;
    currentUserFriends?: string[];
}

const PostCard: React.FC<PostCardProps> = ({
    post,
    onToggleLike,
    onAddComment,
    onDeletePost,
    onDeleteComment,
    onUpdatePost,
    onTogglePin,
    onRepost,
    navigateTo,
    currentUserId,
    knownUsers,
    currentUserBadges,
    currentUserPremiumTier,
    isListView = false,
    currentUserFriends = []
}) => {
    const { currentUser } = useAuth() as AuthContextType;
    const autoPunctuation = currentUser?.settings?.text?.autoPunctuation !== false;
    const applyTextSettings = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed || !autoPunctuation) return trimmed;
        if (/[.!?]$/.test(trimmed)) return trimmed;
        if (/[A-Za-z0-9-)]$/.test(trimmed)) return `${trimmed}.`;
        return trimmed;
    };

    const [commentInput, setCommentInput] = useState('');
    const [commentImages, setCommentImages] = useState<File[]>([]);
    const [commentVideos, setCommentVideos] = useState<File[]>([]);
    const [comments, setComments] = useState<PostComment[]>(post.comments || []);
    const [user, setUser] = useState<Partial<Account>>(post.user || {});
    const [repostOriginal, setRepostOriginal] = useState<Post | null>(null);
    const [showRepostInput, setShowRepostInput] = useState(false);
    const [repostMessage, setRepostMessage] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [commentPage, setCommentPage] = useState(1);
    const [loadingComments, setLoadingComments] = useState(false);
    const [postContent, setPostContent] = useState(post.content || '');
    const [editingPost, setEditingPost] = useState(false);
    const [editPostContent, setEditPostContent] = useState(post.content || '');
    const [isPinned, setIsPinned] = useState(!!post.pinnedOnProfile);
    const commentInputRef = useRef<HTMLInputElement>(null);
    const commentVideoRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [contextMenu, setContextMenu] = useState<any | null>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
    const editEmojiPickerRef = useRef<HTMLDivElement>(null);

    const likes = post.likes || [];
    const hasLiked = currentUserId ? likes.some((id) => id.toString() === currentUserId) : false;
    const isAuthor = post.user?._id === currentUserId;
    const isModerator = currentUserBadges?.admin || currentUserBadges?.owner;
    const premiumTier = currentUserPremiumTier ?? (currentUserBadges?.premium ? 'games_one' : null);
    const maxImages = premiumTier ? 10 : 4;
    const maxReplyLength = premiumTier ? 1024 : 256;
    const maxUploadSize = premiumTier === 'games_plus' ? 500 * 1024 * 1024 : premiumTier ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    const allowVideo = !!premiumTier;

    useEffect(() => {
        setPostContent(post.content || '');
        setEditPostContent(post.content || '');
    }, [post.content]);

    useEffect(() => {
        setIsPinned(!!post.pinnedOnProfile);
    }, [post.pinnedOnProfile]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (
                showEditEmojiPicker &&
                editEmojiPickerRef.current &&
                !editEmojiPickerRef.current.contains(event.target as Node)
            ) {
                setShowEditEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker, showEditEmojiPicker]);

    useEffect(() => {
        const fetchComments = async () => {
            const foundComments = await Promise.all(
                (post.comments || []).map(async (c) => {
                    const u = typeof c.user === 'string' ? await Session.getUserById(c.user) : c.user;
                    return { ...c, user: u };
                })
            ) as PostComment[];
            setComments(foundComments);
        };

        const fetchUser = async () => {
            if (post.user && typeof post.user === 'string') {
                const foundUser = await Session.getUserById(post.user);
                if (foundUser) setUser(foundUser);
            } else if (post.user && typeof post.user === 'object') {
                setUser(post.user);
            }
        };

        const fetchRepost = async () => {
            if (!post.repostOf) return;
            try {
                const originalId = typeof post.repostOf === 'string' ? post.repostOf : post.repostOf._id;
                const original = await ForumSession.getPost(originalId);
                const originalUserId = typeof original.user === 'string' ? original.user : original.user._id;
                if (originalUserId) {
                    const originalUser = await Session.getUserById(originalUserId);
                    setRepostOriginal({ ...original, user: originalUser ?? {} });
                }
            } catch (err) {
                console.error('Erreur chargement repost:', err);
            }
        };

        fetchUser();
        fetchComments();
        fetchRepost();
    }, [post.comments, post.user, post.repostOf]);
    const handleEditPost = async () => {
        if (!currentUserId) return;
        const content = applyTextSettings(editPostContent);
        if (!content) return;
        try {
            const updated = onUpdatePost
                ? await onUpdatePost(post._id, content)
                : await ForumSession.updatePost(currentUserId, post._id, content);
            setPostContent(updated?.content ?? content);
            setEditingPost(false);
        } catch (err) {
            console.error(err);
        }
    };
    const handleTogglePin = async () => {
        if (!currentUserId) return;
        try {
            const updated = onTogglePin
                ? await onTogglePin(post._id)
                : await ForumSession.togglePinPost(currentUserId, post._id);
            if (updated && typeof updated.pinnedOnProfile === 'boolean') {
                setIsPinned(updated.pinnedOnProfile);
            } else {
                setIsPinned((prev) => !prev);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendComment = async () => {
        const finalComment = applyTextSettings(commentInput);
        if (!finalComment && commentImages.length === 0) return;
        if (finalComment.length > maxReplyLength) return;

        if (commentImages.length > maxImages) {
            alert(`Vous pouvez ajouter jusqu'à ${maxImages} images.`);
            return;
        }

        const oversized = commentImages.find((file) => file.size > maxUploadSize);
        if (oversized) {
            alert('Fichier trop volumineux pour votre offre.');
            return;
        }

        try {
            if (commentVideos.length > 0 && !allowVideo) {
                alert('Vidéo réservée aux comptes premium.');
                return;
            }
            if (commentVideos.length > 1) {
                alert('Une seule vidéo est autorisée.');
                return;
            }
            const oversizedVideo = commentVideos.find((file) => file.size > maxUploadSize);
            if (oversizedVideo) {
                alert('Vidéo trop volumineuse pour votre offre.');
                return;
            }
            if (commentImages.length > 0 || commentVideos.length > 0) {
                const formData = new FormData();
                if (currentUserId) formData.append('userId', currentUserId);
                commentImages.forEach((file) => formData.append('images', file));
                commentVideos.forEach((file) => formData.append('videos', file));
                const res = await fetch(`${baseURL}/create_link`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                    mode: 'cors'
                });
                if (!res.ok) throw new Error('Erreur upload média');
                const data = await res.json();
                const finalImageUrls = data.urls || (data.url ? [data.url] : []);
                const finalVideoUrls = data.videoUrls || (data.videoUrl ? [data.videoUrl] : []);
                await onAddComment(post._id, finalComment, finalImageUrls, finalVideoUrls);
            } else {
                await onAddComment(post._id, finalComment, [], []);
            }
            setCommentInput('');
            setCommentImages([]);
            setCommentVideos([]);
            if (commentInputRef.current) commentInputRef.current.value = '';
            if (commentVideoRef.current) commentVideoRef.current.value = '';
        } catch (err) {
            console.error(err);
        }
    };

    const sortedComments = [...comments].sort((a, b) => {
        const isAFriend = a.user?._id ? currentUserFriends.includes(a.user._id.toString()) : false;
        const isBFriend = b.user?._id ? currentUserFriends.includes(b.user._id.toString()) : false;
        if (isAFriend && !isBFriend) return -1;
        if (!isAFriend && isBFriend) return 1;
        return (b.user?.stats?.matchesPlayed || 0) - (a.user?.stats?.matchesPlayed || 0);
    });

    const displayedComments = isListView ? sortedComments.slice(0, 2) : sortedComments.slice(0, commentPage * 10);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (isListView) return;
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (
            scrollHeight - scrollTop <= clientHeight + 50 &&
            !loadingComments &&
            displayedComments.length < comments.length
        ) {
            setLoadingComments(true);
            setTimeout(() => {
                setCommentPage((prev) => prev + 1);
                setLoadingComments(false);
            }, 500);
        }
    };

    const handleAvatarContextMenu = (e: React.MouseEvent, targetUser: Partial<Account>) => {
        e.preventDefault();
        if (!targetUser) return;
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            options: [
                {
                    label: 'Envoyer un message',
                    icon: <FaEnvelope />,
                    onClick: () => navigateTo(`/chat/${targetUser.name}`)
                },
                {
                    label: 'Afficher le profil',
                    icon: <FaUser />,
                    onClick: () => navigateTo(`/user/${targetUser.name}`)
                },
                {
                    label: 'Mentionner',
                    icon: <FaAt />,
                    onClick: () => {
                        setCommentInput((prev) => `${prev} <@${targetUser._id}> `);
                        if (commentInputRef.current) commentInputRef.current.focus();
                    }
                },
                {
                    label: "Copier l'identifiant",
                    icon: <FaIdCard />,
                    onClick: () => {
                        if (targetUser._id) {
                            navigator.clipboard.writeText(targetUser._id);
                            alert('ID copié !');
                        }
                    }
                },
                ...(currentUserBadges?.admin || currentUserBadges?.owner
                    ? [
                        {
                            label: 'Administrer',
                            icon: <FaUserShield />,
                            onClick: () => navigateTo(`/admin/user/${targetUser._id}`),
                            danger: true
                        }
                    ]
                    : [])
            ]
        });
    };

    const handleTouchStart = (e: React.TouchEvent, targetUser: Partial<Account>) => {
        longPressTimer.current = setTimeout(() => {
            const touch = e.touches[0];
            handleAvatarContextMenu(
                {
                    preventDefault: () => { },
                    clientX: touch.clientX,
                    clientY: touch.clientY
                } as any,
                targetUser
            );
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };
    const handlePostContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            options: [
                {
                    label: 'Voir en détails',
                    icon: <FaSearchPlus />,
                    onClick: () => navigateTo(`/forum/post/${post._id}`)
                },
                {
                    label: "Copier l'identifiant",
                    icon: <FaIdCard />,
                    onClick: () => navigator.clipboard.writeText(post._id)
                },
                ...(isAuthor
                    ? [
                          {
                              label: 'Modifier',
                              icon: <FaEdit />,
                              onClick: () => {
                                  setEditingPost(true);
                                  setEditPostContent(postContent);
                              }
                          },
                            {
                                label: isPinned ? 'Désépingler du profil' : 'Épingler sur profil',
                                icon: <FaThumbtack />,
                                onClick: handleTogglePin
                            },
                          {
                              label: 'Supprimer',
                              icon: <FaTrash />,
                              onClick: () => onDeletePost(post._id),
                              danger: true
                          }
                      ]
                    : []),
                ...(!isAuthor && isModerator
                    ? [
                          {
                              label: 'Supprimer',
                              icon: <FaTrash />,
                              onClick: () => onDeletePost(post._id),
                              danger: true
                          }
                      ]
                    : [])
            ]
        });
    };


    const handleRepostClick = async () => {
        if (!onRepost) return;
        await onRepost(post._id, repostMessage.trim());
        setRepostMessage('');
        setShowRepostInput(false);
    };

    const openLightbox = (images: string[], index: number) => {
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const renderBadges = (targetUser: Partial<Account>) => {
        if (!targetUser?.badges) return null;
        const ranking = targetUser.badges.ranking;
        const premiumLabel = targetUser.premiumTier === 'games_plus'
            ? 'Premium (Games Plus)'
            : targetUser.premiumTier === 'games_one'
            ? 'Premium (Games One)'
            : 'Premium';
        return (
            <span className="flex items-center gap-1 ml-2">
                {targetUser.badges.owner && <FaCrown className="text-yellow-400" title="Owner" />}
                {targetUser.badges.verified && <FaCheckCircle className="text-blue-400" title="Verified" />}
                {targetUser.badges.premium && <FaGem className="text-pink-400" title={premiumLabel} />}
                {targetUser.badges.admin && <FaUserShield className="text-red-400" title="Admin" />}
                {ranking?.tier && ranking.tier !== 'none' && (
                    <FaTrophy
                        className={
                            ranking.tier === 'gold'
                                ? 'text-yellow-400'
                                : ranking.tier === 'silver'
                                    ? 'text-gray-300'
                                    : 'text-orange-400'
                        }
                        title="Top classement"
                    />
                )}
                {ranking?.top10 && <FaMedal className="text-purple-300" title="Top 10" />}
                {ranking?.dailyCheck && <FaCheck className="text-green-400" title="Check quotidien" />}
            </span>
        );
    };

    const renderMedia = (images: string[] = [], videos: string[] = [], fallbackImage?: string, fallbackVideo?: string, size: 'small' | 'large' = 'large') => {
        const imageList = images && images.length > 0 ? images : fallbackImage ? [fallbackImage] : [];
        const videoList = videos && videos.length > 0 ? videos : fallbackVideo ? [fallbackVideo] : [];

        if (imageList.length === 0 && videoList.length === 0) return null;

        const maxHeight = size === 'small' ? 'max-h-[260px]' : 'max-h-[420px]';
        const allMedia = [
            ...imageList.map((url) => ({ url, type: 'image' })),
            ...videoList.map((url) => ({ url, type: 'video' }))
        ];

        return (
            <div className={`grid gap-2 mb-6 ${allMedia.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {allMedia.map((item, idx) =>
                    item.type === 'image' ? (
                        <img
                            key={`img-${idx}`}
                            src={item.url}
                            alt="post media"
                            className={`w-full ${maxHeight} object-cover rounded-xl cursor-pointer hover:opacity-90 transition shadow-md`}
                            onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(imageList, imageList.indexOf(item.url));
                            }}
                        />
                    ) : (
                        <video
                            key={`vid-${idx}`}
                            src={item.url}
                            controls
                            className={`w-full ${maxHeight} object-cover rounded-xl bg-black shadow-md`}
                            onClick={(e) => e.stopPropagation()}
                        />
                    )
                )}
            </div>
        );
    };

    return (
        <>
            <div className="bg-gray-900 shadow-lg rounded-2xl p-5 mb-6 border border-gray-800" onContextMenu={handlePostContextMenu} data-contextmenu="allow">
                {post.repostOf && (
                    <div className="text-xs text-gray-400 mb-3 flex items-center gap-2">
                        <FaRetweet className="text-green-400" />
                        <span>Repost</span>
                    </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                    <img
                        src={user.avatar || 'https://placehold.co/100x100/007bff/ffffff?text=U'}
                        alt="avatar"
                        className="w-12 h-12 rounded-full object-cover border border-gray-700 cursor-pointer"
                        onContextMenu={(e) => handleAvatarContextMenu(e, user)}
                        onTouchStart={(e) => handleTouchStart(e, user)}
                        onTouchEnd={handleTouchEnd}
                    />
                    <div className="flex flex-col">
                        <span
                            className="font-semibold text-blue-500 cursor-pointer hover:underline flex items-center"
                            onContextMenu={(e) => handleAvatarContextMenu(e, user)}
                            onClick={(e) => handleAvatarContextMenu(e, user)}
                        >
                            {user.name || 'Utilisateur inconnu'}
                            {renderBadges(user)}
                        </span>
                        <span className="text-gray-500 text-xs" data-timestamp>{new Date(post.createdAt).toLocaleString()}</span>
                    </div>
                    {(isAuthor || isModerator) && (
                        <button
                            onClick={() => onDeletePost(post._id)}
                            className="ml-auto text-red-500 hover:text-red-700 font-bold bg-transparent px-3 py-1 rounded hover:bg-red-500/10 transition"
                        >
                            Supprimer
                        </button>
                    )}
                </div>

                {postContent && (
                    <div className="mb-6 ml-1">
                        {editingPost ? (
                            <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-3 space-y-3 relative">
                                <textarea
                                    value={editPostContent}
                                    onChange={(e) => setEditPostContent(e.target.value)}
                                    rows={4}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                                />
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditEmojiPicker((prev) => !prev)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
                                    >
                                        <FaSmile />
                                        <span className="text-xs">Emojis</span>
                                    </button>
                                    {showEditEmojiPicker && (
                                        <div
                                            ref={editEmojiPickerRef}
                                            className="absolute left-3 top-20 z-30 w-[320px] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl"
                                        >
                                            <EmojiPicker
                                                premiumTier={premiumTier}
                                                onSelect={(emoji) => {
                                                    setEditPostContent((prev) => `${prev}${emoji}`);
                                                    setShowEditEmojiPicker(false);
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2 text-xs">
                                        <button
                                            onClick={() => {
                                                setEditingPost(false);
                                                setEditPostContent(postContent);
                                            }}
                                            className="px-3 py-2 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleEditPost}
                                            className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
                                        >
                                            Sauvegarder
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <MentionText
                                    text={postContent}
                                    navigateTo={navigateTo}
                                    className="text-gray-200 font-medium text-left leading-relaxed text-lg"
                                />
                                {extractGiftCodes(postContent || '').map((code) => (
                                    <GiftCard key={`gift-post-${post._id}-${code}`} code={code} currentUserId={currentUserId} />
                                ))}
                            </>
                        )}
                    </div>
                )}

                {renderMedia(post.images, post.videos, post.image, post.video)}

                {repostOriginal && (
                    <button
                        onClick={() => navigateTo(`/forum/post/${repostOriginal._id}`)}
                        className="w-full text-left bg-gray-950 border border-gray-800 rounded-xl p-4 mb-4 hover:border-blue-500/50 transition group"
                    >
                        <div className="text-sm text-gray-400 mb-2 group-hover:text-blue-400 transition">
                            Post original
                        </div>
                        <MiniPostCard
                            post={repostOriginal}
                            navigateTo={navigateTo}
                            renderBadges={renderBadges}
                            knownUsers={knownUsers}
                            currentUserId={currentUserId}
                        />
                    </button>
                )}

                <div className="flex items-center gap-5 text-gray-400 mb-4 border-t border-gray-800 pt-4">
                    <button
                        onClick={() => onToggleLike(post._id)}
                        className={`flex items-center gap-2 font-semibold transition-colors duration-200 ${hasLiked ? 'text-red-500' : 'hover:text-red-400'}`}
                    >
                        {hasLiked ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}{' '}
                        <span>{likes.length}</span>
                    </button>
                    {post.allowReposts !== false && !post.repostOf && (
                        <button
                            onClick={() => setShowRepostInput((prev) => !prev)}
                            className="flex items-center gap-2 hover:text-green-400 transition-colors duration-200"
                        >
                            <FaRetweet className="text-xl" /> <span>Repost</span>
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <FaCommentDots className="text-xl" />
                        <span>{(post.comments || []).length}</span>
                    </div>
                </div>
                {showRepostInput && (
                    <div className="mb-4 flex flex-col gap-2 bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                        <textarea
                            value={repostMessage}
                            onChange={(e) => setRepostMessage(e.target.value)}
                            placeholder="Ajouter un message au repost (optionnel)"
                            rows={2}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-200 placeholder-gray-400 resize-none focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowRepostInput(false);
                                    setRepostMessage('');
                                }}
                                className="px-3 py-2 rounded-xl bg-gray-700 text-white text-sm hover:bg-gray-600"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleRepostClick}
                                className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 font-bold"
                            >
                                Reposter
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-800">
                    <div className="flex items-center gap-2 mb-6">
                        <FaCommentDots className="text-gray-500" />
                        <h4 className="font-bold text-gray-300">Commentaires ({comments.length})</h4>
                    </div>

                    <div
                        className={`space-y-4 ${!isListView ? 'max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 pr-2' : ''}`}
                        onScroll={handleScroll}
                        ref={scrollRef}
                    >
                        {displayedComments.map((c) => (
                            <div
                                key={c._id}
                                className="group flex flex-col gap-1 bg-gray-950/30 p-3 rounded-xl border border-gray-800/50 hover:border-gray-700/50 transition"
                            >
                                <div className="flex items-start gap-3">
                                    <img
                                        src={c.user?.avatar || 'https://placehold.co/100x100/007bff/ffffff?text=U'}
                                        alt="avatar"
                                        className="w-8 h-8 rounded-full object-cover cursor-pointer"
                                        onClick={(e) => handleAvatarContextMenu(e, c.user || {})}
                                        onContextMenu={(e) => handleAvatarContextMenu(e, c.user || {})}
                                        onTouchStart={(e) => handleTouchStart(e, c.user || {})}
                                        onTouchEnd={handleTouchEnd}
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span
                                                className="font-bold text-blue-500 cursor-pointer hover:underline text-sm flex items-center"
                                                onClick={(e) => handleAvatarContextMenu(e, c.user || {})}
                                            >
                                                {c.user?.name}
                                                {renderBadges(c.user || {})}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-500" data-timestamp>{new Date(c.createdAt).toLocaleDateString()}
                                                </span>
                                                {(c.user?._id === currentUserId ||
                                                    currentUserBadges?.admin ||
                                                    currentUserBadges?.owner) && (
                                                        <button
                                                            onClick={() => onDeleteComment(post._id, c._id)}
                                                            className="text-red-500 hover:text-red-700 text-xs font-bold opacity-0 group-hover:opacity-100 transition"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    )}
                                            </div>
                                        </div>
                                        {c.content && (
                                            <div className="text-sm text-gray-300 ml-1">
                                                <MentionText
                                                    text={c.content}
                                                    navigateTo={navigateTo}
                                                />
                                                {extractGiftCodes(c.content || '').map((code) => (
                                                    <GiftCard key={`gift-comment-${c._id}-${code}`} code={code} currentUserId={currentUserId} />
                                                ))}
                                            </div>
                                        )}
                                        {renderMedia(c.images, c.videos, undefined, undefined, 'small')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-1 ml-11">
                                    <button className="text-[10px] text-gray-500 hover:text-blue-400 font-bold transition">
                                        Répondre
                                    </button>
                                </div>
                            </div>
                        ))}

                        {isListView && comments.length > 2 && (
                            <button
                                onClick={() => navigateTo(`/forum/post/${post._id}`)}
                                className="text-xs text-blue-500 hover:underline pl-1 block"
                            >
                                Voir les {comments.length - 2} autres réponses
                            </button>
                        )}

                        {!isListView && loadingComments && (
                            <div className="text-center py-4 text-xs text-gray-500 animate-pulse italic">
                                Chargement des réponses...
                            </div>
                        )}
                    </div>
                </div>

                {post.allowComments === false && (
                    <div className="text-sm text-gray-500 italic mb-2 text-left">
                        Les réponses sont désactivées pour ce post.
                    </div>
                )}
                {post.allowComments !== false && (
                    <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2">
                            <textarea
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Écrire une réponse..."
                                rows={1}
                                className="flex-1 border border-gray-700 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all focus:rows-3"
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 relative">
                                <input
                                    ref={commentInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) =>
                                        setCommentImages(Array.from(e.target.files || []).slice(0, maxImages))
                                    }
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => commentInputRef.current?.click()}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
                                >
                                    <FaImage />
                                    {commentImages.length > 0 && (
                                        <span className="text-xs">{commentImages.length}</span>
                                    )}
                                </button>
                                <input
                                    ref={commentVideoRef}
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => setCommentVideos(Array.from(e.target.files || []).slice(0, 1))}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!allowVideo) return;
                                        commentVideoRef.current?.click();
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition ${!allowVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <FaVideo />
                                    {commentVideos.length > 0 && (
                                        <span className="text-xs">{commentVideos.length}</span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
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
                                                setCommentInput((prev) => `${prev}${emoji}`);
                                                setShowEmojiPicker(false);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            <span
                                className={`text-xs font-semibold ${commentInput.length > maxReplyLength ? 'text-red-400' : 'text-gray-500'
                                    }`}
                            >
                                {commentInput.length}/{maxReplyLength}
                            </span>
                            <button
                                onClick={handleSendComment}
                                disabled={
                                    commentInput.length > maxReplyLength ||
                                    (!commentInput.trim() && commentImages.length === 0)
                                }
                                className={`px-6 py-2 rounded-xl transition-all duration-200 font-bold shadow-lg ${commentInput.length > maxReplyLength ||
                                    (!commentInput.trim() && commentImages.length === 0)
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-600/20'
                                    }`}
                            >
                                Répondre
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {lightboxOpen && (
                <Lightbox images={lightboxImages} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
            )}
            {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} />}
        </>
    );
};

export default PostCard;














