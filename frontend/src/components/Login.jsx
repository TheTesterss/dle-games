import React, { useState } from 'react';
import { useAuth } from 'src/hooks/useAuth';

const Login = ({ navigateTo }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const { login } = useAuth();

    const handleLogin = (e) => {
        e.preventDefault();
        setMessage('');

        if (!username || !password) {
            setMessage('Entrez nom d\'utilisateur et mot de passe.');
            return;
        }

        login(username);
        navigateTo('/profil');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950 font-inter">
            <div className="bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-700/50 w-full max-w-md
                        transform transition-all duration-500 ease-in-out hover:scale-105">
                <h2 className="text-4xl font-extrabold text-blue-600 text-center mb-8 drop-shadow-lg">Connexion</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
                            Nom d'utilisateur
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 border-gray-700 transition duration-300"
                            placeholder="Your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {message && (
                        <p className="text-red-500 text-sm text-center">{message}</p>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg
                                   focus:outline-none focus:shadow-outline transition duration-300 ease-in-out
                                   transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl
                                   bg-gradient-to-r from-blue-600 to-blue-800"
                    >
                        Se connecter
                    </button>
                </form>
                <p className="mt-8 text-center text-gray-400">
                    Vous n'avez pas de compte ?{' '}
                    <a
                        href="#"
                        onClick={() => navigateTo('/signup')}
                        className="text-blue-500 hover:text-blue-400 font-semibold transition duration-200"
                    >
                        S'inscrire
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;