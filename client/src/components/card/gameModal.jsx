import { useEffect, useState, useRef } from 'react';
import NoImage from '../../assets/noImage.jpg';
import { getGameVideo, getGameById } from '../../utils/api';
import MovieClip from './YouTube/youtube';

export default function GameModal({ game, onClose, location}) {
    if (!game) return null;

    const [hasVideo, setHasVideo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const modalRef = useRef(null);
    const modalContentRef = useRef(null);

    // Helper function to format the rating consistently
    const formatRating = (rating) => {
        if (rating === undefined || rating === null) return null;
        return Math.round(rating);
    };

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

    // Handle click outside
    const handleOutsideClick = (e) => {
        if (modalRef.current && !modalContentRef.current.contains(e.target)) {
            onClose();
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Scroll to top when modal opens
        window.scrollTo(0, 0);
        
        // Lock body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        // Set mounted to true after a small delay to enable animations
        const timer = setTimeout(() => {
            setMounted(true);
            // Force focus to the modal for better keyboard navigation
            if (modalRef.current) {
                modalRef.current.focus();
            }
        }, 50);
        
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
            clearTimeout(timer);
        };
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
                        game.videoId = null;
                    }
                } else {
                    game.videoId = null;
                }
            } catch (error) {
                game.videoId = null;
            } finally {
                setIsLoading(false);
            }
        };

        fetchGameVideo();
    }, [game]);

    // Helper function to render genres based on location
    const renderGenres = () => {
        if (location === "saved") {
            // For saved games
            if (game.genres && Array.isArray(game.genres)) {
                if (typeof game.genres[0] === 'string') {
                    // Handle string array directly from database
                    return game.genres.map((genre, index) => (
                        <span key={index} className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-md text-sm font-medium">
                            {genre}
                        </span>
                    ));
                } else {
                    // Handle object array from API
                    return game.genres.map((genre, index) => (
                        <span key={index} className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-md text-sm font-medium">
                            {genre.name}
                        </span>
                    ));
                }
            }
            return null;
        } else {
            // For non-saved games
            return game.genres && game.genres.map((genre, index) => (
                <span key={index} className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-md text-sm font-medium">
                    {genre.name}
                </span>
            ));
        }
    };

    // Helper function to render player perspectives based on location
    const renderPlayerPerspectives = () => {
        if (location === "saved") {
            // For saved games
            if (game.playerPerspectives && Array.isArray(game.playerPerspectives)) {
                if (typeof game.playerPerspectives[0] === 'string') {
                    // Handle string array directly from database
                    return game.playerPerspectives.map((perspective, index) => (
                        <span key={`pov-${index}`} className="bg-tonal-800 text-tonal-400 px-3 py-1 rounded-md text-sm font-medium">
                            {perspective}
                        </span>
                    ));
                }
            } else if (game.player_perspectives && Array.isArray(game.player_perspectives)) {
                // Handle object array from API
                return game.player_perspectives.map((perspective, index) => (
                    <span key={`pov-${index}`} className="bg-tonal-800 text-tonal-400 px-3 py-1 rounded-md text-sm font-medium">
                        {perspective.name}
                    </span>
                ));
            }
            return null;
        } else {
            // For non-saved games
            return game.player_perspectives && game.player_perspectives.map((perspective, index) => (
                <span key={`pov-${index}`} className="bg-tonal-800 text-tonal-400 px-3 py-1 rounded-md text-sm font-medium">
                    {perspective.name}
                </span>
            ));
        }
    };

    // Helper function to render game rating
    const renderRating = () => {
        // If the game data is still loading, show a placeholder
        if (game.isLoading) {
            return (
                <div className="animate-pulse ml-auto p-2 bg-surface-700/50 rounded h-8 w-16"></div>
            );
        }
        
        // Check for explicit "no rating available" flag
        if (game.no_rating_available) {
            return (
                <div className="text-gray-400 text-xl font-bold ml-auto flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor" opacity="0.5">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Not Rated</span>
                </div>
            );
        }
        
        // Get the rating directly from the game object - use either property
        const ratingValue = formatRating(game.total_rating || game.rating);
        
        // Only render if there's a valid rating
        if (ratingValue === null) {
            return null;
        }
        
        // Determine color based on rating
        let colorClass = "text-emerald-400";
        if (ratingValue < 70) colorClass = "text-amber-400";
        if (ratingValue < 50) colorClass = "text-red-400";
        
        return (
            <div className={`${colorClass} text-xl font-bold ml-auto flex items-center`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{ratingValue}<span className="text-sm">/100</span></span>
            </div>
        );
    };

    return (
        <div 
            ref={modalRef}
            className="fixed inset-0 z-50 overflow-hidden"
            style={{ 
                backdropFilter: 'blur(5px)',
                backgroundColor: 'rgba(0,0,0,0.7)' 
            }}
            onClick={handleOutsideClick}
        >
            {/* Fixed position modal container with scrolling */}
            <div className="fixed inset-0 pt-20 pb-6 px-4 overflow-y-auto">
                <div 
                    ref={modalContentRef}
                    tabIndex={-1}
                    className={`mx-auto my-6 bg-surface-900 p-6 w-full max-w-small sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-6xl shadow-xl relative border border-primary-600/30 rounded-lg transition-all duration-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                    <button 
                        onClick={onClose} 
                        className="absolute top-3 right-3 text-tonal-600 hover:text-primary-400 focus:outline-none bg-surface-800 rounded-full p-1.5 transition-colors duration-200 z-10"
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
                                <div className="flex items-center justify-between border-b border-primary-600/20 pb-1 mb-2">
                                    <h3 className="text-primary-400 text-xl font-bold">
                                        Genres & Perspectives
                                    </h3>
                                    {renderRating()}
                                </div>
                                <div className='flex flex-wrap gap-2 mt-2'>
                                    {renderGenres()}
                                    {renderPlayerPerspectives()}
                                    {(!renderGenres() && !renderPlayerPerspectives()) && (
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
        </div>
    );
} 
