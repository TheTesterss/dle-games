import DiscordInfo from '../utils/DiscordInfo';
import { getNewsArticle } from '../../data/newsArticles';

type NavigateTo = (path: string) => void;

type NewsArticleProps = {
    slug: string;
    navigateTo: NavigateTo;
};

type NewsSection = {
    title: string;
    body: string;
};

type NewsArticleData = {
    slug: string;
    title: string;
    subtitle?: string;
    tags?: string[];
    includeDiscordInfo?: boolean;
    sections?: NewsSection[];
};

const NewsArticle = ({ slug, navigateTo }: NewsArticleProps) => {
    const article = getNewsArticle(slug) as NewsArticleData | undefined;

    if (!article) {
        return (
            <section className="max-w-4xl mx-auto py-12 min-h-[70vh] text-white">
                <h2 className="text-3xl font-bold text-center">Article introuvable</h2>
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => navigateTo('/news')}
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    >
                        Retour aux nouveautés
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="max-w-4xl mx-auto py-12 min-h-[70vh] text-white">
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-8 space-y-6">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-blue-300">
                        {article.tags?.map((tag) => (
                            <span key={tag} className="px-2 py-1 rounded-full bg-blue-900/40 border border-blue-700/50">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-4xl font-extrabold">{article.title}</h1>
                    {article.subtitle && <p className="text-lg text-gray-300">{article.subtitle}</p>}
                </div>

                {article.includeDiscordInfo && (
                    <div className="mt-4">
                        <DiscordInfo />
                    </div>
                )}

                <div className="space-y-6">
                    {article.sections?.map((section) => (
                        <div key={section.title} className="bg-gray-950/70 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-2xl font-semibold mb-3">{section.title}</h3>
                            <div
                                className="space-y-3 text-gray-300 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: section.body }}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-between flex-wrap gap-3 pt-4">
                    <button
                        onClick={() => navigateTo('/news')}
                        className="px-6 py-3 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 transition"
                    >
                        Retour aux nouveautés
                    </button>
                    <button
                        onClick={() => navigateTo('/')}
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    >
                        Revenir à l'accueil
                    </button>
                </div>
            </div>
        </section>
    );
};

export default NewsArticle;
