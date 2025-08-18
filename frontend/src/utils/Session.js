import { baseURL } from './d';

class Session {
    static save(user) {
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 24); // expire dans 24h

        const session = {
            ...user,
            expiresAt: expiration.toISOString()
        };

        localStorage.setItem('session', JSON.stringify(session));
    }

    static clearExpired() {
        const session = JSON.parse(localStorage.getItem('session'));
        if (session?.expiresAt && new Date() > new Date(session.expiresAt)) {
            localStorage.removeItem('session');
        }
    }

    static get() {
        const session = JSON.parse(localStorage.getItem('session'));

        if (!session) return null;

        if (session.expiresAt) {
            const now = new Date();
            const expirationDate = new Date(session.expiresAt);

            if (now > expirationDate) {
                return null;
            }
        }

        return session;
    }

    static clear() {
        localStorage.removeItem('session');
    }

    static async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static async login(mail, password) {
        const res = await fetch(`${baseURL}/accounts/${encodeURIComponent(mail)}?type=mail`, {
            credentials: 'include',
            mode: 'cors'
        });
        console.log(res);
        if (!res.ok) throw new Error('Utilisateur non trouvé');
        const user = await res.json();
        if (!user || !user.password) throw new Error('Utilisateur non trouvé');

        const hashed = await Session.hashPassword(password);

        if (user.password !== hashed) throw new Error('Mot de passe incorrect');

        Session.save(user);
        return user;
    }

    static async signup(name, mail, password) {
        const hashed = await Session.hashPassword(password);
        const res = await fetch(`${baseURL}/accounts`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                mail,
                avatar: 'https://placehold.co/100x100/007bff/ffffff?text=U',
                password: hashed,
                stats: {
                    matchesPlayed: 0,
                    victories: 0,
                    losses: 0,
                    winRate: 0,
                    favoriteGame: 'Pokémon',
                    longestStreak: 0,
                    mostPlayedOpponent: 'Uknown User'
                }
            })
        });
        console.error(res);
        if (!res.ok) throw new Error('Erreur lors de la création du compte');
        const user = await res.json();
        Session.save(user);
        return user;
    }

    static logout() {
        Session.clear();
        window.location.href = '/';
    }

    static updateUser(userData) {
        const session = Session.get();
        if (!session) throw new Error('Utilisateur non connecté');

        const updatedUser = { _id: session._id, ...userData };

        return fetch(`${baseURL}/accounts/${updatedUser._id}`, {
            method: 'PATCH',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        }).then((res) => {
            console.log(res);
            if (!res.ok) throw new Error('Erreur lors de la mise à jour du profil');
            Session.save(updatedUser);
            return updatedUser;
        });
    }

    static getUser(name) {
        return fetch(`${baseURL}/accounts/${encodeURIComponent(name)}?type=name`, {
            credentials: 'include',
            mode: 'cors'
        })
            .then((res) => {
                if (!res.ok) throw new Error('Utilisateur non trouvé');
                return res.json();
            })
            .then((user) => {
                return user;
            });
    }

    static getUsers() {
        return fetch(`${baseURL}/accounts`, {
            credentials: 'include',
            mode: 'cors'
        }).then((res) => {
            if (!res.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
            return res.json();
        });
    }
}

export default Session;
