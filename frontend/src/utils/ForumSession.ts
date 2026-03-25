import { baseURL } from './d';
import { Post } from '../types';

class ForumSession {
    static async getAllPosts(): Promise<Post[]> {
        const res = await fetch(`${baseURL}/forum/posts`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération posts');
        return await res.json();
    }

    static async getFeed(userId: string): Promise<Post[]> {
        const res = await fetch(`${baseURL}/forum/${userId}/feed`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération feed');
        return await res.json();
    }

    static async getUserPosts(userId: string): Promise<Post[]> {
        const res = await fetch(`${baseURL}/forum/${userId}/posts`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération posts');
        return await res.json();
    }

    static async getUserReposts(userId: string): Promise<Post[]> {
        const res = await fetch(`${baseURL}/forum/${userId}/reposts`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération reposts');
        return await res.json();
    }

    static async getUserAnswers(userId: string): Promise<Array<{ post: Post; answers: any[] }>> {
        const res = await fetch(`${baseURL}/forum/${userId}/answers`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération réponses');
        return await res.json();
    }

    static async getPost(postId: string): Promise<Post> {
        const res = await fetch(`${baseURL}/forum/posts/${postId}`, {
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur récupération post');
        return await res.json();
    }

    static async createPost(
        userId: string,
        content: string,
        images: string[] = [],
        image: string | null = null,
        repostOf: string | null = null,
        allowComments: boolean = true,
        allowReposts: boolean = true,
        videos: string[] = [],
        video: string | null = null
    ): Promise<Post> {
        const res = await fetch(`${baseURL}/forum/${userId}/posts`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, images, image, repostOf, allowComments, allowReposts, videos, video })
        });
        if (!res.ok) throw new Error('Erreur création post');
        return await res.json();
    }

    static async updatePost(userId: string, postId: string, content: string): Promise<Post> {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}`, {
            method: 'PATCH',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error('Erreur modification post');
        return await res.json();
    }

    static async togglePinPost(userId: string, postId: string): Promise<Post> {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}/pin`, {
            method: 'PATCH',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur épinglage post');
        return await res.json();
    }

    static async deletePost(userId: string, postId: string): Promise<any> {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}`, {
            method: 'DELETE',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur suppression post');
        return await res.json();
    }

    static async addComment(userId: string, postId: string, content: string, images: string[] = [], videos: string[] = []): Promise<Post> {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}/comments`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, images, videos })
        });
        if (!res.ok) throw new Error('Erreur ajout commentaire');
        return await res.json();
    }

    static async deleteComment(userId: string, postId: string, commentId: string): Promise<Post> {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur suppression commentaire');
        return await res.json();
    }

    static async toggleLike(userId: string, postId: string): Promise<Post> {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}/like`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Erreur toggle like');
        return await res.json();
    }

    static async repostPost(userId: string, postId: string, content: string = ''): Promise<Post> {
        const res = await fetch(`${baseURL}/forum/${userId}/posts/${postId}/repost`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error('Erreur repost');
        return await res.json();
    }
}

export default ForumSession;

