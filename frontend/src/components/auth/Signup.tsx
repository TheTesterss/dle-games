import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthContextType } from '../../types';

interface SignupProps {
    navigateTo: (path: string) => void;
}

const Signup: React.FC<SignupProps> = ({ navigateTo }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const { signup } = useAuth() as AuthContextType;

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        if (password !== confirmPassword) {
            setMessage('Les mots de passe ne correspondent pas');
            return;
        }
        try {
            await signup(username, email, password);
            navigateTo('/');
        } catch (err: any) {
            setMessage(err.message || "Erreur lors de l'inscription");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-inter bg-gray-950">
            <div
                className="bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-700/50 w-full max-w-md
                        transform transition-all duration-500 ease-in-out hover:scale-105"
            >
                <h2 className="text-4xl font-extrabold text-blue-600 text-center mb-8 drop-shadow-lg">S'inscrire</h2>
                <form onSubmit={handleSignup} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
                            Nom d'utilisateur
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 border-gray-700 transition duration-300"
                            placeholder="Choose a username"
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
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 border-gray-700 transition duration-300"
                            placeholder="Your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 border-gray-700 transition duration-300"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-bold mb-2">
                            Confirmer le mot de passe
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 border-gray-700 transition duration-300"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    {message && <p className="text-red-500 text-sm text-center font-semibold">{message}</p>}
                    <button
                        type="submit"
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg
                                   focus:outline-none focus:shadow-outline transition duration-300 ease-in-out
                                   transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl
                                   bg-gradient-to-r from-blue-600 to-blue-800"
                    >
                        S'inscrire
                    </button>
                </form>
                <p className="mt-8 text-center text-gray-400">
                    Vous possédez déjà un compte ?{' '}
                    <button
                        onClick={() => navigateTo('/login')}
                        className="text-blue-500 hover:text-blue-400 font-semibold transition duration-200 bg-transparent border-none p-0 cursor-pointer"
                    >
                        Se connecter
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Signup;
