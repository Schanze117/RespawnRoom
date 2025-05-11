import { useEffect, useState } from 'react';
import NoImage from '../../assets/noImage.jpg';
import { getGameVideo, getGameById } from '../../utils/api';
import MovieClip from './YouTube/youtube';

export default function GameModal({ game, onClose, location}) {
    if (!game) return null;

    const [hasVideo, setHasVideo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    function handleImage(location) {
        let hdCover;
        if (location === "saved") {
            // Handle saved games which might have direct image IDs
            if (game.cover) {
                if (game.cover.startsWith('co') || game.cover.startsWith('tm')) {
                    hdCover = `https://images.igdb.com/igdb/image/upload/t_1080p/${game.cover}`;
                } else {
                    hdCover = game.cover.replace('t_thumb', 't_1080p')
                                      .replace('t_cover_small', 't_1080p')
                                      .replace('t_729p', 't_1080p');
                }
            } else {
                hdCover = NoImage;
            }
        } else {
            // Handle regular games from IGDB API
            hdCover = game.cover ? game.cover.url.replace('t_thumb', 't_1080p')
                                              .replace('t_cover_small', 't_1080p')
                                              .replace('t_729p', 't_1080p')
                                : NoImage;
        }
        return hdCover;
    }

    const hdCover = handleImage(location);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const fetchGameVideo = async () => {
            try {
                setIsLoading(true);
                
                // If game already has videos array, use it
                if (game.videos && game.videos.length > 0) {
                    // Make sure we're passing a number as the ID
                    const videoId = typeof game.videos[0] === 'object' ? game.videos[0].id : game.videos[0];
                    const videoData = await getGameVideo(videoId);
                    if (videoData && videoData.length > 0) {
                        const video = videoData[0];
                        game.videoId = video.video_id;
                        setHasVideo(true);
                    } else {
                        game.videoId = null;
                    }
                } 
                // If game doesn't have videos array but has an ID, fetch full game data
                else if (game.id) {
                    try {
                        // Fetch complete game data that includes videos
                        const fullGameData = await getGameById(game.id);
                        if (fullGameData && fullGameData.videos && fullGameData.videos.length > 0) {
                            // Make sure we're passing a number as the ID
                            const videoId = typeof fullGameData.videos[0] === 'object' ? fullGameData.videos[0].id : fullGameData.videos[0];
                            const videoData = await getGameVideo(videoId);
                            if (videoData && videoData.length > 0) {
                                const video = videoData[0];
                                game.videoId = video.video_id;
                                setHasVideo(true);
                            } else {
                                game.videoId = null;
                            }
                        }
                    } catch (fetchError) {
                        console.error('Error fetching game details:', fetchError);
                        game.videoId = null;
                    }
                } else {
                    game.videoId = null;
                }
            } catch (error) {
                console.error('Error fetching game video:', error);
                game.videoId = null;
            } finally {
                setIsLoading(false);
            }
        };

        fetchGameVideo();
    }, [game]);

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center z-50 modalBackground" 
            onClick={(e) => e.target.classList.contains('modalBackground') && onClose()}
        >
            <div className="bg-surface-900 p-6 w-full max-w-small sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-6xl h-auto max-h-[90vh] shadow-xl relative overflow-y-auto border border-primary-600/30 rounded-lg transform transition-all duration-300 translate-y-0 opacity-100">
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-tonal-600 hover:text-primary-400 focus:outline-none bg-surface-800 rounded-full p-1.5 transition-colors duration-200"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <h2 className="text-primary-500 text-3xl font-bold text-pretty text-center w-full border-b border-primary-600/20 pb-3 mb-4">
                    {game.name}
                </h2>
                <div className="flex xl:flex-row flex-col xl:space-x-6 space-y-6 xl:space-y-0 mt-2 py-4 rounded-lg bg-surface-800/70 border border-primary-600/10">
                    {/* Cover Image */}
                    <div className='xl:w-[45%] w-full max-w-lg mx-auto'>
                        {hdCover !== NoImage ? (
                            <img
                                src={hdCover}
                                alt={game.name}
                                className="w-full h-full object-cover rounded-lg shadow-lg"
                            />
                        ) : (
                            <div className="w-full aspect-ratio-2/3 min-h-[300px] flex items-center justify-center bg-surface-800 rounded-lg shadow-lg">
                                <img
                                    src={NoImage}
                                    alt="No image available"
                                    className="w-2/3 h-2/3 object-contain opacity-70"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col text-pretty items-center xl:w-[55%] w-full space-y-4 px-4">
                        {/* Genres and POVs */}
                        <div className="w-full">
                            <h3 className="text-primary-400 text-xl font-bold mb-2 border-b border-primary-600/20 pb-1">
                                Genres & Perspectives
                            </h3>
                            <div className='flex flex-wrap gap-2 mt-2'>
                                {game.genres && game.genres.map((genre, index) => (
                                    <span key={index} className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-md text-sm font-medium">
                                        {genre.name}
                                    </span>
                                ))}
                                {game.player_perspectives && game.player_perspectives.map((perspective, index) => (
                                    <span key={`pov-${index}`} className="bg-tonal-800 text-tonal-400 px-3 py-1 rounded-md text-sm font-medium">
                                        {perspective.name}
                                    </span>
                                ))}
                                {(!game.genres || game.genres.length === 0) && (!game.player_perspectives || game.player_perspectives.length === 0) && (
                                    <span className="text-tonal-400">No genre or perspective information available</span>
                                )}
                            </div>
                        </div>
                        
                        {/* Summary */}
                        <div className="w-full">
                            <h3 className="text-primary-400 text-xl font-bold mb-2 border-b border-primary-600/20 pb-1">
                                Summary
                            </h3>
                            <div className="bg-surface-700/50 rounded-lg p-4 max-h-60 overflow-y-auto text-light text-opacity-90 shadow-inner">
                                {game.summary || 'No summary available.'}
                            </div>
                        </div>
                        
                        {/* Video Section */}
                        <div className="w-full">
                            <h3 className="text-primary-400 text-xl font-bold mb-2 border-b border-primary-600/20 pb-1">
                                Trailer
                            </h3>
                            <div className="rounded-lg overflow-hidden shadow-lg">
                                <div className="relative pt-[56.25%] h-0">
                                    {isLoading ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-surface-800">
                                            <div className="animate-pulse flex space-x-2">
                                                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                                                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                                                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                                            </div>
                                        </div>
                                    ) : hasVideo ? (
                                        <MovieClip videoId={game.videoId} />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-surface-800 text-tonal-400">
                                            <p>No trailer available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
