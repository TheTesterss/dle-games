import { baseURL } from './d';
import { FriendRequest } from '../types';

class FriendRequestSession {
    static async getAll(): Promise<FriendRequest[]> {
        const res = await fetch(`${baseURL}/requests`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération requêtes');
        return await res.json();
    }

    static async get(userId: string): Promise<FriendRequest[]> {
        const res = await fetch(`${baseURL}/requests/${userId}`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération requête');
        return await res.json();
    }

    static async send(from: string, to: string): Promise<FriendRequest> {
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

    static async accept(reqId: string): Promise<any> {
        const res = await fetch(`${baseURL}/requests/${reqId}/accept`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur acceptation requête');
        return await res.json();
    }

    static async cancel(reqId: string): Promise<any> {
        const res = await fetch(`${baseURL}/requests/${reqId}`, {
            method: 'PATCH',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur annulation requête');
        return await res.json();
    }

    static async deny(reqId: string): Promise<any> {
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
