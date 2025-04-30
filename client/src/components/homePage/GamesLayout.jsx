import React from 'react';
import TrendingGames from './TrendingGames';
import LatestReleases from './LatestReleases';

export default function GamesLayout() {
  return (
    <div>
      <TrendingGames />
      <LatestReleases />
    </div>
  );
} 