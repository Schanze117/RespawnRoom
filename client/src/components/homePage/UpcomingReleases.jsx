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
    const enhancedGames = allUpcomingGames.map(game => ({
      ...game,
      _respawnId: respawnCount, // Add respawn ID to force React to see the object as new
      ratingCount: game.rating_count || game.ratingCount || 0, // Map rating_count to ratingCount for UI compatibility
      // Upcoming games may not have ratings yet, so we'll add anticipated ratings
      rating: game.rating || (Math.random() * 25 + 70), // Add rating if not present (between 70-95)
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : game.release_date, // Add formatted release date
      isExpanded: false // Add state for expanded view
    }));
    
    setDisplayGames(enhancedGames);
    
    // Debug log
    console.log(enhancedGames.length > 0 ? enhancedGames[0] : 'No games available');
      
    // Cleanup function to check unmounting
    return () => {
    };
  }, [upcomingGames, respawnCount]);
  
  // Handle toggling expanded state for a specific game
  const handleToggleExpand = (gameId) => {
    setDisplayGames(prevGames => 
      prevGames.map(game => 
        game.id === gameId 
          ? { ...game, isExpanded: !game.isExpanded } 
          : game
      )
    );
  };

  return (
    <section className="w-full mb-12 relative" key={`upcoming-section-${respawnCount}`}>
      <div className="relative mb-6">
        <div className="absolute left-0 top-0 w-1 h-full bg-primary-600"></div>
        <h2 className="text-2xl font-bold text-primary-500 pl-4">Upcoming Releases</h2>
      </div>
      
      {isLoading ? (
        <div className="w-full py-4">
          <Skeleton height={320} count={1} />
        </div>
      ) : displayGames.length === 0 ? (
        <div className="w-full py-8 text-center bg-surface-800/50 rounded-lg border border-surface-700">
          <p className="text-light text-opacity-70">No upcoming games available at the moment</p>
        </div>
      ) : (
        /* Force re-render with a new component instance by using a unique key */
        <ScrollableGameCards 
          games={displayGames} 
          type="upcoming" 
          key={`upcoming-${respawnCount}`}
          onToggleExpand={handleToggleExpand}
          fixedHeight={true} // Add prop to enforce consistent card heights
        />
      )}
    </section>
  );
} 