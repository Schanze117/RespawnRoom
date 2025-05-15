import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_ME } from '../utils/queries';
import Auth from '../utils/auth';
import HeroCarousel from '../components/homePage/HeroCarousel';
import PersonalizedRecommendations from '../components/homePage/PersonalizedRecommendations';
import GamesLayout from '../components/homePage/GamesLayout';
import { useGameContext } from '../utils/GameContext';

export default function Home() {
    const { 
        isRespawning, 
        respawnCount, 
        handleRespawn, 
        isLoading, 
        initialLoadComplete 
    } = useGameContext();

    // Get user data if they're logged in
    const isLoggedIn = Auth.loggedIn();
    const { data: userData } = useQuery(GET_ME, {
        skip: !isLoggedIn,
    });
    
    // Get username if available
    const username = userData?.me?.userName;
    const welcomeMessage = username 
        ? `${username}, Welcome to Respawn Room`
        : 'Welcome to Respawn Room';

    return (
        <div className="min-h-screen bg-surface-900">
            {/* Fixed position container for consistent layout structure */}
            <div className="flex-1 pt-20 md:pl-64 w-full">
                {/* Adjusted container: Removed specific padding, relying on inner max-width container for padding */}
                <div className="container mx-auto">
                    {/* Content wrapper: Increased max-width and added responsive padding */}
                    <div className="max-w-screen-2xl w-full mx-auto px-4 md:px-6 lg:px-8">
                        {/* Header section with welcome message */}
                        <div className="mb-8 px-2">
                            <h1 className="text-2xl sm:text-3xl font-bold text-primary-600 break-words">
                                {welcomeMessage}
                            </h1>
                        </div>
                        
                        {isLoading && !initialLoadComplete ? (
                            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                                <div className="animate-spin h-10 w-10 sm:h-12 sm:w-12 mb-4 text-primary-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                                <p className="text-primary-400 text-sm sm:text-base">Loading all games...</p>
                            </div>
                        ) : (
                            <div className="space-y-6 sm:space-y-8 overflow-x-hidden">
                                {/* Hero Section - full width on mobile, contained on larger screens */}
                                <div className="overflow-x-hidden -mx-4 sm:mx-0 sm:rounded-lg">
                                    <HeroCarousel />
                                </div>
                                
                                {/* Personalized Recommendations */}
                                <div className="overflow-x-hidden">
                                    <PersonalizedRecommendations />
                                </div>
                                
                                {/* Games Layout - automatically scroll on small screens */}
                                <div className="overflow-x-hidden">
                                    <GamesLayout />
                                </div>
                            </div>
                        )}

                        {/* Respawn All Games button at bottom of page */}
                        <div className="flex justify-center mt-12 mb-8">
                            <button 
                                onClick={handleRespawn}
                                disabled={isRespawning}
                                className={`px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-full text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg ${isRespawning ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                    </div>
                </div>
            </div>
        </div>
    );
}