import { baseURL } from './d';

class FriendsSession {
    static async getAll(userId) {
        const res = await fetch(`${baseURL}/friends/${userId}/friends`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error(`Erreur récupération amis ${userId}`);
        return await res.json();
    }

    static async remove(userId, targetId) {
        const res = await fetch(`${baseURL}/friends/${userId}`, {
            method: 'DELETE',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: targetId })
        });
        if (!res.ok) throw new Error('Erreur suppression ami');
        return await res.json();
    }

    static async get(userId, targetId) {
        const res = await fetch(`${baseURL}/friends/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: targetId }),
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur recherche ami');
        return await res.json();
    }
}

export default FriendsSession;
