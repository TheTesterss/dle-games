import React, { useState, useEffect } from 'react';
import Session from '../utils/Session';
import ForumSession from '../utils/ForumSession';
import { useAuth } from '../hooks/useAuth';
import PostCard from './PostCard';

const UserProfile = ({ navigateTo, name }) => {
    const [isConnected, _setIsConnected] = React.useState(!!Session.get());
    const { currentUser, sendFriendRequest, getUser, _fetchFriends } = useAuth();
    const [foundUser, setFoundUser] = useState({
        _id: '-1',
        name: 'Unknown User',
        avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
        stats: {
            matchesPlayed: 0,
            victories: 0,
            losses: 0,
            winRate: 0,
            favoriteGame: 'Unknown Game',
            longestStreak: 0,
            mostPlayedOpponent: 'Unknown Opponent'
        },
        commonFriends: [],
        inscription: 'Unknown Date'
    });
    const [message, setMessage] = useState('');
    const [userPosts, setUserPosts] = useState([]);
    const [visiblePosts, setVisiblePosts] = useState(5);
    const [loadingPosts, setLoadingPosts] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await getUser(name);
                const u = {};
                if (user._id) u._id = user._id;
                if (user.name) u.name = user.name;
                if (user.avatar) u.avatar = user.avatar;
                if (user.stats) u.stats = user.stats;

                if (user.createdAt) {
                    const date = new Date(user.createdAt);
                    const options = { day: '2-digit', month: 'long', year: 'numeric' };
                    u.inscription = new Intl.DateTimeFormat('fr-FR', options).format(date);
                }
                const friendsList = /*fetchFriends(currentUser._id) ||*/ [];
                const targetFriendsList = /*fetchFriends(foundUser._id) ||*/ [];
                const commonFriends = friendsList.filter((friend) =>
                    targetFriendsList.some((targetFriend) => targetFriend._id === friend._id)
                );
                if (commonFriends.length > 0) {
                    u.commonFriends = commonFriends;
                }
                setFoundUser(u);
                if (u._id && u._id !== '-1') {
                    try {
                        setLoadingPosts(true);
                        const posts = await ForumSession.getUserPosts(u._id);
                        setUserPosts(posts || []);
                    } catch (error) {
                        console.error('Erreur lors du chargement des posts:', error);
                        setUserPosts([]);
                    } finally {
                        setLoadingPosts(false);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
        return;
    }, [name, getUser]);

    const handleAddFriend = () => {
        if (!isConnected) {
            navigateTo('/login');
        } else {
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

    const handleLoadMorePosts = () => {
        setVisiblePosts(prev => prev + 5);
    };

    const handleToggleLike = async (postId) => {
    try {
      await ForumSession.toggleLike(currentUser._id, postId);
    } catch (err) {
      console.error('Erreur like:', err);
    }
  };

  const handleAddComment = async (postId, content) => {
    if (!content.trim()) return;
    try {
      await ForumSession.addComment(currentUser._id, postId, content);
    } catch (err) {
      console.error('Erreur ajout commentaire:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await ForumSession.deletePost(currentUser._id, postId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await ForumSession.deleteComment(currentUser._id, postId, commentId);
    } catch (err) {
      console.error(err);
    }
  };

    const postsToShow = userPosts.slice(0, visiblePosts);
    const hasMorePosts = userPosts.length > visiblePosts;

    return (
        <div className="max-w-6xl mx-auto py-12 gap-12 min-h-[70vh]">
            <div className="flex flex-col md:flex-row gap-12 mb-12">
                <aside className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 p-8 flex flex-col items-center w-full md:w-1/3 mx-auto md:mx-0">
                    <img
                        src={foundUser.avatar}
                        alt={foundUser.name}
                        className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg mb-4"
                    />
                    <h2 className="text-3xl font-extrabold text-blue-500 mb-4">{foundUser.name}</h2>
                    <button
                        onClick={handleAddFriend}
                        disabled={!isConnected || currentUser._id === foundUser._id || foundUser._id === '-1'}
                        className={`bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg mb-6 transition duration-300 ${!isConnected || currentUser._id === foundUser._id || foundUser._id === '-1' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Ajouter en ami
                    </button>
                    {message && (
                        <p
                            className={`text-center text-sm ${message.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}
                        >
                            {message}
                        </p>
                    )}
                    <div className={`w-full mb-6 ${message ? 'mt-4' : ''}`}>
                        <h3 className="text-xl font-semibold text-gray-300 mb-2 text-center">Amis en commun</h3>
                        <div className="flex justify-center gap-4">
                            {(foundUser.commonFriends || []).map((f) => (
                                <div key={f.pseudo} className="flex flex-col items-center">
                                    <span
                                        className={`rounded-full w-12 h-12 flex items-center justify-center border-4 border-white shadow-lg ${f.color}`}
                                    >
                                        <img
                                            src={f.avatar}
                                            alt={f.pseudo}
                                            className="rounded-full w-10 h-10 object-cover"
                                        />
                                    </span>
                                    <span className="text-sm text-gray-200 mt-1">{f.pseudo}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-full mt-auto">
                        <h3 className="text-xl font-semibold text-gray-300 mb-2 text-center">Informations</h3>
                        <ul className="text-center text-gray-400">
                            <li>
                                Date d'inscription :{' '}
                                <span className="text-blue-400 font-bold">{foundUser.inscription}</span>
                            </li>
                        </ul>
                    </div>
                </aside>
                
                <section className="relative flex-1 flex flex-col justify-between bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 p-8">
                    <div>
                        <h3 className="text-3xl font-extrabold text-blue-500 mb-8 text-center">Statistiques</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard title="Parties jouées" value={foundUser.stats.matchesPlayed} />
                            <StatCard title="Victoires" value={foundUser.stats.victories} color="text-green-400" />
                            <StatCard title="Défaites" value={foundUser.stats.losses} color="text-red-400" />
                            <StatCard
                                title="Taux de victoire"
                                value={`${foundUser.stats.winRate}%`}
                                color="text-yellow-400"
                            />
                            <StatCard title="Jeu préféré" value={foundUser.stats.favoriteGame} />
                            <StatCard
                                title="Plus longue série de victoire"
                                value={foundUser.stats.longestStreak}
                                color="text-purple-400"
                            />
                            <StatCard title="Adversaire le plus joué" value={foundUser.stats.mostPlayedOpponent} />
                        </div>
                    </div>
                </section>
            </div>

            <section className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 p-8">
                <h3 className="text-3xl font-extrabold text-blue-500 mb-8 text-center">
                    Posts de {foundUser.name}
                </h3>
                
                {loadingPosts ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : userPosts.length === 0 ? (
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
                                    navigateTo={navigateTo}
                                    currentUserId={currentUser?._id}
                                />
                            ))}
                        </div>

                        {hasMorePosts && (
                            <div className="flex justify-center pt-6">
                                <button
                                    onClick={handleLoadMorePosts}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Voir davantage ({userPosts.length - visiblePosts} posts restants)
                                </button>
                            </div>
                        )}

                        <div className="text-center pt-4">
                            <p className="text-gray-400 text-sm">
                                {postsToShow.length} sur {userPosts.length} posts affichés
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

const StatCard = ({ title, value, color = 'text-blue-300' }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700/50 text-center">
        <div className={`text-2xl font-bold mb-2 ${color}`}>{value}</div>
        <div className="text-gray-300 font-semibold">{title}</div>
    </div>
);

export default UserProfile;