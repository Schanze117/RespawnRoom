import React, { useEffect, useState } from 'react';
import { useGameContext } from '../../utils/GameContext';
import NoImage from '../../assets/noImage.jpg';
import GameModal from '../card/gameModal';

// The specific game ID we want to feature
const FEATURED_GAME_ID = 2903;

// Hero carousel skeleton
const HeroSkeleton = () => (
  <div className="w-full h-72 md:h-96 relative animate-pulse">
    <div className="w-full h-full bg-surface-800"></div>
    <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-center p-6">
      <div className="md:w-1/2 mb-6 md:mb-0 flex justify-center">
        <div className="w-48 h-72 bg-surface-700 rounded-lg"></div>
      </div>
      <div className="md:w-1/2 space-y-4">
        <div className="h-8 bg-surface-700 rounded w-3/4"></div>
        <div className="h-4 bg-surface-700 rounded w-1/2"></div>
        <div className="flex flex-wrap gap-2 mb-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 w-16 bg-surface-700 rounded-md"></div>
          ))}
        </div>
        <div className="h-24 bg-surface-700 rounded"></div>
        <div className="h-10 w-32 bg-surface-700 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export default function HeroCarousel() {
  const { featuredGame, isLoading, respawnCount } = useGameContext();
  const [displayGame, setDisplayGame] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [backdropImage, setBackdropImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Process image URL to get optimal size
  const getOptimizedImageUrl = (url) => {
    if (!url) return NoImage;
    
    // Handle both direct URLs and URLs with size parameters
    if (url.includes('t_thumb') || url.includes('t_cover_small') || url.includes('t_729p')) {
      return url.replace('t_thumb', 't_1080p')
                .replace('t_cover_small', 't_1080p')
                .replace('t_729p', 't_1080p');
    }
    
    // If it's a direct image ID, construct the full URL
    if (url.startsWith('co') || url.startsWith('tm')) {
      return `https://images.igdb.com/igdb/image/upload/t_720p/${url}`;
    }
    
    return url;
  };

  // Force re-render when respawnCount changes
  useEffect(() => {
    if (!featuredGame) {
      setDisplayGame(null);
      setCoverImage(null);
      setBackdropImage(null);
      return;
    }

    // Get the game to display
    const gameToDisplay = { 
      ...featuredGame,
      _respawnId: respawnCount // Add respawn ID to force a reference change
    };
    
    setDisplayGame(gameToDisplay);
    
    // Get cover image (if available)
    const newCoverImage = featuredGame?.cover?.url 
      ? getOptimizedImageUrl(featuredGame.cover.url)
      : null;
    setCoverImage(newCoverImage);
      
    // Get a backdrop image (from screenshots or artworks if available)
    const hasScreenshots = featuredGame?.screenshots && featuredGame.screenshots.length > 0;
    const hasArtworks = featuredGame?.artworks && featuredGame.artworks.length > 0;
    
    let newBackdropImage = null;
    if (hasScreenshots) {
      newBackdropImage = getOptimizedImageUrl(featuredGame.screenshots[0].url);
    } else if (hasArtworks) {
      newBackdropImage = getOptimizedImageUrl(featuredGame.artworks[0].url);
    } else if (newCoverImage) {
      newBackdropImage = newCoverImage;
    }
    
    setBackdropImage(newBackdropImage);
  }, [featuredGame, respawnCount]);

  const handleViewDetails = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <section className="relative w-full mb-8">
      {isLoading ? (
        <HeroSkeleton />
      ) : displayGame ? (
        <div className="w-full relative">
          <div className="absolute inset-0 z-0">
            {backdropImage && (
              <div className="w-full h-full relative">
                {/* Backdrop image - kept fully opaque */}
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${backdropImage})`,
                    opacity: "1" 
                  }}
                ></div>
                {/* Uniform overlay for consistent dimming */}
                <div className="absolute inset-0 w-full h-full bg-surface-900/60"></div> {/* Adjusted to 60% opacity */}
              </div>
            )}
          </div>

          <div className="relative z-10">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                {/* Cover image */}
                <div className="md:w-1/2 mb-6 md:mb-0 flex justify-center">
                  <div className="relative w-64 h-96 overflow-hidden rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-300">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={displayGame.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-800">
                        <img
                          src={NoImage}
                          alt="No image available"
                          className="w-2/3 h-2/3 object-contain opacity-70"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-transparent to-transparent opacity-60"></div>
                  </div>
                </div>

                {/* Game information */}
                <div className="md:w-1/2 p-6 flex flex-col justify-center">
                  <h3 className="text-4xl font-extrabold text-light mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] tracking-tight">
                    {displayGame?.name}
                  </h3>
                  
                  {/* Add rating display if available */}
                  {displayGame?.rating && (
                    <div className="text-sm text-primary-400 font-bold mb-3 drop-shadow-md">
                      <span className="font-bold">Rating: </span>
                      <span className="font-bold">{Math.round(displayGame.rating)}/100
                      {displayGame.rating_count && ` (${displayGame.rating_count} reviews)`}</span>
                    </div>
                  )}
                  
                  {/* Game genres */}
                  {displayGame?.genres && displayGame.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {displayGame.genres.slice(0, 4).map((genre, index) => (
                        <span 
                          key={index} 
                          className="text-xs bg-primary-600/30 text-primary-400 px-2 py-1 rounded-md font-medium"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-light text-opacity-90 mb-5 line-clamp-3 text-shadow font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    {displayGame?.summary}
                  </p>
                  
                  <button 
                    onClick={handleViewDetails}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 w-fit shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <span>View Details</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-72 md:h-96 bg-surface-800 flex items-center justify-center">
          <p className="text-light text-xl">No featured game available</p>
        </div>
      )}

      {/* Game Modal */}
      {showModal && displayGame && (
        <GameModal
          game={displayGame}
          onClose={handleCloseModal}
          location="featured"
        />
      )}
    </section>
  );
} 