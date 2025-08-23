import { baseURL } from './d';

class FriendRequestSession {
    static async getAll() {
        const res = await fetch(`${baseURL}/requests`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération requêtes');
        return await res.json();
    }

    static async get(userId) {
        const res = await fetch(`${baseURL}/requests/${userId}`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération requête');
        return await res.json();
    }

    static async send(from, to) {
        const res = await fetch(`${baseURL}/requests`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to })
        });
        if (!res.ok) throw new Error('Erreur envoi requête');
        return await res.json();
    }

    static async accept(reqId) {
        const res = await fetch(`${baseURL}/requests/${reqId}/accept`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur acceptation requête');
        return await res.json();
    }

    static async cancel(reqId) {
        const res = await fetch(`${baseURL}/requests/${reqId}`, {
            method: 'PATCH',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur annulation requête');
        return await res.json();
    }

    static async deny(reqId) {
        const res = await fetch(`${baseURL}/requests/${reqId}/deny`, {
            method: 'DELETE',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur refus requête');
        return await res.json();
    }
}

export default FriendRequestSession;
