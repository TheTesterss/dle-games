import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Session from '../../utils/Session';
import { baseURL } from '../../utils/d';

const DashboardProfil = () => {
    const { currentUser, updateUser } = useAuth();

    const [username, setUsername] = useState(currentUser?.name || '');
    const [email, setEmail] = useState('user@example.com');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [avatar, setAvatar] = useState(currentUser?.avatar || 'https://placehold.co/100x100/007bff/ffffff?text=U');
    const [newAvatarFile, setNewAvatarFile] = useState(null);
    const fileInputRef = useRef(null);

    const [initialProfileData, setInitialProfileData] = useState({
        username: currentUser?.name || '',
        email: 'user@example.com',
        avatar: currentUser?.avatar || 'https://placehold.co/100x100/007bff/ffffff?text=U'
    });

    const hasChanges = useCallback(() => {
        const isUsernameChanged = username !== initialProfileData.username;
        const isEmailChanged = email !== initialProfileData.email;
        const isPasswordChanged = password !== '';
        const isAvatarChanged = avatar !== initialProfileData.avatar;

        return isUsernameChanged || isEmailChanged || isPasswordChanged || isAvatarChanged;
    }, [username, email, password, avatar, initialProfileData]);

    useEffect(() => {
        const currentAvatar = avatar;
        return () => {
            if (currentAvatar && currentAvatar.startsWith('blob:') && currentAvatar !== initialProfileData.avatar) {
                URL.revokeObjectURL(currentAvatar);
            }
        };
    }, [avatar, initialProfileData.avatar]);

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setMessage('Please select a valid image file (e.g., JPG, PNG).');
                setNewAvatarFile(null);
                return;
            }

            const imageUrl = URL.createObjectURL(file);
            setAvatar(imageUrl);
            setNewAvatarFile(file);
            setMessage('');
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setMessage('');

        if (password && password !== confirmPassword) {
            setMessage('Les mots de passe ne correspondent pas.');
            return;
        }

        let newAvatarUrl = avatar;

        if (newAvatarFile) {
            try {
                const formData = new FormData();
                formData.append("avatar", newAvatarFile);

                const response = await fetch(`${baseURL}/create_avatar_link`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                    mode: 'cors'
                });

                if (!response.ok) throw new Error("Erreur lors de l'upload de l'avatar");

                const data = await response.json();
                console.log(data)
                setAvatar(data.url);
                newAvatarUrl = data.url;
            } catch (err) {
                setMessage(err.message);
                return;
            }
        }
        const updatedUser = {
            name: username,
            mail: email,
            avatar: newAvatarUrl
        };

        const hashedPassword = password ? await Session.hashPassword(password) : undefined;
        try {
            await updateUser({ ...updatedUser, password: hashedPassword });
            setInitialProfileData({
                username,
                email,
                avatar: newAvatarUrl
            });
            setPassword('');
            setConfirmPassword('');
            setNewAvatarFile(null);
            setMessage('Profil modifié avec succès !');
        } catch (err) {
            setMessage('Erreur lors de la mise à jour du profil.');
            console.error(err);
        }
    };

    const handleCancelChanges = () => {
        setUsername(initialProfileData.username);
        setEmail(initialProfileData.email);
        setPassword('');
        setConfirmPassword('');

        if (avatar && avatar.startsWith('blob:') && avatar !== initialProfileData.avatar) {
            URL.revokeObjectURL(avatar);
        }
        setAvatar(initialProfileData.avatar);
        setNewAvatarFile(null);
        setMessage('');
    };
    const isFieldChanged = (fieldValue, initialValue) => fieldValue !== initialValue;

    return (
        <div className="p-4">
            <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Modifier votre profil</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg mx-auto">
                <div className="flex flex-col items-center mb-6">
                    <img
                        src={avatar}
                        alt="User Avatar"
                        className={`w-24 h-24 rounded-full border-4 shadow-xl mb-4 cursor-pointer hover:opacity-80 transition-all duration-200
                                    ${isFieldChanged(avatar, initialProfileData.avatar) ? 'border-green-500' : 'border-blue-600'}`}
                        onClick={handleAvatarClick}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                    <label htmlFor="avatar" className="block text-gray-300 text-sm font-bold mb-2">
                        Cliquer sur l'avatar pour le changer
                    </label>
                </div>

                <div>
                    <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
                        Nom d'utilisateur
                    </label>
                    <input
                        type="text"
                        id="username"
                        className={`shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 transition duration-300
                                    ${isFieldChanged(username, initialProfileData.username) ? 'border-green-500' : 'border-gray-700'}`}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
                        Mail
                    </label>
                    <input
                        type="email"
                        id="email"
                        className={`shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 transition duration-300
                                    ${isFieldChanged(email, initialProfileData.email) ? 'border-green-500' : 'border-gray-700'}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
                        Nouveau mot de passe
                    </label>
                    <input
                        type="password"
                        id="password"
                        className={`shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 transition duration-300
                                    ${password !== '' ? 'border-green-500' : 'border-gray-700'}`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-bold mb-2">
                        Confirmer le mot de passe
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        className={`shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 transition duration-300
                                    ${password !== '' ? 'border-green-500' : 'border-gray-700'}`}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                {message && (
                    <p
                        className={`text-center text-sm ${message.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}
                    >
                        {message}
                    </p>
                )}
                <div className="flex justify-center space-x-4 mt-6">
                    <button
                        type="submit"
                        disabled={!hasChanges()}
                        className={`flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg
                                   focus:outline-none focus:shadow-outline transition duration-300 ease-in-out
                                   transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl
                                   bg-gradient-to-r from-blue-600 to-blue-800
                                   ${!hasChanges() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Confirmer
                    </button>
                    <button
                        type="button"
                        onClick={handleCancelChanges}
                        disabled={!hasChanges()}
                        className={`flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded-lg
                                   focus:outline-none focus:shadow-outline transition duration-300 ease-in-out
                                   transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl
                                   ${!hasChanges() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DashboardProfil;
