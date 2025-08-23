import { baseURL } from './d';

class ForumSession {
    static async getAllPosts() {
        const res = await fetch(`${baseURL}/forum/posts`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération posts');
        return await res.json();
    }

    static async getUserPosts(userId) {
        const res = await fetch(`${baseURL}/forum/${userId}/posts`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération posts');
        return await res.json();
    }

    static async getPost(postId) {
        const res = await fetch(`${baseURL}/forum/posts/${postId}`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération post');
        return await res.json();
    }

    static async createPost(userId, content, image = null) {
        const res = await fetch(`${baseURL}/forum/${userId}/posts`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, image })
        });
        if (!res.ok) throw new Error('Erreur création post');
        return await res.json();
    }

    static async deletePost(userId, postId) {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}`, {
            method: 'DELETE',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur suppression post');
        return await res.json();
    }

    static async addComment(userId, postId, content) {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}/comments`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error('Erreur ajout commentaire');
        return await res.json();
    }

    static async deleteComment(userId, postId, commentId) {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur suppression commentaire');
        return await res.json();
    }

    static async toggleLike(userId, postId) {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}/like`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur toggle like');
        return await res.json();
    }
}

export default ForumSession;
