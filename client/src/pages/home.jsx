import React, { useState, useEffect } from 'react';
import HeroCarousel from '../components/homePage/HeroCarousel';
import PersonalizedRecommendations from '../components/homePage/PersonalizedRecommendations';
import GamesLayout from '../components/homePage/GamesLayout';
import UpcomingReleases from '../components/homePage/UpcomingReleases';
import TopRated from '../components/homePage/TopRated';
import GenreSpotlights from '../components/homePage/GenreSpotlights';
import { resetDisplayedGames, getFeaturedGame } from '../utils/gameFetcher';

export default function Home() {
    const [isRespawning, setIsRespawning] = useState(false);
    const [respawnCount, setRespawnCount] = useState(0);
    const [featuredGameLoaded, setFeaturedGameLoaded] = useState(false);

    // Load the featured game first to add it to displayedGameIds
    useEffect(() => {
        const loadFeaturedGame = async () => {
            try {
                // This will add the featured game ID to displayedGameIds
                await getFeaturedGame();
            } catch (error) {
                console.error('Error pre-loading featured game:', error);
            } finally {
                setFeaturedGameLoaded(true);
            }
        };

        loadFeaturedGame();
    }, [respawnCount]);

    // Handle global respawn button click
    const handleRespawn = () => {
        if (isRespawning) return;
        
        setIsRespawning(true);
        resetDisplayedGames();
        
        // Increment the count to trigger re-renders
        setRespawnCount(prev => prev + 1);
        
        // Reset the respawning state after a delay
        setTimeout(() => {
            setIsRespawning(false);
        }, 3000);
    };

    return (
        <div className="mt-20 md:ml-55 px-4 sm:px-6 py-8 bg-surface-900">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary-600">Welcome to Respawn Room</h1>
                <button 
                    onClick={handleRespawn}
                    disabled={isRespawning}
                    className={`px-6 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${isRespawning ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isRespawning ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Respawning Games...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Respawn All Games
                        </>
                    )}
                </button>
            </div>
            
            {/* Featured game always loads first */}
            <HeroCarousel key={`hero-${respawnCount}`} />
            
            {/* Only show other content when featured game is loaded */}
            {featuredGameLoaded && (
                <>
                    <PersonalizedRecommendations />
                    <GamesLayout key={`games-${respawnCount}`} />
                    <UpcomingReleases key={`upcoming-${respawnCount}`} />
                    <TopRated key={`toprated-${respawnCount}`} />
                    <GenreSpotlights />
                </>
            )}
        </div>
    );
}