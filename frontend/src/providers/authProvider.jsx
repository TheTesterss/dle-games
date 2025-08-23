import { useState, useEffect } from 'react';
import { AuthContext } from '../contexts/authContext';
import Session from '../utils/Session';
import FriendRequestSession from '../utils/FriendRequestSession';
import FriendsSession from '../utils/FriendsSession';

export const AuthProvider = ({ children, navigateTo }) => {
    const [currentUser, setCurrentUser] = useState(Session.get());
    const [isAuthenticated, setIsAuthenticated] = useState(!!Session.get());
    const [currentUserFriendRequests, setCurrentUserFriendRequests] = useState([]);
    const [currentUserFriends, setCurrentUserFriends] = useState([]);

    useEffect(() => {
        setCurrentUser(Session.get());
        setIsAuthenticated(!!Session.get());
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            Session.clearExpired();
            setCurrentUser(Session.get());
            setIsAuthenticated(!!Session.get());
        }, 360_000); // toutes les 6 minutes

        return () => clearInterval(interval);
    }, []);

    /*useEffect(() => {
        if (currentUser && currentUser._id) {
            fetchFriends(currentUser._id);
            fetchFriendRequests(currentUser._id);
        } else {
            setFriends([]);
            setFriendRequests([]);
        }
    }, [currentUser]);*/

    const fetchFriendRequests = async (userId) => {
        const requests = await FriendsSession.getRequests(userId);
        setCurrentUserFriendRequests(requests);
        return requests;
    };

    const fetchFriends = async (userId) => {
        const list = await FriendsSession.getAll(userId);
        setCurrentUserFriends(list);
        return list;
    };

    const sendFriendRequest = async (from, to) => {
        return await FriendRequestSession.send(from, to);
    };

    const acceptFriendRequest = async (reqId) => {
        return await FriendRequestSession.accept(reqId);
    };

    const cancelFriendRequest = async (reqId) => {
        return await FriendRequestSession.cancel(reqId);
    };

    const denyFriendRequest = async (reqId) => {
        return await FriendRequestSession.deny(reqId);
    };

    const removeFriend = async (userId, targetId) => {
        return await FriendsSession.remove(userId, targetId);
    };

    const getUser = async (name) => {
        const user = await Session.getUser(name);
        return user;
    };

    const getUsers = async () => {
        const users = await Session.getUsers();
        return users;
    };

    const login = async (username, password) => {
        const user = await Session.login(username, password);
        setCurrentUser(user);
        setIsAuthenticated(true);
        if (navigateTo) navigateTo('/profile');
        return user;
    };

    const signup = async (username, email, password) => {
        const user = await Session.signup(username, email, password);
        setCurrentUser(user);
        setIsAuthenticated(true);
        if (navigateTo) navigateTo('/profile');
        return user;
    };

    const logout = async () => {
        Session.logout();
        setCurrentUser(null);
        setIsAuthenticated(false);
        if (navigateTo) navigateTo('/login');
    };

    const updateUser = async (userData) => {
        const updatedUser = await Session.updateUser(userData);
        setCurrentUser(updatedUser);
        return updatedUser;
    };

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                isAuthenticated,
                login,
                signup,
                getUser,
                logout,
                getUsers,
                updateUser,
                removeFriend,
                denyFriendRequest,
                cancelFriendRequest,
                acceptFriendRequest,
                sendFriendRequest,
                fetchFriendRequests,
                fetchFriends,
                currentUserFriends,
                currentUserFriendRequests
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
