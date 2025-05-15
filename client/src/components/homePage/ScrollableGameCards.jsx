import React, { useState, useRef, useEffect } from 'react';
import NoImage from '../../assets/noImage.jpg';
import GameModal from '../card/gameModal';
import { LuSave, LuCheck, LuChevronDown, LuChevronUp } from 'react-icons/lu';
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
  
  /* Remove any mobile scroll indicator dots */
  .snap-x {
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Hide scrollbar indicators on all browsers */
  * {
    scrollbar-width: none; /* Firefox */
  }
  *::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
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
  
  .game-card {
    display: flex;
    flex-direction: column;
    height: 320px;
    width: 250px;
    transition: all 0.3s ease;
    position: relative;
  }
  
  @media (min-width: 640px) {
    .game-card {
      width: 280px;
    }
  }
  
  .game-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  .game-image {
    height: 150px;
    overflow: hidden;
    position: relative;
  }
  
  @media (min-width: 640px) {
    .game-image {
      height: 160px;
    }
  }
  
  .game-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 10px;
  }
  
  .rating-container {
    margin-top: 4px;
    margin-bottom: 8px;
  }
`;

export default function ScrollableGameCards({ games, type, onToggleExpand, fixedHeight }) {
  const scrollContainerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [expandedTitles, setExpandedTitles] = useState({});
  const [expandedContent, setExpandedContent] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [savedGames, setSavedGames] = useState({});
  const [alreadySavedGames, setAlreadySavedGames] = useState([]);
  const [saveGameMutation] = useMutation(SAVE_GAME);
  const [visibleSet, setVisibleSet] = useState(0); // Track which set of games is visible
  
  // Card dimensions - only used for scroll calculations - MOVED HERE BEFORE USEEFFECTS
  const cardWidth = 280;
  const gap = 16; // Gap between cards (4 in Tailwind = 16px)
  const scrollAmount = cardWidth + gap;
  
  // For infinite scrolling, we still need duplicate sets behind the scenes
  // But we'll only show one set visually
  const baseSets = 3; // Number of sets for technical scrolling (hidden from user)
  
  // Create single-instance looping array
  const prepareGames = () => {
    if (!games || games.length === 0) return [];
    return [...games];
  };
  
  // Generate the games array - only single instance for visual display
  const displayGames = prepareGames();
  
  // Add CSS styles to the document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = cssStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Fetch user's saved games
  const { loading, data } = useQuery(GET_ME, {
    skip: !Auth.loggedIn(), // Skip query if not logged in
  });
  
  // Initialize the scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && games.length > 0) {
      // Always start at the beginning
      container.style.scrollBehavior = 'auto';
      container.scrollLeft = 0;
      setVisibleSet(0);
    }
  }, [games.length]);
  
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

  // Toggle title expansion
  const toggleTitleExpansion = (gameId, index) => {
    const key = `${gameId}-${index}`;
    setExpandedTitles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    // If there's an external handler, call it as well
    if (onToggleExpand) {
      onToggleExpand(gameId);
    }
  };
  
  // Toggle content expansion (for game description)
  const toggleContentExpansion = (gameId, index) => {
    const key = `${gameId}-${index}`;
    setExpandedContent(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Process image URL to get the best quality version
  const getOptimizedImageUrl = (url) => {
    if (!url) return NoImage;
    
    // Handle both direct URLs and URLs with size parameters
    if (url.includes('t_thumb') || url.includes('t_cover_small')) {
      return url.replace('t_thumb', 't_720p')
                .replace('t_cover_small', 't_720p');
    }
    
    return url;
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current && !isScrolling && displayGames.length > 0) {
      setIsScrolling(true);
      
      // Determine if we're at the start
      if (visibleSet === 0) {
        // Since we're not duplicating items, simply animate to the end
        setVisibleSet(displayGames.length - 1);
        
        // Calculate scroll position for last item
        const newScrollPosition = (displayGames.length - 1) * scrollAmount;
        scrollContainerRef.current.style.scrollBehavior = 'smooth';
        scrollContainerRef.current.scrollLeft = newScrollPosition;
      } else {
        // Scroll one item left
        setVisibleSet(prev => prev - 1);
        scrollContainerRef.current.style.scrollBehavior = 'smooth';
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
      
      setTimeout(() => setIsScrolling(false), 500);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current && !isScrolling && displayGames.length > 0) {
      setIsScrolling(true);
      
      // Determine if we're at the end
      if (visibleSet >= displayGames.length - 1) {
        // Since we're not duplicating items, simply animate to the start
        setVisibleSet(0);
        
        // Scroll to the beginning
        scrollContainerRef.current.style.scrollBehavior = 'smooth';
        scrollContainerRef.current.scrollLeft = 0;
      } else {
        // Scroll one item right
        setVisibleSet(prev => prev + 1);
        scrollContainerRef.current.style.scrollBehavior = 'smooth';
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      
      setTimeout(() => setIsScrolling(false), 500);
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
    event.stopPropagation();
    
    try {
      if (!Auth.loggedIn()) {
        return;
      }
      
      // Check if game is already saved (this will apply to all duplicate instances in the carousel)
      if (isGameAlreadySaved(game)) {
        setSavedGames(prev => ({
          ...prev,
          [game.id]: 'already-saved'
        }));
        
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

      setSavedGames(prev => ({
        ...prev,
        [game.id]: 'saving'
      }));

      const { data } = await saveGameMutation({
        variables: { game: gameInput },
      });

      setAlreadySavedGames(prev => [...prev, game.name.toLowerCase().trim()]);
      
      setSavedGames(prev => ({
        ...prev,
        [game.id]: 'saved'
      }));
      
      setTimeout(() => {
        setSavedGames(prev => {
          const newState = {...prev};
          delete newState[game.id];
          return newState;
        });
      }, 2000);
    } catch (error) {
      setSavedGames(prev => ({
        ...prev,
        [game.id]: 'error'
      }));
      
      setTimeout(() => {
        setSavedGames(prev => {
          const newState = {...prev};
          delete newState[game.id];
          return newState;
        });
      }, 2000);
    }
  };

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

  return (
    <div className="relative">
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 flex-col items-start hidden sm:flex">
        <button 
          onClick={scrollLeft}
          disabled={isScrolling}
          className="bg-surface-800/80 h-10 w-10 flex items-center justify-center rounded-full shadow-lg hover:bg-primary-600/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50"
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-tonal-300">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      {/* Main scrollable area - now with visibility tracking */}
      <div 
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}
      >
        {displayGames.map((game, index) => {
          const key = `${game.id}-${index}`;
          const isTitleExpanded = expandedTitles[key] || false;
          const isContentExpanded = expandedContent[key] || false;
          const saveState = getSaveButtonState(game.id, game);
          
          return (
            <div 
              key={key} 
              className="game-card flex-shrink-0 snap-start bg-surface-800 rounded-lg overflow-hidden border border-surface-700 hover:border-primary-600 transition-colors duration-300"
            >
              {/* Save Button */}
              {Auth.loggedIn() && (
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
              )}

              {/* Game Image */}
              <div className="game-image bg-surface-900 relative">
                <div className="w-full h-full relative">
                  {/* Blurred background for better image presentation */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${game.cover ? getOptimizedImageUrl(game.cover.url) : NoImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'blur(10px) brightness(0.7)',
                      transform: 'scale(1.1)',
                    }}
                  />
                  
                  {/* Actual image centered */}
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    {game.cover ? (
                      <img 
                        src={getOptimizedImageUrl(game.cover.url)} 
                        alt={game.name} 
                        className="h-full max-w-full object-contain z-10 drop-shadow-md"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full z-10">
                        <img 
                          src={NoImage} 
                          alt="No image available"
                          className="w-3/4 h-3/4 object-contain opacity-80"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Game Content */}
              <div className="game-content bg-surface-800 p-3 flex flex-col">
                {/* Game Title with expand/collapse option */}
                <div className="mb-1">
                  <div className="flex items-start justify-between gap-1">
                    <h3 
                      className={`text-primary-400 font-medium text-base ${isTitleExpanded ? '' : 'line-clamp-2'}`}
                    >
                      {game.name}
                    </h3>
                    <button
                      onClick={() => toggleTitleExpansion(game.id, index)}
                      className="flex-shrink-0 text-tonal-400 hover:text-primary-400 transition-colors duration-200 p-1"
                      title={isTitleExpanded ? "Collapse title" : "Expand title"}
                    >
                      {isTitleExpanded ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
                    </button>
                  </div>
                </div>
                
                <div className="mb-0.5 text-xs">
                  {/* Rating display with improved logic */}
                  {game.rating ? (
                    <div className="text-primary-400 font-medium">
                      Rating: {Math.round(game.rating)}/100
                      {(game.ratingCount || game.rating_count) ? 
                        ` (${game.ratingCount || game.rating_count} reviews)` : 
                        ''}
                    </div>
                  ) : (
                    <div className="text-gray-500 font-medium">
                      No ratings yet
                    </div>
                  )}
                </div>
                
                {/* Game genres */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {game.genres?.slice(0, 3).map((genre, gIndex) => (
                    <span key={`${game.id}-genre-${gIndex}`} className="text-xs bg-primary-600/20 text-primary-100 px-1.5 py-0.5 rounded-md">
                      {genre.name}
                    </span>
                  ))}
                </div>
                
                {/* View Details button */}
                <div className="mt-auto pt-1">
                  <button 
                    onClick={() => handleGameClick(game)}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 px-3 rounded w-full transition duration-300"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 flex-col items-end hidden sm:flex">
        <button 
          onClick={scrollRight}
          disabled={isScrolling}
          className="bg-surface-800/80 h-10 w-10 flex items-center justify-center rounded-full shadow-lg hover:bg-primary-600/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50"
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-tonal-300">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {showModal && selectedGame && (
        <GameModal 
          game={selectedGame} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
} 