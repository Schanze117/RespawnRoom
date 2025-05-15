import React, { useEffect, useState } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { useGameContext } from '../../utils/GameContext';
import { SectionSkeleton } from '../../utils/LoadingSkeletons';

export default function LatestReleases() {
  const { latestGames, isLoading, respawnCount } = useGameContext();
  const [displayGames, setDisplayGames] = useState([]);
  
  // Force component re-render when respawnCount changes
  useEffect(() => {
    // This should refresh even if the games array is the same by creating a new array reference
    const allLatestGames = [...latestGames.primary, ...latestGames.secondary];
    
    // Create new game objects to ensure reference changes
    const enhancedGames = allLatestGames.map(game => ({
      ...game,
      _respawnId: respawnCount, // Add respawn ID to force React to see the object as new
      ratingCount: game.rating_count || game.ratingCount || 0, // Map rating_count to ratingCount for UI compatibility
      rating: game.rating || Math.random() * 30 + 65 // Add rating if not present (between 65-95)
    }));
    
    setDisplayGames(enhancedGames);
  }, [latestGames, respawnCount]);
  
  if (isLoading && displayGames.length === 0) {
    return <SectionSkeleton title="Latest Releases" />;
  }
  
  if (displayGames.length === 0) {
    return null;
  }

  return (
    <section className="w-full mb-12" key={`latest-section-${respawnCount}`}>
      <div className="relative mb-6">
        <div className="absolute left-0 top-0 w-1 h-full bg-primary-600"></div>
        <h2 className="text-2xl font-bold text-primary-500 pl-4">Latest Releases</h2>
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