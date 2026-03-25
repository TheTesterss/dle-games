export const translateColor = (color: string | undefined): string => {
    const map: Record<string, string> = {
        red: 'Rouge',
        blue: 'Bleu',
        yellow: 'Jaune',
        green: 'Vert',
        black: 'Noir',
        brown: 'Marron',
        purple: 'Violet',
        gray: 'Gris',
        white: 'Blanc',
        pink: 'Rose'
    };
    return color ? (map[color.toLowerCase()] || color) : 'Inconnu';
};

export const translateMode = (mode: string): string => {
    const map: Record<string, string> = {
        solo: 'Solo',
        multi_individual: 'Battle Royale',
        multi_same: 'Course (Même Pokémon)',
        turns_shared: 'Coopération'
    };
    return map[mode] || mode;
};

export const formatType = (type: string | undefined): string => {
    if (!type) return 'Aucun';
    const map: Record<string, string> = {
        Electrik: 'Electrique',
        Eletric: 'Electrique',
        Psy: 'Psy'
    };
    return map[type] || type;
};

