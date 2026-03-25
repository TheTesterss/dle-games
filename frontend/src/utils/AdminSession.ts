import { baseURL } from './d';

class AdminSession {
    static async getStats(adminId: string) {
        const res = await fetch(`${baseURL}/admin/${adminId}/stats`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur recuperation stats');
        return await res.json();
    }

    static async getAdmins(adminId: string) {
        const res = await fetch(`${baseURL}/admin/${adminId}/admins`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur recuperation admins');
        return await res.json();
    }

    static async moderateUser(adminId: string, userId: string, desactivated: boolean) {
        const res = await fetch(`${baseURL}/admin/${adminId}/moderate/${userId}`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ desactivated })
        });
        if (!res.ok) throw new Error('Erreur moderation');
        return await res.json();
    }

    static async updateBadges(adminId: string, userId: string, badges: any) {
        const res = await fetch(`${baseURL}/admin/${adminId}/badges/${userId}`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ badges })
        });
        if (!res.ok) throw new Error('Erreur badges');
        return await res.json();
    }

    static async updateUser(adminId: string, userId: string, payload: any) {
        const res = await fetch(`${baseURL}/admin/${adminId}/users/${userId}`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Erreur mise a jour utilisateur');
        return await res.json();
    }

    static async updatePremium(adminId: string, userId: string, payload: any) {
        const res = await fetch(`${baseURL}/admin/${adminId}/users/${userId}/premium`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Erreur mise a jour premium');
        return await res.json();
    }

    static async createPremiumGift(adminId: string, payload: { tier: 'games_one' | 'games_plus'; durationDays?: number; expiresInDays?: number }) {
        const res = await fetch(`${baseURL}/admin/${adminId}/premium_gifts`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Erreur creation lien premium');
        return await res.json();
    }

    static async getSystemLogs(adminId: string) {
        const res = await fetch(`${baseURL}/admin/${adminId}/logs`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur logs systeme');
        return await res.json();
    }

    static async getUserLogs(adminId: string, userId: string) {
        const res = await fetch(`${baseURL}/admin/${adminId}/users/${userId}/logs`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur logs user');
        return await res.json();
    }
}

export default AdminSession;
