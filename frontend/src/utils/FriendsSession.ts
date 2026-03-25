import { baseURL } from './d';
import { Account } from '../types';

class FriendsSession {
    static async getAll(userId: string): Promise<Account[]> {
        try {
            const res = await fetch(`${baseURL}/friends/${userId}/friends`, {
                credentials: 'include',
                mode: 'cors'
            });
            if (!res.ok) return [];
            return await res.json();
        } catch (error) {
            return [];
        }
    }

    static async getRequests(userId: string): Promise<any[]> {
        try {
            const res = await fetch(`${baseURL}/friends/${userId}/requests`, {
                credentials: 'include',
                mode: 'cors'
            });
            if (!res.ok) return [];
            return await res.json();
        } catch (error) {
            return [];
        }
    }

    static async remove(userId: string, targetId: string): Promise<any> {
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

    static async get(userId: string, targetId: string): Promise<any> {
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
