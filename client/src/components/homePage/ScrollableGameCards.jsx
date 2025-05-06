import React, { useState, useRef, useEffect } from 'react';
import NoImage from '../../assets/noImage.jpg';
import GameModal from '../card/gameModal';
import { LuSave, LuCheck } from 'react-icons/lu';
import { useMutation, useQuery } from '@apollo/client';
import { SAVE_GAME } from '../../utils/mutations';
import { GET_ME } from '../../utils/queries';
import Auth from '../../utils/auth';

// CSS styles for the component
const cssStyles = `
  .hide-scrollbar {
    -ms-overflow-style: none;  /* Internet Explorer and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera */
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-none {
    -webkit-line-clamp: unset;
  }
`;

export default function ScrollableGameCards({ games, type }) {
  const scrollContainerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [expandedTitles, setExpandedTitles] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [savedGames, setSavedGames] = useState({});
  const [alreadySavedGames, setAlreadySavedGames] = useState([]);
  const [saveGameMutation] = useMutation(SAVE_GAME);
  
  // Fetch user's saved games
  const { loading, data } = useQuery(GET_ME, {
    skip: !Auth.loggedIn(), // Skip query if not logged in
  });
  
  // Extract saved games from the query result
  useEffect(() => {
    if (data?.me?.savedGames) {
      // Create a list of names of already saved games
      const savedGameNames = data.me.savedGames.map(game => game.name.toLowerCase().trim());
      setAlreadySavedGames(savedGameNames);
    }
  }, [data]);

  // Check if a game is already saved
  const isGameAlreadySaved = (game) => {
    return alreadySavedGames.includes(game.name.toLowerCase().trim());
  };

  // Create a looping array by duplicating the games
  const loopedGames = [...games, ...games, ...games];

  // Card dimensions
  const cardWidth = 280; // Original card width
  const cardHeight = 350; // Original card height
  const imageHeight = 160; // Image height
  const gap = 16; // Gap between cards (4 in Tailwind = 16px)
  const scrollAmount = cardWidth + gap;

  // Toggle title expansion
  const toggleTitleExpansion = (gameId, index) => {
    const key = `${gameId}-${index}`;
    setExpandedTitles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle scroll navigation with more precise control
  const scrollLeft = () => {
    if (scrollContainerRef.current && !isScrolling) {
      setIsScrolling(true);
      const container = scrollContainerRef.current;
      const { scrollLeft } = container;

      // If we're near the beginning, jump to the middle set without animation
      if (scrollLeft < scrollAmount * 2) {
        container.style.scrollBehavior = 'auto';
        container.scrollLeft = scrollLeft + (games.length * scrollAmount);
        
        // Then scroll with animation
        setTimeout(() => {
          container.style.scrollBehavior = 'smooth';
          container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
          setTimeout(() => setIsScrolling(false), 500);
        }, 20);
      } else {
        // Normal scroll
        container.style.scrollBehavior = 'smooth';
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        setTimeout(() => setIsScrolling(false), 500);
      }
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current && !isScrolling) {
      setIsScrolling(true);
      const container = scrollContainerRef.current;
      const { scrollLeft, scrollWidth } = container;

      // If we're near the end, jump to the middle set without animation
      if (scrollLeft > (games.length * 2 * scrollAmount) - 100) {
        container.style.scrollBehavior = 'auto';
        container.scrollLeft = scrollLeft - (games.length * scrollAmount);
        
        // Then scroll with animation
        setTimeout(() => {
          container.style.scrollBehavior = 'smooth';
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          setTimeout(() => setIsScrolling(false), 500);
        }, 20);
      } else {
        // Normal scroll
        container.style.scrollBehavior = 'smooth';
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        setTimeout(() => setIsScrolling(false), 500);
      }
    }
  };

  // Handle game click to show modal
  const handleGameClick = (game) => {
    setSelectedGame(game);
    setShowModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGame(null);
  };

  // Handle save game functionality
  const saveGame = async (event, game) => {
    event.stopPropagation(); // Prevent the card click from triggering
    try {
      if (!Auth.loggedIn()) {
        // Instead of alert, redirect to login or show a more subtle notification
        console.log('User not logged in, cannot save game');
        // Optional: redirect to login page
        // window.location.href = '/login';
        return;
      }
      
      // Check if game is already saved
      if (isGameAlreadySaved(game)) {
        console.log('Game already saved:', game.name);
        setSavedGames(prev => ({
          ...prev,
          [game.id]: 'already-saved'
        }));
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setSavedGames(prev => {
            const newState = {...prev};
            delete newState[game.id];
            return newState;
          });
        }, 2000);
        return;
      }

      const gameInput = {
        cover: game.cover ? game.cover.url : '',
        name: game.name ? game.name : '',
        genres: game.genres ? game.genres.map((genre) => genre.name) : [],
        playerPerspectives: game.player_perspectives
          ? game.player_perspectives.map((perspective) => perspective.name)
          : [],
        summary: game.summary ? game.summary : 'No summary available.',
      };

      // Set the game as being saved (for UI feedback)
      setSavedGames(prev => ({
        ...prev,
        [game.id]: 'saving'
      }));

      const { data } = await saveGameMutation({
        variables: { game: gameInput },
      });

      console.log('Game saved to server:', data);
      
      // Add to already saved games list
      setAlreadySavedGames(prev => [...prev, game.name.toLowerCase().trim()]);
      
      // Visual feedback - mark as saved
      setSavedGames(prev => ({
        ...prev,
        [game.id]: 'saved'
      }));
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setSavedGames(prev => {
          const newState = {...prev};
          delete newState[game.id];
          return newState;
        });
      }, 2000);
    } catch (error) {
      console.error('Error saving game:', error);
      // Set the game as having an error when saving
      setSavedGames(prev => ({
        ...prev,
        [game.id]: 'error'
      }));
      
      // Reset error status after 2 seconds
      setTimeout(() => {
        setSavedGames(prev => {
          const newState = {...prev};
          delete newState[game.id];
          return newState;
        });
      }, 2000);
    }
  };

  // Get the save button state for a game
  const getSaveButtonState = (gameId, game) => {
    // First check if the game has an active save state
    if (savedGames[gameId]) {
      return savedGames[gameId];
    }
    
    // Then check if it's already in the user's saved collection
    if (isGameAlreadySaved(game)) {
      return 'already-saved';
    }
    
    // Default state
    return 'default';
  };

  // Initialize scroll position to the middle set of items
  useEffect(() => {
    if (scrollContainerRef.current && games.length > 0) {
      const container = scrollContainerRef.current;
      // Jump to the middle set without animation
      container.scrollLeft = games.length * scrollAmount;
    }
  }, [games.length]);

  // Auto-scroll animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isScrolling && document.hasFocus()) {
        scrollRight();
      }
    }, 7000); // Auto-scroll every 7 seconds
    
    return () => clearInterval(interval);
  }, [isScrolling]);

  // Add CSS styles to the document
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.innerHTML = cssStyles;
    document.head.appendChild(styleElement);
    
    // Clean up
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Process image URL to get the best quality version
  const getOptimizedImageUrl = (url) => {
    if (!url) return NoImage;
    
    // IGDB images use t_thumb, t_cover_small, t_cover_big, etc.
    // Replace with t_cover_big for better quality
    return url.replace('t_thumb', 't_cover_big')
              .replace('t_cover_small', 't_cover_big');
  };

  return (
    <div className="relative group">
      {/* Navigation buttons - always visible on hover */}
      <button 
        onClick={scrollLeft} 
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-r focus:outline-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        aria-label="Scroll left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        onClick={scrollRight} 
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-l focus:outline-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        aria-label="Scroll right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Scrollable game cards container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 pt-2 snap-x snap-mandatory"
        onMouseEnter={() => setIsScrolling(true)}
        onMouseLeave={() => setIsScrolling(false)}
        style={{ scrollbarWidth: 'none' }} /* Firefox */
      >
        {loopedGames.map((game, index) => {
          const cardKey = `${game.id}-${index}`;
          const isExpanded = expandedTitles[cardKey] || false;
          const saveState = getSaveButtonState(game.id, game);
          
          return (
            <div 
              key={cardKey} 
              style={{ 
                width: `${cardWidth}px`, 
                height: `${cardHeight}px`,
                minWidth: `${cardWidth}px`, 
                maxWidth: `${cardWidth}px` 
              }}
              className="flex-shrink-0 flex-grow-0 snap-start bg-surface-800 rounded-lg overflow-hidden border border-surface-700 hover:border-primary-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex flex-col relative"
            >
              {/* Save Button - with different states */}
              <button
                type="button"
                onClick={(e) => saveGame(e, game)}
                disabled={saveState === 'saving' || saveState === 'saved' || saveState === 'already-saved'}
                className={`absolute top-2 right-2 p-1.5 z-10 text-white rounded-full shadow-md transition-all duration-300 ${
                  saveState === 'default' ? 'bg-primary-600 hover:bg-primary-700' :
                  saveState === 'saving' ? 'bg-amber-500 cursor-wait' : 
                  saveState === 'saved' ? 'bg-green-600' :
                  saveState === 'already-saved' ? 'bg-green-600 opacity-75' :
                  'bg-red-600'
                }`}
                title={
                  saveState === 'default' ? 'Save Game' :
                  saveState === 'saving' ? 'Saving...' : 
                  saveState === 'saved' ? 'Saved!' :
                  saveState === 'already-saved' ? 'Already Saved' :
                  'Error saving'
                }
              >
                {saveState === 'saved' || saveState === 'already-saved' ? <LuCheck className="text-sm" /> : <LuSave className="text-sm" />}
              </button>

              <div 
                style={{ height: `${imageHeight}px` }} 
                className="bg-surface-900 flex items-center justify-center relative overflow-hidden"
              >
                {game.cover ? (
                  <div className="w-full h-full relative flex items-center justify-center">
                    {/* Background blur fill using the same image */}
                    <div 
                      className="absolute inset-0 z-0 bg-center bg-no-repeat bg-cover blur-sm opacity-40 scale-110"
                      style={{ 
                        backgroundImage: `url(${getOptimizedImageUrl(game.cover.url)})`,
                        backgroundPosition: 'center center'
                      }}
                    ></div>
                    
                    {/* Focused clear image on top */}
                    <div className="absolute inset-0 bg-surface-900/30 z-1"></div>
                    <img 
                      src={getOptimizedImageUrl(game.cover.url)}
                      alt={game.name} 
                      className="h-full object-contain z-2 relative"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-800/80 z-3"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    <div className="text-2xl text-primary-400 opacity-30">Game Cover</div>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex flex-col flex-grow">
                {/* Interactive title that expands on click */}
                <div className="relative">
                  <h3 
                    onClick={() => toggleTitleExpansion(game.id, index)}
                    className={`text-xl font-semibold text-light mb-2 cursor-pointer hover:text-primary-400 transition-all duration-200 ${isExpanded ? 'line-clamp-none' : 'line-clamp-2'}`}
                    title={game.name}
                  >
                    {game.name}
                  </h3>
                  
                  {/* Expand/collapse indicator */}
                  {game.name && game.name.length > 40 && (
                    <button 
                      onClick={() => toggleTitleExpansion(game.id, index)}
                      className="absolute right-0 top-0 text-xs text-primary-400 hover:text-primary-300"
                    >
                      {isExpanded ? 'Less' : 'More'}
                    </button>
                  )}
                </div>
                
                {/* Rating and review information for all games */}
                {game.rating && (game.ratingCount || game.rating_count) && type !== 'recommended' && (
                  <div className="text-xs text-primary-400 font-medium mb-2">
                    Rating: {Math.round(game.rating)}/100 ({game.ratingCount || game.rating_count} reviews)
                  </div>
                )}
                
                {/* Match score for recommended games */}
                {type === 'recommended' && game.matchScore && (
                  <div className="text-xs text-green-500 font-medium mb-2">
                    {game.rating 
                      ? `Rating: ${Math.round(game.rating)}/100 (${game.ratingCount || game.rating_count} reviews)` 
                      : "Highly Recommended"}
                  </div>
                )}
                
                {/* Release date for latest games */}
                {type === 'latest' && game.releaseDate && (
                  <div className="text-xs text-primary-500 font-medium mb-2">
                    Released: {game.releaseDate}
                  </div>
                )}
                
                {/* Release date for upcoming games */}
                {type === 'upcoming' && game.releaseDate && (
                  <div className="text-xs text-blue-500 font-medium mb-2">
                    Expected: {game.releaseDate}
                  </div>
                )}
                
                {/* Game genres */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {game.genres?.slice(0, 4).map((genre, gIndex) => (
                    <span key={`${game.id}-genre-${gIndex}`} className="text-xs bg-primary-600/40 text-primary-100 px-1.5 py-0.5 rounded-md border border-primary-600/20">
                      {genre.name}
                    </span>
                  ))}
                </div>
                
                {/* View Details button */}
                <div className="mt-auto pt-2 flex justify-end">
                  <button 
                    onClick={() => handleGameClick(game)}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-sm py-1 px-3 rounded transition duration-300"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Game Modal */}
      {showModal && <GameModal game={selectedGame} onClose={handleCloseModal} />}
    </div>
  );
} 