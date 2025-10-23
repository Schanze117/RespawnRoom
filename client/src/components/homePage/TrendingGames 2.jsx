import React, { useEffect, useState } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { useGameContext } from '../../utils/GameContext';
import { SectionSkeleton } from '../../utils/LoadingSkeletons';

export default function TrendingGames() {
  const { featuredGames, isLoading, respawnCount } = useGameContext();
  const [displayGames, setDisplayGames] = useState([]);

  // Force component re-render when respawnCount changes
  useEffect(() => {
    // Combine primary and secondary games
    const trendingGames = [...featuredGames.primary, ...featuredGames.secondary];
    
    // Create new game objects to ensure reference changes
    const refreshedGames = trendingGames.map(game => ({
      ...game,
      _respawnId: respawnCount, // Add respawn ID to force React to see the object as new
      ratingCount: game.rating_count || game.ratingCount || 0, // Map rating_count to ratingCount for UI compatibility
      rating: Math.random() * 40 + 60, // Generate rating between 60-100
      rating_count: Math.floor(Math.random() * 10000) + 1000
    }));
    
    setDisplayGames(refreshedGames);
  }, [featuredGames, respawnCount]);

  if (isLoading && displayGames.length === 0) {
    return <SectionSkeleton title="Trending Now" />;
  }

  if (displayGames.length === 0) {
    return null;
  }

  return (
    <section className="w-full mb-8 sm:mb-12 overflow-hidden">
      <div className="relative mb-6">
        <div className="absolute left-0 top-0 w-1 h-full bg-primary-600"></div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary-500 pl-4">Trending Now</h2>
      </div>
      
      {/* Force re-render with a new component instance by using a unique key */}
      <ScrollableGameCards 
        games={displayGames} 
        type="trending" 
        key={`trending-${respawnCount}`} 
      />
    </section>
  );
} 