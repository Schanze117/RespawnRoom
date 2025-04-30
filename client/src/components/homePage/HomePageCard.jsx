import React from 'react';
import NoImage from '../../assets/noImage.jpg';

export default function HomePageCard({ games, type }) {
  // Determine the appropriate grid classes based on the type
  const getGridClasses = () => {
    if (type === 'editors-pick') {
      return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4";
    }
    return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4";
  };

  return (
    <div className={getGridClasses()}>
      {games.map((game) => (
        <div key={game.id} className="bg-surface-800 rounded-lg overflow-hidden border border-surface-700 hover:border-primary-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
          <div className="h-40 bg-surface-700 flex items-center justify-center relative">
            {game.cover ? (
              <img src={game.cover.url || NoImage} alt={game.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-2xl text-primary-400 opacity-30">Game Cover</div>
            )}
            
            {/* Display type-specific badges */}
            {type === 'trending' && (
              <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded">
                Trending
              </div>
            )}
            {type === 'latest' && (
              <div className="absolute top-2 right-2 bg-primary-900 text-primary-300 text-xs font-bold px-2 py-1 rounded-full">
                New
              </div>
            )}
            {type === 'upcoming' && (
              <div className="absolute top-2 right-2 bg-surface-900 text-primary-300 text-xs font-bold px-2 py-1 rounded-full">
                Coming Soon
              </div>
            )}
            {type === 'top-rated' && (
              <div className="absolute top-2 right-2 bg-surface-900 text-light font-bold w-10 h-10 rounded-full flex items-center justify-center">
                9.5
              </div>
            )}
            {type === 'editors-pick' && (
              <div className="absolute top-2 right-2 bg-primary-700 text-white text-xs px-2 py-1 rounded">
                Editor's Pick
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-semibold text-light mb-1">{game.name}</h3>
            <p className="text-sm text-tonal-400 mb-3">
              {game.genres ? game.genres.map(g => g.name).join(', ') : 'N/A'}
            </p>
            
            {/* Display type-specific content */}
            <div className="flex justify-between items-center">
              {type === 'recommended' && (
                <>
                  <span className="text-xs px-2 py-1 bg-surface-700 rounded-full text-tonal-300">95% Match</span>
                  <button className="text-primary-500 hover:text-primary-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                </>
              )}
              
              {type === 'trending' && (
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  <span className="text-xs text-primary-500">Trending Up</span>
                </div>
              )}
              
              {type === 'latest' && (
                <>
                  <span className="text-xs text-tonal-300">Released: Feb 2024</span>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 px-2 rounded transition duration-300">
                    Details
                  </button>
                </>
              )}
              
              {type === 'upcoming' && (
                <>
                  <span className="text-xs text-tonal-300">Coming: Q2 2024</span>
                  <button className="border border-primary-600 hover:bg-primary-600 text-primary-400 hover:text-white text-xs py-1 px-2 rounded transition duration-300">
                    Wishlist
                  </button>
                </>
              )}
              
              {type === 'top-rated' && (
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i < 4 ? 'text-yellow-400' : 'text-surface-600'}`} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-tonal-300 ml-2">9.5/10</span>
                </div>
              )}
              
              {type === 'editors-pick' && (
                <>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    <span className="text-xs text-primary-400">Must-Play</span>
                  </div>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 px-2 rounded transition duration-300">
                    Details
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 