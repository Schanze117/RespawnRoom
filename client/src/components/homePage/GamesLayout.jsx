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
    console.log(`[GamesLayout] Respawn count changed to ${respawnCount}, forcing refresh`);
    setLocalKey(prevKey => prevKey + 1);
  }, [respawnCount]);
  
  // Add additional re-render when respawning completes
  useEffect(() => {
    if (!isRespawning && respawnCount > 0) {
      console.log('[GamesLayout] Respawning completed, triggering secondary refresh');
      setTimeout(() => {
        setLocalKey(prevKey => prevKey + 1);
      }, 500);
    }
  }, [isRespawning, respawnCount]);
  
  console.log(`[GamesLayout] Rendering with respawn count: ${respawnCount}, local key: ${localKey}`);
  
  return (
    <div key={`games-layout-${respawnCount}-${localKey}`}>
      <TrendingGames key={`trending-${respawnCount}-${localKey}`} />
      <LatestReleases key={`latest-${respawnCount}-${localKey}`} />
      <UpcomingReleases key={`upcoming-${respawnCount}-${localKey}`} />
      <TopRated key={`top-rated-${respawnCount}-${localKey}`} />
    </div>
  );
} 