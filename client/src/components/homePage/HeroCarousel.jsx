import React, { useState, useEffect } from 'react';
import { getFeaturedGame } from '../../utils/gameFetcher';
import NoImage from '../../assets/noImage.jpg';

// The specific game ID we want to feature
const FEATURED_GAME_ID = 238532;

export default function HeroCarousel() {
  const [featuredGame, setFeaturedGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default featured game as fallback
  const defaultGame = {
    name: "Baldur's Gate 3",
    summary: "Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power.",
  };

  useEffect(() => {
    const loadFeaturedGame = async () => {
      try {
        setIsLoading(true);
        const game = await getFeaturedGame();
        if (game) {
          setFeaturedGame(game);
        } else {
          setFeaturedGame(defaultGame);
        }
      } catch (err) {
        console.error('Error loading featured game:', err);
        setError('Failed to load featured game');
        setFeaturedGame(defaultGame);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedGame();
  }, []);

  // Process image URL to get optimal size
  const getOptimizedImageUrl = (url) => {
    if (!url) return NoImage;
    return url.replace('t_thumb', 't_1080p').replace('t_cover_small', 't_1080p');
  };

  // Get the game to display (either loaded or default)
  const displayGame = featuredGame || defaultGame;
  
  // Get cover image (if available)
  const coverImage = featuredGame?.cover?.url 
    ? getOptimizedImageUrl(featuredGame.cover.url)
    : null;
    
  // Get a backdrop image (from screenshots or artworks if available)
  const hasScreenshots = featuredGame?.screenshots && featuredGame.screenshots.length > 0;
  const hasArtworks = featuredGame?.artworks && featuredGame.artworks.length > 0;
  
  let backdropImage = null;
  if (hasScreenshots) {
    backdropImage = getOptimizedImageUrl(featuredGame.screenshots[0].url);
  } else if (hasArtworks) {
    backdropImage = getOptimizedImageUrl(featuredGame.artworks[0].url);
  } else if (coverImage) {
    backdropImage = coverImage;
  }

  return (
    <section className="w-full mb-12">
      <h2 className="text-2xl font-bold text-primary-500 mb-4">Featured Game</h2>
      <div className="relative overflow-hidden rounded-lg h-80 bg-surface-800 border border-surface-600">
        {/* Backdrop Image */}
        {backdropImage && (
          <div 
            className="absolute inset-0 bg-center bg-cover opacity-20"
            style={{ backgroundImage: `url(${backdropImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-surface-900 via-surface-900/90 to-surface-900/70"></div>
          </div>
        )}
        
        {isLoading ? (
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
                    <h3 className="text-3xl font-bold text-light mb-2">{displayGame.name}</h3>
                    <p className="text-tonal-400 mb-4 line-clamp-3">
                      {displayGame.summary}
                    </p>
                    <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 w-fit">
                      View Details
                    </button>
                  </div>
                  <div className="md:w-1/2 rounded-lg overflow-hidden flex items-center justify-center p-4">
                    {coverImage ? (
                      <img 
                        src={coverImage} 
                        alt={displayGame.name} 
                        className="h-full max-h-64 object-contain rounded-lg shadow-lg"
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
    </section>
  );
} 