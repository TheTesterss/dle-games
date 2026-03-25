export const newsArticles = [
    {
        slug: 'launch-update',
        title: 'Lancement officiel',
        subtitle: 'Tout ce qu\'il faut savoir',
        excerpt: "Le jeu est officiellement lancé : corrections de bugs, optimisation et premières quêtes disponibles.",
        tags: ['Annonce', 'Lancement'],
    },
    {
        slug: 'patch-1-1',
        title: 'Patch 1.1',
        subtitle: 'Corrections et équilibrages',
        excerpt: "Des ajustements d'équilibrage, améliorations de l'interface et plusieurs correctifs signalés par la communauté.",
        tags: ['Mise à jour', 'Correctif'],
    },
    {
        slug: 'dev-roadmap',
        title: 'Feuille de route des développeurs',
        subtitle: 'Aperçu des prochaines fonctionnalités',
        excerpt: "Découvrez les prochaines étapes : nouvelles zones, systèmes de guilde et refonte du matchmaking.",
        tags: ['Roadmap', 'Dev'],
    },
];

export const getNewsArticle = (slug: string) => {
    return newsArticles.find((article) => article.slug === slug);
};