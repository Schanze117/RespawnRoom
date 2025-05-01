import React, { useEffect, useState } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { useGameContext } from '../../utils/GameContext';

export default function LatestReleases() {
  const { latestGames, isLoading, respawnCount } = useGameContext();
  const [displayGames, setDisplayGames] = useState([]);
  
  // Force component re-render when respawnCount changes
  useEffect(() => {
    console.log(`[LatestReleases] Respawn count changed to ${respawnCount}`);
    console.log(`[LatestReleases] Current latest games:`, latestGames);
    
    // This should refresh even if the games array is the same by creating a new array reference
    const allLatestGames = [...latestGames.primary, ...latestGames.secondary];
    
    // Create new game objects to ensure reference changes
    const refreshedGames = allLatestGames.map(game => ({
      ...game,
      _respawnId: respawnCount, // Add respawn ID to force React to see the object as new
      ratingCount: game.rating_count || game.ratingCount || 0 // Map rating_count to ratingCount for UI compatibility
    }));
    
    setDisplayGames(refreshedGames);
    
    // Debug log
    console.log(`[LatestReleases] Updated with ${refreshedGames.length} games after respawn, first game:`, 
      refreshedGames.length > 0 ? refreshedGames[0] : 'No games available');
  }, [latestGames, respawnCount]);
  
  if (isLoading && displayGames.length === 0) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">Latest Releases</h2>
        </div>
        <div className="text-center py-8">Loading latest releases...</div>
      </section>
    );
  }
  
  if (displayGames.length === 0) {
    return null;
  }

  return (
    <section className="w-full mb-12" key={`latest-section-${respawnCount}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Latest Releases</h2>
        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          See All Latest
        </button>
      </div>
      
      {/* Force re-render with a new component instance by using a unique key */}
      <ScrollableGameCards 
        games={displayGames} 
        type="latest" 
        key={`latest-${respawnCount}`} 
      />
    </section>
  );
} 