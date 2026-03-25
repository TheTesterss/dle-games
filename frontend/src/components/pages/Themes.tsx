import { useState, useEffect, type MouseEvent, type SyntheticEvent } from 'react';
import pokemonImage from '../../assets/pokemon.png';
import pokemonVideo from '../../assets/pokemon.mp4';
import marioImage from '../../assets/mario.png';
import marioVideo from '../../assets/mario.mp4';
import minecraftImage from '../../assets/minecraft.png';
import minecraftVideo from '../../assets/minecraft.mp4';
import valorantImage from '../../assets/valorant.png';
import valorantVideo from '../../assets/valorant.mp4';
import rocketleagueImage from '../../assets/rocketleague.png';
import rocketleagueVideo from '../../assets/rocketleague.mp4';

type NavigateTo = (path: string) => void;

type ThemesProps = {
    navigateTo: NavigateTo;
};

type ThemeCategory = {
    name: string;
    video: string;
    playable: boolean;
    image: string;
};

const Themes = ({ navigateTo }: ThemesProps) => {
    const [categories, setCategories] = useState<ThemeCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data: ThemeCategory[] = [
                    {
                        name: 'pokemon',
                        video: pokemonVideo,
                        playable: true,
                        image: pokemonImage
                    },
                    {
                        name: 'mario',
                        video: marioVideo,
                        playable: false,
                        image: marioImage
                    },
                    {
                        name: 'minecraft',
                        video: minecraftVideo,
                        playable: false,
                        image: minecraftImage
                    },
                    {
                        name: 'valorant',
                        video: valorantVideo,
                        playable: false,
                        image: valorantImage
                    },
                    {
                        name: 'rocketleague',
                        video: rocketleagueVideo,
                        playable: false,
                        image: rocketleagueImage
                    }
                ];
                setCategories(data);
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement des catégories:', error);
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    const handleCategoryClick = (categoryName: string, playable: boolean) => {
        if (!playable) return;
        navigateTo(`/${categoryName}`);
    };

    const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
        const video = event.currentTarget.querySelector('video');
        if (video) {
            video.currentTime = 0;
            video.play().catch((err) => {
                if (err?.name === 'AbortError') return;
                console.warn('Impossible de lire la vidéo:', err);
            });
        }
    };

    const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
        const video = event.currentTarget.querySelector('video');
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
    };

    if (loading) {
        return (
            <main className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="text-2xl text-white">Chargement...</div>
            </main>
        );
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 mt-20">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">Thèmes Jouables</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
                {categories.map((category, index) => (
                    <div
                        key={index}
                        onClick={() => handleCategoryClick(category.name, category.playable)}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        className={`group relative overflow-hidden rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-110 hover:animate-shake bg-gray-800 shadow-lg hover:shadow-2xl ${!category.playable ? 'opacity-70' : ''}`}
                    >
                        <div className="relative w-full h-64 overflow-hidden">
                            <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover transition-all duration-500 filter grayscale group-hover:grayscale-0 group-hover:brightness-110 group-hover:opacity-0"
                                onError={(event: SyntheticEvent<HTMLImageElement>) => {
                                    console.error('Erreur chargement image:', category.image);
                                    event.currentTarget.style.display = 'none';
                                }}
                            />

                            <video
                                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 opacity-0 group-hover:opacity-100"
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                onError={() => {
                                    console.error('Erreur chargement vidéo:', category.video);
                                }}
                            >
                                <source src={category.video} type="video/mp4" />
                                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                                    <span className="text-white text-lg">Vidéo non supportée</span>
                                </div>
                            </video>

                            <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all duration-300"></div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                            <h3 className="text-xl font-bold text-white capitalize tracking-wide">{category.name}</h3>
                            {category.playable ? (
                                <span className="inline-block mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                                    Jouable
                                </span>
                            ) : (
                                <span className="inline-block mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                                    Non disponible
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {categories.length === 0 && !loading && (
                <div className="text-center text-gray-400 mt-8">
                    <p className="text-xl">Aucune catégorie disponible pour le moment.</p>
                </div>
            )}
        </main>
    );
};

export default Themes;
