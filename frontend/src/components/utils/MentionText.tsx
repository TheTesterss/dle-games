import React from 'react';

const mentionRegex = /<([@#])([a-fA-F0-9]{24}|[a-zA-Z0-9_-]+)>/g;
const pokemonEmojiRegex = /<:pkm:([^>]+)>/g;
const legacyMentionRegex = /@([a-zA-Z0-9_]+)/g;
const pokemonEmojiModules = (import.meta as any).glob('../../assets/emojis/pokemon/*.{png,webp,gif}', {
    eager: true,
    import: 'default'
}) as Record<string, any>;
const pokemonEmojiByName = new Map(
    Object.entries(pokemonEmojiModules).map(([path, url]) => [path.split('/').pop() || path, url])
);

const resolvePokemonEmojiUrl = (raw?: string) => {
    if (!raw) return '';
    if (raw.startsWith('http') || raw.startsWith('/assets/')) return raw;
    const normalized = raw.replace(/^\.?\//, '');
    if (normalized.startsWith('src/assets/emojis/pokemon/')) {
        const file = normalized.split('/').pop();
        if (file && pokemonEmojiByName.has(file)) return pokemonEmojiByName.get(file) || raw;
    }
    const fallbackFile = raw.split('/').pop();
    if (fallbackFile && pokemonEmojiByName.has(fallbackFile)) return pokemonEmojiByName.get(fallbackFile) || raw;
    return raw;
};

interface MentionTextProps {
    text: string;
    navigateTo?: (path: string) => void;
    className?: string;
    knownUsers?: Map<string, string>;
    onUserClick?: (name: string) => void;
}

const MentionText: React.FC<MentionTextProps> = ({ text, navigateTo, className = '', knownUsers, onUserClick }) => {
    if (!text) return null;
    const parts: any[] = [];
    const textToParse = text.replace(/&lt;:pkm:([^&]+)&gt;/g, '<:pkm:$1>');
    let match: RegExpExecArray | null;

    const allMatches: any[] = [];
    while ((match = mentionRegex.exec(textToParse)) !== null) {
        allMatches.push({
            index: match.index,
            length: match[0].length,
            type: match[1] === '@' ? 'user' : 'post',
            id: match[2],
            raw: match[0]
        });
    }
    while ((match = pokemonEmojiRegex.exec(textToParse)) !== null) {
        allMatches.push({
            index: match.index,
            length: match[0].length,
            type: 'pkm',
            url: match[1],
            raw: match[0]
        });
    }
    while ((match = legacyMentionRegex.exec(textToParse)) !== null) {
        allMatches.push({
            index: match.index,
            length: match[0].length,
            type: 'legacy',
            username: match[1],
            raw: match[0]
        });
    }

    allMatches.sort((a, b) => a.index - b.index);

    const filteredMatches: any[] = [];
    let currentIdx = -1;
    for (const m of allMatches) {
        if (m.index >= currentIdx) {
            filteredMatches.push(m);
            currentIdx = m.index + m.length;
        }
    }

    let lastIndex = 0;
    filteredMatches.forEach((m) => {
        if (m.index > lastIndex) {
            parts.push({ type: 'text', value: textToParse.slice(lastIndex, m.index) });
        }
        parts.push(m);
        lastIndex = m.index + m.length;
    });

    if (lastIndex < textToParse.length) {
        parts.push({ type: 'text', value: textToParse.slice(lastIndex) });
    }

    return (
        <span className={className}>
            {parts.map((part, idx) => {
                if (part.type === 'text') return <span key={idx}>{part.value}</span>;

                if (part.type === 'user') {
                    const mappedName = knownUsers?.get(part.id) || part.id;
                    const label = knownUsers?.get(part.id) ? `@${mappedName}` : `@${part.id.slice(-6)}`;
                    return (
                        <button
                            key={idx}
                            onClick={() => navigateTo?.(`/user/${mappedName}`)}
                            className="mx-0.5 inline-flex items-center rounded-md border border-blue-400/50 bg-blue-500/20 px-1.5 py-0.5 font-mono text-xs text-blue-200 hover:bg-blue-500/30 transition-colors"
                        >
                            {label}
                        </button>
                    );
                }

                if (part.type === 'post') {
                    return (
                        <button
                            key={idx}
                            onClick={() => navigateTo?.(`/forum/post/${part.id}`)}
                            className="mx-0.5 inline-flex items-center rounded-md border border-green-400/50 bg-green-500/20 px-1.5 py-0.5 font-mono text-xs text-green-200 hover:bg-green-500/30 transition-colors"
                        >
                            post-{part.id.slice(-6)}
                        </button>
                    );
                }

                if (part.type === 'pkm') {
                    const resolvedUrl = resolvePokemonEmojiUrl(part.url);
                    return (
                        <img
                            key={idx}
                            src={resolvedUrl}
                            alt="emoji"
                            className="inline-block w-5 h-5 mx-0.5 align-text-bottom"
                        />
                    );
                }

                const mappedName = knownUsers?.get(part.username.toLowerCase()) ?? part.username;
                const handleLegacyClick = () => {
                    if (onUserClick) {
                        onUserClick(mappedName);
                        return;
                    }
                    navigateTo?.(`/user/${mappedName}`);
                };

                return (
                    <button
                        key={idx}
                        onClick={handleLegacyClick}
                        className="mx-0.5 text-blue-400 hover:underline font-bold"
                    >
                        @{mappedName}
                    </button>
                );
            })}
        </span>
    );
};

export default MentionText;
