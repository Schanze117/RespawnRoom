import React from 'react';
import HeroCarousel from '../components/homePage/HeroCarousel';
import PersonalizedRecommendations from '../components/homePage/PersonalizedRecommendations';
import TrendingGames from '../components/homePage/TrendingGames';
import LatestReleases from '../components/homePage/LatestReleases';
import UpcomingReleases from '../components/homePage/UpcomingReleases';
import TopRated from '../components/homePage/TopRated';
import GenreSpotlights from '../components/homePage/GenreSpotlights';

export default function Home() {
    return (
        <div className="mt-20 md:ml-55 px-4 sm:px-6 py-8 bg-surface-900">
            <h1 className="text-3xl font-bold text-primary-600 mb-8">Welcome to Respawn Room</h1>
            
            <HeroCarousel />
            <PersonalizedRecommendations />
            <TrendingGames />
            <LatestReleases />
            <UpcomingReleases />
            <TopRated />
            <GenreSpotlights />
        </div>
    );
}