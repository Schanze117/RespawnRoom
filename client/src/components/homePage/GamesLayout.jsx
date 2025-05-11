import React, { useEffect, useState } from 'react';
import TrendingGames from './TrendingGames';
import LatestReleases from './LatestReleases';
import UpcomingReleases from './UpcomingReleases';
import TopRated from './TopRated';
import { useGameContext } from '../../utils/GameContext';

export default function GamesLayout() {
  const { respawnCount, isRespawning } = useGameContext();
  const [localKey, setLocalKey] = useState(0);
  
  // Force re-render by incrementing local key whenever respawnCount changes
  useEffect(() => {
    setLocalKey(prevKey => prevKey + 1);
  }, [respawnCount]);
  
  // Add additional re-render when respawning completes
  useEffect(() => {
    if (!isRespawning && respawnCount > 0) {
      setTimeout(() => {
        setLocalKey(prevKey => prevKey + 1);
      }, 500);
    }
  }, [isRespawning, respawnCount]);
  
  return (
    <div key={`games-layout-${respawnCount}-${localKey}`}>
      <TrendingGames key={`trending-${respawnCount}-${localKey}`} />
      <LatestReleases key={`latest-${respawnCount}-${localKey}`} />
      <UpcomingReleases key={`upcoming-${respawnCount}-${localKey}`} />
      <TopRated key={`top-rated-${respawnCount}-${localKey}`} />
    </div>
  );
} 

// pushing test 