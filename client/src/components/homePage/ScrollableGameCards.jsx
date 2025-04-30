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
                
                {type === 'trending' && (
                  <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    Trending
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
                      className="absolute -right-2 top-1 text-primary-500 hover:text-primary-400 transition-colors duration-200"
                      aria-label={isExpanded ? "Collapse title" : "Expand title"}
                    >
                      {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                
                <p className="text-sm text-tonal-400 mb-3 truncate" title={game.genres ? game.genres.map(g => g.name).join(', ') : 'N/A'}>
                  {game.genres ? game.genres.map(g => g.name).join(', ') : 'N/A'}
                </p>
                
                <p className={`text-sm text-tonal-300 mb-4 line-clamp-3 ${isExpanded ? 'line-clamp-2' : 'line-clamp-3'}`}>
                  {game.summary || "A trending game that's capturing players' attention with its innovative gameplay and immersive world."}
                </p>
                
                {type === 'trending' && (
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center space-x-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                      <span className="text-xs text-primary-500">Trending</span>
                    </div>
                    
                    <button className="text-sm bg-primary-600 hover:bg-primary-700 text-white py-1.5 px-3 rounded transition duration-300">
                      Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 