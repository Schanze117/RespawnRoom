import React, { useEffect, useState } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { useGameContext } from '../../utils/GameContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function UpcomingReleases() {
  const { upcomingGames, isLoading, respawnCount } = useGameContext();
  const [displayGames, setDisplayGames] = useState([]);
  
  // Force component re-render when respawnCount changes
  useEffect(() => {
    
    // This should refresh even if the games array is the same by creating a new array reference
    const allUpcomingGames = [...upcomingGames.primary, ...upcomingGames.secondary];
    
    // Create new game objects to ensure reference changes
    const refreshedGames = allUpcomingGames.map(game => {
      // Format release date for display
      let releaseDate = null;
      if (game.first_release_date) {
        // Convert timestamp to date string
        releaseDate = new Date(game.first_release_date * 1000).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } else if (game.release_date) {
        releaseDate = game.release_date;
      }
      
      return {
        ...game,
        _respawnId: respawnCount, // Add respawn ID to force React to see the object as new
        ratingCount: game.rating_count || game.ratingCount || 0, // Map rating_count to ratingCount for UI compatibility
        releaseDate: releaseDate // Add formatted release date
      };
    });
    
    setDisplayGames(refreshedGames);
    
    // Debug log
    console.log(refreshedGames.length > 0 ? refreshedGames[0] : 'No games available');
      
    // Cleanup function to check unmounting
    return () => {
    };
  }, [upcomingGames, respawnCount]);
  
  if (isLoading && displayGames.length === 0) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">Upcoming Releases</h2>
        </div>
        <div className="flex space-x-4 overflow-hidden pb-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex-shrink-0 bg-surface-800 rounded-lg overflow-hidden border border-surface-700 w-[280px]">
              <Skeleton width="100%" height={160} baseColor="#202020" highlightColor="#2a2a2a" />
              <div className="p-4">
                <Skeleton width="80%" height={24} baseColor="#202020" highlightColor="#2a2a2a" />
                <Skeleton width="60%" height={16} baseColor="#202020" highlightColor="#2a2a2a" style={{ marginTop: 8 }} />
                <div className="mt-4 flex justify-between">
                  <Skeleton width="40%" height={16} baseColor="#202020" highlightColor="#2a2a2a" />
                  <Skeleton width="30%" height={16} baseColor="#202020" highlightColor="#2a2a2a" />
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
    <section className="w-full mb-12" key={`upcoming-section-${respawnCount}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Upcoming Releases</h2>
      </div>
      
      {/* Force re-render with a new component instance by using a unique key */}
      <ScrollableGameCards 
        games={displayGames} 
        type="upcoming" 
        key={`upcoming-${respawnCount}`} 
      />
    </section>
  );
} 