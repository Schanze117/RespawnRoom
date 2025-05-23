import React, { useEffect, useState } from 'react';
import { useGameContext } from '../../utils/GameContext';
import NoImage from '../../assets/noImage.jpg';
import GameModal from '../card/gameModal';

// The specific game ID we want to feature
const FEATURED_GAME_ID = 2903;

export default function HeroCarousel() {
  const { featuredGame, isLoading, respawnCount } = useGameContext();
  const [displayGame, setDisplayGame] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [backdropImage, setBackdropImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Default featured game as fallback
  const defaultGame = {
    name: "Warframe",
    summary: "Warframe situates players as members of the Tenno race, newly awoken after years of cryo-sleep into a solar system at war. Reborn into a corrupt era, the Tenno are sought by the oppressive Grineer Empire for annihilation. Warframe armor is the key to overthrowing the Grineer by providing players with unique offensive and defensive powers to explore, upgrade and master during purpose-driven radical raids.",
  };

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
      return `https://images.igdb.com/igdb/image/upload/t_1080p/${url}`;
    }
    
    return url;
  };

  // Force re-render when respawnCount changes
  useEffect(() => {
    
    // Get the game to display (either loaded or default)
    const gameToDisplay = featuredGame ? { 
      ...featuredGame,
      _respawnId: respawnCount // Add respawn ID to force a reference change
    } : defaultGame;
    
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
    
    // Debug log
  }, [featuredGame, respawnCount]);

  const handleViewDetails = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <section className="w-full mb-12">
      <h2 className="text-2xl font-bold text-primary-500 mb-4">Featured Game</h2>
      <div 
        className="relative overflow-hidden rounded-lg h-80 bg-surface-800 border border-surface-600" 
        key={`hero-${respawnCount}`}
      >
        {/* Backdrop img */}
        {backdropImage && (
          <div 
            className="absolute inset-0 bg-center bg-cover opacity-20"
            style={{ backgroundImage: `url(${backdropImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-surface-900 via-surface-900/90 to-surface-900/70"></div>
          </div>
        )}
        
        {isLoading && !featuredGame ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse text-primary-400">Loading featured game...</div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-5xl px-4">
              <div className="relative overflow-hidden rounded-lg">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-1/2 p-6 flex flex-col justify-center">
                    <span className="text-primary-400 text-sm font-semibold mb-1">Featured Game</span>
                    <h3 className="text-3xl font-bold text-light mb-2">{displayGame?.name}</h3>
                    
                    {/* Add rating display if available */}
                    {displayGame?.rating && (
                      <div className="text-sm text-primary-400 font-medium mb-2">
                        Rating: {Math.round(displayGame.rating)}/100
                        {displayGame.rating_count && ` (${displayGame.rating_count} reviews)`}
                      </div>
                    )}
                    
                    <p className="text-tonal-400 mb-4 line-clamp-3">
                      {displayGame?.summary}
                    </p>
                    <button 
                      onClick={handleViewDetails}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 w-fit"
                    >
                      View Details
                    </button>
                  </div>
                  <div className="md:w-1/2 rounded-lg overflow-hidden flex items-center justify-center p-4">
                    {coverImage ? (
                      <img 
                        src={coverImage} 
                        alt={displayGame?.name} 
                        className="h-full max-h-64 object-contain rounded-lg shadow-lg"
                        onError={(e) => {
                          e.target.src = NoImage;
                        }}
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-r from-surface-800 to-surface-700 flex items-center justify-center">
                        <div className="text-6xl text-primary-400 opacity-30">Game Cover</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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