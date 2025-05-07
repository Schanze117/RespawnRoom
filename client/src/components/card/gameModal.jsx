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
            <div className="bg-surface-700 p-6 w-full max-w-small sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-6xl h-auto max-h-[90vh] shadow-2xl relative overflow-y-auto border-collapse border border-tonal-400 rounded-lg">
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-tonal-600 hover:text-tonal-800 focus:outline-none"
                >
                    X
                </button>
                <h2 className="text-primary-500 text-3xl font-medium text-pretty text-center w-full border-b border-tonal-400">
                    {game.name}
                </h2>
                <div className="flex xl:flex-row flex-col space-x-4 mt-2 py-2 border border-tonal-400">
                    {/* Cover Image */}
                    <div className='w-full max-w-lg mx-auto aspect-ratio-16/9'>
                        <img
                            src={hdCover}
                            alt={game.name}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col text-pretty text-sm text-center items-center max-md:pt-5 w-auto xl:w-[50%] space-y-1">
                        {/* Genres and POVs */}
                        <h3 className="text-tonal-400 text-xl font-medium text-pretty pointer-events-none border-b border-tonal-400 mx-2 w-[95%] shadow-lg">
                            Genres and POVs
                        </h3>
                        <div className='w-auto max-w-[95%] items-center justify-center mx-auto text-center text-tonal-400 text-sm mt-2'>
                            <p className="pointer-events-none">
                                <span className="text-primary-400 font-medium pointer-events-none">
                                    Genres:{' '}
                                </span>
                                {game.genres ? game.genres.map((genre) => genre.name).join(', ') : 'N/A'}
                            </p>
                            <p className="pointer-events-none">
                                <span className="text-primary-400 font-medium pointer-events-none">
                                    POV:{' '}
                                </span>
                                {game.player_perspectives 
                                    ? game.player_perspectives.map((perspective) => perspective.name).join(', ') 
                                    : 'N/A'}
                            </p>
                        </div>
                        {/* Summary */}
                        <h3 className="text-tonal-400 text-xl font-medium text-pretty pointer-events-none border-b border-tonal-400 mx-2 w-[95%] shadow-lg">
                            Summary
                        </h3>
                        <p className="text-light bg-surface-700 rounded-lg w-full text-base p-2 mx-2 text-pretty max-w-[95%] max-h-80 overflow-y-auto mt-2">
                            {game.summary || 'No summary available.'}
                        </p>
                        {/* Video Section */}
                        <h3 className="text-tonal-400 text-xl font-medium text-pretty pointer-events-none border-b border-tonal-400 mx-2 w-[95%] shadow-lg">
                            Trailer
                        </h3>
                        <div className='w-full max-w-[95%]'>
                            <div className="rounded-lg relative pt-[56.25%] h-0 mt-4">
                                {isLoading ? (
                                    <p className="text-center text-light">Loading video...</p>
                                ) : hasVideo ? (
                                    <MovieClip videoId={game.videoId} />
                                ) : (
                                    <div className="text-center text-light">
                                        <p>No video available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
