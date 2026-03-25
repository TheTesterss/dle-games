import { useMemo, useState } from 'react';
import DiscordInfo from '../utils/DiscordInfo';
import { newsArticles } from '../../data/newsArticles';

type NavigateTo = (path: string) => void;

type NewsProps = {
    navigateTo: NavigateTo;
};

type NewsArticle = {
    slug: string;
    title: string;
    subtitle?: string;
    excerpt: string;
    tags?: string[];
};

const News = ({ navigateTo }: NewsProps) => {
    const [layout, setLayout] = useState<'grid' | 'row'>('grid');

    const articles = useMemo<NewsArticle[]>(() => newsArticles as NewsArticle[], []);

    return (
        <section className="max-w-6xl mx-auto py-12 min-h-[70vh] flex flex-col gap-8">
            <div className="flex flex-col items-center text-center gap-3">
                <h2 className="text-4xl font-bold text-white">Nouveautés</h2>
                <p className="text-gray-400 max-w-2xl">
                    Des articles plus denses, des exemples concrets et des pages dédiées pour chaque nouveauté.
                </p>
            </div>

            <div className="flex justify-center">
                <div className="flex items-center gap-3 bg-gray-900/80 border border-gray-800 rounded-xl p-2">
                    <button
                        onClick={() => setLayout('grid')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                            layout === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                        }`}
                    >
                        Grille
                    </button>
                    <button
                        onClick={() => setLayout('row')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                            layout === 'row' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                        }`}
                    >
                        Liste
                    </button>
                </div>
            </div>

            <div className={layout === 'grid' ? 'grid gap-6 md:grid-cols-2' : 'flex flex-col gap-6'}>
                {articles.map((article) => (
                    <article
                        key={article.slug}
                        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4"
                    >
                        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-blue-300">
                            {article.tags?.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 rounded-full bg-blue-900/40 border border-blue-700/50"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white">{article.title}</h3>
                            {article.subtitle && <p className="text-gray-300 font-medium">{article.subtitle}</p>}
                            <p className="text-gray-400">{article.excerpt}</p>
                        </div>
                        <div className="mt-auto flex flex-wrap gap-3">
                            <button
                                onClick={() => navigateTo(`/news/${article.slug}`)}
                                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                            >
                                Lire l'article complet
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Focus Discord</h3>
                <p className="text-gray-300 mb-4">
                    Un espace vivant pour les annonces, le support et les salons de jeu. Les informations ci-dessous
                    sont mises à jour automatiquement.
                </p>
                <DiscordInfo />
            </div>
        </section>
    );
};

export default News;
