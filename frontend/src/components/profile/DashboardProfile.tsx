import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Session from '../../utils/Session';
import { AuthContextType } from '../../contexts/authContext';

const DashboardProfile: React.FC = () => {
    const { currentUser, updateUser } = useAuth() as AuthContextType;

    const [email, setEmail] = useState(currentUser?.mail || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const [initialProfileData, setInitialProfileData] = useState({
        email: currentUser?.mail || 'user@example.com'
    });

    useEffect(() => {
        if (!currentUser) return;
        setEmail(currentUser.mail || '');
        setInitialProfileData({ email: currentUser.mail || 'user@example.com' });
    }, [currentUser?.mail]);

    const hasChanges = useCallback(() => {
        const isEmailChanged = email !== initialProfileData.email && email !== '';
        const isPasswordChanged = password !== '';
        return isEmailChanged || isPasswordChanged;
    }, [email, password, initialProfileData]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (password && password !== confirmPassword) {
            setMessage('Les mots de passe ne correspondent pas.');
            return;
        }

        const updatedUser = {
            mail: email
        };

        const hashedPassword = password ? await Session.hashPassword(password) : undefined;
        try {
            await updateUser({ ...updatedUser, password: hashedPassword });
            setInitialProfileData({ email });
            setPassword('');
            setConfirmPassword('');
            setMessage('Profil modifié avec succès !');
        } catch (err) {
            setMessage('Erreur lors de la mise à jour du profil.');
            console.error(err);
        }
    };

    const handleCancelChanges = () => {
        setEmail(initialProfileData.email);
        setPassword('');
        setConfirmPassword('');
        setMessage('');
    };

    const isFieldChanged = (fieldValue: string, initialValue: string) => fieldValue !== initialValue;

    return (
        <div className="p-4">
            <h3 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">Modifier vos informations</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg mx-auto">
                <div className="flex flex-col items-center mb-6">
                    <img
                        src={currentUser?.avatar || 'https://placehold.co/100x100/007bff/ffffff?text=U'}
                        alt="User Avatar"
                        className="w-24 h-24 rounded-full border-4 shadow-xl mb-4 border-blue-600 object-cover"
                    />
                    <label className="block text-gray-300 text-sm font-bold mb-2 text-center">
                        Modifications avatar et pseudo disponibles sur votre page de profil.
                    </label>
                </div>

                <div>
                    <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
                        Nom d'utilisateur
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-500 leading-tight bg-gray-900 border-gray-700"
                        value={currentUser?.name || ''}
                        disabled
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
                        placeholder={email}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        className={`text-center text-sm ${message.toLowerCase().includes('succès') ? 'text-green-500' : 'text-red-500'}`}
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

export default DashboardProfile;
