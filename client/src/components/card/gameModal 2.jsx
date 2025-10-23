import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
                    hdCover = `${import.meta.env.VITE_IGDB_IMAGE_URL}/t_1080p/${game.cover}`;
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

    // Handle click outside - only allow closing via outside click or X button
    const handleOutsideClick = (e) => {
        if (e.target === modalRef.current) {
            onClose();
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Prevent background scrolling when modal is open
        const originalStyle = window.getComputedStyle(document.body).overflow;
        const originalPosition = window.getComputedStyle(document.body).position;
        const scrollY = window.scrollY;
        
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        
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
            document.body.style.overflow = originalStyle;
            document.body.style.position = originalPosition;
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollY);
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

    const modalContent = (
        <div 
            ref={modalRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ 
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(0,0,0,0.85)'
            }}
            onClick={handleOutsideClick}
        >
            <div 
                ref={modalContentRef}
                className={`bg-[#1F2937] w-full max-w-6xl shadow-2xl border-2 border-[#374151] rounded-lg transition-all duration-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={{ 
                    maxHeight: '95vh',
                    overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-[#374151] relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-tonal-600 hover:text-primary-400 focus:outline-none bg-[#374151] hover:bg-[#6D9F5B] rounded-full p-2 transition-all duration-200 z-10 hover:scale-105 shadow-lg"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    
                    <h2 className="text-primary-500 text-3xl font-bold text-pretty text-center w-full pr-12">
                        {game.name}
                    </h2>
                </div>
                
                {/* Content - Extended with bottom padding */}
                <div className="p-6 pb-8">
                    {/* Use Flexbox for better layout control */}
                    <div className="flex xl:flex-row flex-col xl:space-x-8 space-y-6 xl:space-y-0">
                        {/* Cover Image - Even bigger */}
                        <div className='xl:w-1/2 w-full flex-shrink-0'>
                            <div className="aspect-[3/4] w-full">
                                {hdCover !== NoImage ? (
                                    <img
                                        src={hdCover}
                                        alt={game.name}
                                        className="w-full h-full object-cover rounded-lg shadow-lg"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#374151] rounded-lg shadow-lg">
                                        <img
                                            src={NoImage}
                                            alt="No image available"
                                            className="w-2/3 h-2/3 object-contain opacity-70"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Content - Adjusted for larger image */}
                        <div className="xl:w-1/2 w-full space-y-6">
                            {/* Genres and POVs */}
                            <div className="w-full">
                                <div className="flex items-center justify-between border-b-2 border-primary-600/30 pb-3 mb-4">
                                    <h3 className="text-primary-400 text-xl font-bold">
                                        Genres & Perspectives
                                    </h3>
                                    <div className="flex-shrink-0 ml-4">
                                        {renderRating()}
                                    </div>
                                </div>
                                <div className='flex flex-wrap gap-3 mt-4'>
                                    {renderGenres()}
                                    {renderPlayerPerspectives()}
                                    {(!renderGenres() && !renderPlayerPerspectives()) && (
                                        <span className="text-tonal-400">No genre or perspective information available</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Summary - Expanded */}
                            <div className="w-full">
                                <h3 className="text-primary-400 text-lg font-bold mb-3 border-b-2 border-primary-600/30 pb-2">
                                    Summary
                                </h3>
                                <div className="bg-[rgba(31,41,55,0.6)] rounded-lg p-5 text-light text-opacity-90 shadow-inner border border-[rgba(31,41,55,0.4)] hover:border-[rgba(109,159,91,0.3)] transition-colors duration-200">
                                    <div className="leading-relaxed text-base max-h-40 overflow-y-auto">
                                        {game.summary || 'No summary available.'}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Video Section - Slightly moved down */}
                            <div className="w-full mt-8">
                                <h3 className="text-primary-400 text-lg font-bold mb-3 border-b-2 border-primary-600/30 pb-2">
                                    Trailer
                                </h3>
                                <div className="rounded-lg overflow-hidden shadow-lg">
                                    <div className="relative pt-[56.25%] h-0">
                                        {isLoading ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-[#374151]">
                                                <div className="animate-pulse flex space-x-2">
                                                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                                                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                                                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                                                </div>
                                            </div>
                                        ) : hasVideo ? (
                                            <MovieClip videoId={game.videoId} />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-[#374151] text-tonal-400">
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

    // Use React portal to render modal outside component tree, directly attached to document.body
    return createPortal(modalContent, document.body);
}
