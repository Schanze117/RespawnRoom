import React, { useState, useEffect } from 'react';
import HomePageCard from './HomePageCard';
import { useGameContext } from '../../utils/GameContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function GenreSpotlights() {
  const { respawnCount, isLoading, topGames } = useGameContext();
  const [isReady, setIsReady] = useState(false);
  const [editorPicks, setEditorPicks] = useState([]);

  useEffect(() => {
    // Generate editor's picks based on top-rated games
    if (topGames && (topGames.primary.length > 0 || topGames.secondary.length > 0)) {
      const allTopGames = [...topGames.primary, ...topGames.secondary];
      
      // Get up to 5 top games for editor's picks
      const selectedGames = allTopGames
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)
        .map(game => ({
          ...game,
          _respawnId: respawnCount // Add respawn ID to force React to see objects as new
        }));
        
      setEditorPicks(selectedGames);
    }
    
    // Set ready state with a small delay for visual effect
    setIsReady(false);
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [respawnCount, topGames]);

  // Shuffle editor's picks on each respawn
  const shuffleGames = () => {
    const shuffled = [...editorPicks].sort(() => 0.5 - Math.random());
    return shuffled;
  };

  if (isLoading || !isReady || editorPicks.length === 0) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">Editor's Picks</h2>
          <Skeleton width={180} height={20} baseColor="#202020" highlightColor="#2a2a2a" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-surface-800 rounded-lg overflow-hidden border border-surface-700">
              <Skeleton width="100%" height={160} baseColor="#202020" highlightColor="#2a2a2a" />
              <div className="p-4">
                <Skeleton width="80%" height={24} baseColor="#202020" highlightColor="#2a2a2a" />
                <Skeleton width="60%" height={16} baseColor="#202020" highlightColor="#2a2a2a" style={{ marginTop: 8 }} />
                <div className="mt-4">
                  <Skeleton width="100%" height={16} baseColor="#202020" highlightColor="#2a2a2a" />
                  <Skeleton width="90%" height={16} baseColor="#202020" highlightColor="#2a2a2a" style={{ marginTop: 4 }} />
                  <Skeleton width="95%" height={16} baseColor="#202020" highlightColor="#2a2a2a" style={{ marginTop: 4 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Editor's Picks</h2>
        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          View More Recommended Games
        </button>
      </div>
      
      <HomePageCard 
        games={shuffleGames()} 
        type="editors-pick" 
        key={`editors-pick-${respawnCount}`} 
      />
    </section>
  );
} 