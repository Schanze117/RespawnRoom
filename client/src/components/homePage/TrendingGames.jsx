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
      ratingCount: game.rating_count || game.ratingCount || 0 // Map rating_count to ratingCount for UI compatibility
    }));
    
    setDisplayGames(refreshedGames);
  }, [featuredGames, respawnCount]);

  if (isLoading && displayGames.length === 0) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">Trending Now</h2>
        </div>
        <div className="flex space-x-4 overflow-hidden pb-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex-shrink-0 bg-surface-800 rounded-lg overflow-hidden border border-surface-700 w-[280px]">
              <Skeleton width="100%" height={160} baseColor="#202020" highlightColor="#2a2a2a" />
              <div className="p-4">
                <Skeleton width="80%" height={24} baseColor="#202020" highlightColor="#2a2a2a" />
                <Skeleton width="60%" height={16} baseColor="#202020" highlightColor="#2a2a2a" style={{ marginTop: 8 }} />
                <div className="mt-4">
                  <Skeleton width="40%" height={16} baseColor="#202020" highlightColor="#2a2a2a" />
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
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Trending Now</h2>
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