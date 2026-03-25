import { baseURL } from './d';
import { Account } from '../types';

class Session {
    private static extractErrorMessage(payload: any, fallback: string): string {
        if (!payload) return fallback;
        if (typeof payload === 'string') return payload;

        const fromNested = (value: any): string | null => {
            if (!value) return null;
            if (typeof value === 'string') return value;
            if (typeof value?.message === 'string') return value.message;
            return null;
        };

        const direct = fromNested(payload.message) || fromNested(payload.error) || fromNested(payload.details);
        if (direct) return direct;

        try {
            return JSON.stringify(payload);
        } catch {
            return fallback;
        }
    }
    static save(user: Account) {
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 24);

        const session = {
            ...user,
            expiresAt: expiration.toISOString()
        };

        localStorage.setItem('session', JSON.stringify(session));
    }

    static clearExpired() {
        const sessionStr = localStorage.getItem('session');
        if (!sessionStr) return;
        const session = JSON.parse(sessionStr);
        if (session?.expiresAt && new Date() > new Date(session.expiresAt)) {
            localStorage.removeItem('session');
        }
    }

    static get(): Account | null {
        const sessionStr = localStorage.getItem('session');
        if (!sessionStr) return null;
        const session = JSON.parse(sessionStr);

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

    static async hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static async login(mail: string, password: string): Promise<Account> {
        const res = await fetch(`${baseURL}/accounts/${encodeURIComponent(mail)}?type=name`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Utilisateur non trouvé');
        const user = await res.json();
        if (!user || !user.password) throw new Error('Utilisateur non trouvé');

        const hashed = await Session.hashPassword(password);

        if (user.password !== hashed) throw new Error('Mot de passe incorrect');

        Session.save(user);
        return user;
    }

    static async signup(name: string, mail: string, password: string): Promise<Account> {
        const hashed = await Session.hashPassword(password);
        const trimmedName = name.trim();
        const normalizedMail = mail.trim().toLowerCase();
        const avatarSeed = encodeURIComponent((trimmedName.charAt(0) || 'U').toUpperCase());
        const res = await fetch(`${baseURL}/accounts`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: trimmedName,
                mail: normalizedMail,
                password: hashed,
                avatar: `https://placehold.co/100x100/007bff/ffffff?text=${avatarSeed}`
            })
        });
        if (!res.ok) {
            const payload = await res.json().catch(() => null);
            throw new Error(Session.extractErrorMessage(payload, 'Erreur lors de la création du compte'));
        }
        const user = await res.json();
        Session.save(user);
        return user;
    }

    static logout() {
        Session.clear();
        window.location.href = '/';
    }

    static updateUser(userData: Partial<Account>): Promise<Account> {
        const session = Session.get();
        if (!session) throw new Error('Utilisateur non connecté');

        const updatedUser = {
            ...session,
            ...userData,
        };

        return fetch(`${baseURL}/accounts/${session._id}`, {
            method: 'PATCH',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        }).then((res) => {
            if (!res.ok) throw new Error('Erreur lors de la mise à jour du profil');
            Session.save(updatedUser as Account);
            return updatedUser as Account;
        });
    }

    static getUser(name: string, requesterId?: string): Promise<Account> {
        let url = `${baseURL}/accounts/${encodeURIComponent(name)}?type=name`;
        if (requesterId) url += `&requesterId=${requesterId}`;
        return fetch(url, {
            credentials: 'include',
            mode: 'cors'
        })
            .then((res) => {
                if (!res.ok) throw new Error('Utilisateur non trouvé');
                return res.json();
            })
            .catch(() => {
                return {
                    _id: 'mock-id-' + name,
                    name: name,
                    avatar: 'https://placehold.co/100x100/007bff/ffffff?text=' + name.charAt(0),
                    stats: { matchesPlayed: 10, victories: 5, losses: 5, winRate: 50, longestStreak: 2 }
                } as Account;
            });
    }

    static getUserById(id: string, requesterId?: string): Promise<Account | null> {
        let url = `${baseURL}/accounts/${encodeURIComponent(id)}?type=id`;
        if (requesterId) url += `&requesterId=${requesterId}`;
        return fetch(url, {
            credentials: 'include',
            mode: 'cors'
        })
            .then((res) => {
                if (!res.ok) throw new Error('Utilisateur non trouvé');
                return res.json();
            })
            .catch(() => {
                return null;
            });
    }

    static getUsers(): Promise<Account[]> {
        return fetch(`${baseURL}/accounts`, {
            credentials: 'include',
            mode: 'cors'
        })
            .then((res) => {
                if (!res.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
                return res.json();
            })
            .catch(() => {
                return Array.from({ length: 20 }, (_, i) => ({
                    _id: `mock-user-${i}`,
                    name: `Joueur ${i + 1}`,
                    avatar: `https://placehold.co/100x100/007bff/ffffff?text=J${i + 1}`,
                    stats: {
                        matchesPlayed: Math.floor(Math.random() * 100),
                        victories: Math.floor(Math.random() * 50),
                        losses: Math.floor(Math.random() * 50),
                        winRate: Math.floor(Math.random() * 100),
                        longestStreak: Math.floor(Math.random() * 10),
                        pokemon: {
                            solo: { victories: Math.floor(Math.random() * 20) },
                            multi_unique: { victories: Math.floor(Math.random() * 20) },
                            multi_same: { victories: Math.floor(Math.random() * 20) },
                            multi_turn: { victories: Math.floor(Math.random() * 20) }
                        }
                    }
                })) as Account[];
            });
    }

    static getLogs(userId: string): Promise<any[]> {
        return fetch(`${baseURL}/accounts/${userId}/logs`, {
            credentials: 'include',
            mode: 'cors'
        }).then((res) => {
            if (!res.ok) throw new Error('Erreur logs');
            return res.json();
        });
    }

    static getStatsHistory(userId: string, days: number = 30): Promise<any> {
        return fetch(`${baseURL}/accounts/${userId}/stats_history?days=${days}`, {
            credentials: 'include',
            mode: 'cors'
        }).then((res) => {
            if (!res.ok) throw new Error('Erreur stats');
            return res.json();
        });
    }
}

export default Session;



