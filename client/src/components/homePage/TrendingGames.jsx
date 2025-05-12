import React, { useEffect, useState } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { useGameContext } from '../../utils/GameContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
    return (
      <section className="w-full mb-8 sm:mb-12 overflow-hidden">
        <div className="relative mb-6">
          <div className="absolute left-0 top-0 w-1 h-full bg-primary-600"></div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary-500 pl-4">Trending Now</h2>
        </div>
        <div className="flex space-x-4 overflow-x-scroll pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex-shrink-0 bg-surface-800 rounded-lg overflow-hidden border border-surface-700 w-[250px] sm:w-[280px]">
              <Skeleton width="100%" height={160} baseColor="#202020" highlightColor="#2a2a2a" />
              <div className="p-4">
                <Skeleton width="80%" height={20} baseColor="#202020" highlightColor="#2a2a2a" />
                <Skeleton width="60%" height={14} baseColor="#202020" highlightColor="#2a2a2a" style={{ marginTop: 8 }} />
                <div className="mt-4">
                  <Skeleton width="40%" height={14} baseColor="#202020" highlightColor="#2a2a2a" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
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