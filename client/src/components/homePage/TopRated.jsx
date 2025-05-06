import React, { useEffect, useState } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { useGameContext } from '../../utils/GameContext';

export default function TopRated() {
  const { topGames, isLoading, respawnCount } = useGameContext();
  const [displayGames, setDisplayGames] = useState([]);
  
  // Force component re-render when respawnCount changes
  useEffect(() => {
    // This should refresh even if the games array is the same by creating a new array reference
    const allTopGames = [...topGames.primary, ...topGames.secondary];
    
    // Create new game objects to ensure reference changes
    const refreshedGames = allTopGames.map(game => ({
      ...game,
      _respawnId: respawnCount, // Add respawn ID to force React to see the object as new
      ratingCount: game.rating_count || game.ratingCount || 0 // Map rating_count to ratingCount for UI compatibility
    }));
    
    setDisplayGames(refreshedGames);
    
    // Cleanup function to check unmounting
    return () => {
    };
  }, [topGames, respawnCount]);
  
  if (isLoading && displayGames.length === 0) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">Top Rated</h2>
        </div>
        <div className="text-center py-8">Loading top rated games...</div>
      </section>
    );
  }
  
  if (displayGames.length === 0) {
    return null;
  }

  return (
    <section className="w-full mb-12" key={`top-rated-section-${respawnCount}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Top Rated</h2>
      </div>
      
      {/* Force re-render with a new component instance by using a unique key */}
      <ScrollableGameCards 
        games={displayGames} 
        type="top-rated" 
        key={`top-rated-${respawnCount}`} 
      />
    </section>
  );
} 