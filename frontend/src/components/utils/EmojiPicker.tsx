/// <reference types="vite/client" />
import React, { useMemo, useState } from 'react';
import { FaGem } from 'react-icons/fa';

type EmojiPickerProps = {
    onSelect: (value: string) => void;
    premiumTier?: 'games_one' | 'games_plus' | null;
};

const freeEmojis = ['😀', '😂', '😍', '😎', '🤔', '🔥', '🎉', '👍', '❤️', '👀', '😢', '😡'];

const pokemonEmojiModules = import.meta.glob('../../assets/emojis/pokemon/*.{png,webp,gif}', {
    eager: true,
    import: 'default'
}) as Record<string, string>;

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, premiumTier }) => {
    const [tab, setTab] = useState<'free' | 'pokemon'>('free');

    const pokemonAll = useMemo(() => Object.values(pokemonEmojiModules), []);
    const pokemonStatic = useMemo(
        () => pokemonAll.filter((u) => u.endsWith('.png') || u.endsWith('.webp')),
        [pokemonAll]
    );
    const pokemonAnimated = useMemo(() => pokemonAll.filter((u) => u.endsWith('.gif')), [pokemonAll]);

    const pokemonAllowed =
        premiumTier === 'games_plus'
            ? [...pokemonStatic, ...pokemonAnimated]
            : premiumTier === 'games_one'
            ? pokemonStatic
            : [];

    return (
        <div className="w-full mb-1 ml-1">
            <div className="flex items-center gap-2 m-3">
                <button
                    onClick={() => setTab('free')}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tab === 'free' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                >
                    Gratuits
                </button>
                <button
                    disabled={!premiumTier}
                    onClick={() => setTab('pokemon')}
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        tab === 'pokemon' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                >
                    <FaGem className="text-pink-200" />
                    Pokemon
                </button>
            </div>

            {tab === 'free' && (
                <div className="grid grid-cols-8">
                    {freeEmojis.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => onSelect(emoji)}
                            className="w-8 h-8 rounded-lg hover:bg-gray-800 transition text-lg"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {tab === 'pokemon' && (
                <div className="space-y-2">
                    <div className="grid grid-cols-8 gap-2 max-h-56 overflow-y-auto pr-1">
                        {(pokemonAllowed.length > 0 ? pokemonAllowed : pokemonStatic).map((url) => (
                            <button
                                key={url}
                                type="button"
                                onClick={() => {
                                    if (!premiumTier) return;
                                    onSelect(`<:pkm:${url}>`);
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    premiumTier ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'
                                }`}
                            >
                                <img src={url} alt="emoji" className="w-6 h-6 object-contain" />
                            </button>
                        ))}
                    </div>
                    {premiumTier === 'games_one' && pokemonAnimated.length > 0 && (
                        <div className="text-[10px] text-gray-500 flex items-center gap-1 ml-1">
                            <FaGem className="text-pink-400" />
                            Animations reservées Games Plus
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmojiPicker;
