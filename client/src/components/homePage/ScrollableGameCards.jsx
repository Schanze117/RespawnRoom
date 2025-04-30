import React, { useState, useRef, useEffect } from 'react';
import NoImage from '../../assets/noImage.jpg';

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

  // Create a looping array by duplicating the games
  const loopedGames = [...games, ...games, ...games];

  // Card dimensions
  const cardWidth = 280; // Increased card width
  const cardHeight = 350; // Increased card height
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
          
          return (
            <div 
              key={cardKey} 
              style={{ 
                width: `${cardWidth}px`, 
                height: `${cardHeight}px`,
                minWidth: `${cardWidth}px`, 
                maxWidth: `${cardWidth}px` 
              }}
              className="flex-shrink-0 flex-grow-0 snap-start bg-surface-800 rounded-lg overflow-hidden border border-surface-700 hover:border-primary-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
            >
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
                
                {/* Add type-specific badges and info */}
                {type === 'trending' && (
                  <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    Trending
                  </div>
                )}
                {type === 'latest' && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    New
                  </div>
                )}
                {type === 'top-rated' && (
                  <div className="absolute top-2 right-2 bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    90+
                  </div>
                )}
                {type === 'upcoming' && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    Coming Soon
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
                  {game.genres?.map((genre, gIndex) => (
                    <span key={`${game.id}-genre-${gIndex}`} className="text-xs bg-surface-700 text-light-200 px-2 py-0.5 rounded-md">
                      {genre.name}
                    </span>
                  ))}
                </div>
                
                {/* Rating count for top-rated games */}
                {type === 'top-rated' && game.ratingCount && game.rating && (
                  <div className="text-xs text-yellow-500 font-medium mb-2">
                    Rating: {Math.round(game.rating)}/100 ({game.ratingCount} reviews)
                  </div>
                )}
                
                {/* Game summary */}
                <p className="text-sm text-light-300 line-clamp-3 mb-auto">
                  {game.summary || 'No description available'}
                </p>
                
                {/* Rating indicator if available */}
                {game.rating && (
                  <div className="mt-3 flex items-center">
                    <div 
                      className={`text-sm font-bold px-2 py-0.5 rounded ${
                        game.rating >= 85 ? 'bg-green-900 text-green-200' :
                        game.rating >= 70 ? 'bg-blue-900 text-blue-200' :
                        game.rating >= 50 ? 'bg-yellow-900 text-yellow-200' :
                        'bg-red-900 text-red-200'
                      }`}
                    >
                      {Math.round(game.rating)}
                    </div>
                    <span className="ml-2 text-xs text-light-400">
                      {type === 'latest' && game.ratingCount ? `${game.ratingCount} reviews` : 'User Score'}
                    </span>
                  </div>
                )}
                
                {/* Add to List button */}
                <button className="mt-3 w-full rounded-md bg-primary-600 hover:bg-primary-700 text-white py-1.5 text-sm font-medium transition-colors duration-200">
                  Add to List
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 