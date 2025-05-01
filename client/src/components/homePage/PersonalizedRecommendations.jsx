import React, { useState, useEffect } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { getPersonalizedGames, getTrendingGames } from '../../utils/api';
import { UserProfileManager } from '../../utils/userProfile';
import { Link } from 'react-router-dom';

export default function PersonalizedRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasTokens, setHasTokens] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // To force component refresh

  // For immediate debugging visibility
  const forceShowDebug = true; // Always show debug info

  // Function to handle manual refresh
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setRefreshKey(prev => prev + 1); // Increment key to force useEffect to run again
  };

  useEffect(() => {
    async function fetchPersonalizedGames() {
      try {
        setLoading(true);
        
        // STEP 1: Get user tokens
        let tokens = {};
        try {
          // Get actual tokens from server
          tokens = await UserProfileManager.getProfileTokens();
        } catch (tokenError) {
          console.error('Error getting tokens:', tokenError);
        }
        
        console.log('User tokens from server:', tokens);
        
        // Update state with token info
        const hasAnyTokens = Object.keys(tokens).filter(k => k !== '_source').length > 0;
        setHasTokens(hasAnyTokens);
        setDebugInfo({ 
          tokens, 
          hasTokens: hasAnyTokens,
          tokenSource: tokens._source === 'server' ? 'server' : 'fallback tokens',
          tokenKeys: Object.keys(tokens).filter(key => key !== '_source'),
          apiStatus: 'initializing'
        });
        
        if (!hasAnyTokens) {
          console.log('No tokens available from server');
          // Show empty state instead of hardcoded games
          setLoading(false);
          setDebugInfo(prev => ({ ...prev, apiStatus: 'no tokens' }));
          return;
        }
        
        // STEP 2: Try to get personalized recommendations from the server API
        try {
          console.log('Attempting to fetch personalized games from server API');
          setDebugInfo(prev => ({ ...prev, apiStatus: 'fetching from server API' }));
          
          // Get personalized games from server
          const personalizedGames = await getPersonalizedGames();
          
          if (personalizedGames && personalizedGames.length > 0) {
            console.log(`Received ${personalizedGames.length} personalized games from server`);
            setRecommendations(personalizedGames);
            setDebugInfo(prev => ({ 
              ...prev, 
              apiStatus: 'success - using server-provided recommendations',
              recommendationSource: 'server API',
              gameCount: personalizedGames.length,
              sampleGames: personalizedGames.slice(0, 3).map(g => g.name)
            }));
            setLoading(false);
            return;
          } else {
            console.log('Server returned no personalized games, falling back to trending games with local scoring');
            setDebugInfo(prev => ({ ...prev, apiStatus: 'no server recommendations, using trending games with token scoring' }));
          }
        } catch (apiError) {
          console.error('Error fetching personalized games from server:', apiError);
          setDebugInfo(prev => ({ 
            ...prev, 
            apiStatus: 'server API error, using trending games with token scoring',
            apiError: apiError.message
          }));
        }
        
        // STEP 3: Fallback - Get trending games and score them locally
        try {
          console.log('Fetching trending games to score with user tokens');
          
          // Get trending games from API
          const trendingGames = await getTrendingGames();
          
          if (!trendingGames || trendingGames.length === 0) {
            throw new Error('No trending games available');
          }
          
          console.log(`Retrieved ${trendingGames.length} trending games for local scoring`);
          
          // Score the games using our tokens
          const scoredGames = trendingGames.map(game => {
            // Calculate score based on token matches
            let score = 0;
            const gameGenres = game.genres?.map(g => g.name) || [];
            const gamePerspectives = game.player_perspectives?.map(p => p.name) || [];
            
            // Calculate match score based on user's tokens
            [...gameGenres, ...gamePerspectives].forEach(category => {
              if (tokens[category]) {
                score += tokens[category];
              }
            });
            
            return {
              ...game,
              matchScore: score > 0 ? Math.min(Math.round((score / 3) * 100), 99) : 70, // Default score if no match
              ratingCount: game.rating_count || 0
            };
          });
          
          // Sort by score and take top 10
          const sortedGames = [...scoredGames]
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 10);
          
          setRecommendations(sortedGames);
          setDebugInfo(prev => ({ 
            ...prev, 
            apiStatus: 'success - using locally scored trending games',
            recommendationSource: 'trending games with token scoring',
            gameCount: sortedGames.length,
            scoredGames: sortedGames.map(g => `${g.name}: ${g.matchScore}%`)
          }));
          
        } catch (trendingError) {
          console.error('Error processing trending games:', trendingError);
          setDebugInfo(prev => ({ 
            ...prev, 
            apiStatus: 'trending API error, using fallback games',
            trendingError: trendingError.message 
          }));
          
          // Final fallback - use hardcoded games
          const fallbackGameData = getFallbackGames();
          
          // Score the games using our tokens
          const scoredGames = fallbackGameData.map(game => {
            // Calculate score based on token matches
            let score = 0;
            const gameGenres = game.genres.map(g => g.name);
            const gamePerspectives = game.player_perspectives?.map(p => p.name) || [];
            
            // Calculate match score based on user's tokens
            [...gameGenres, ...gamePerspectives].forEach(category => {
              if (tokens[category]) {
                score += tokens[category];
              }
            });
            
            return {
              ...game,
              matchScore: score > 0 ? Math.min(Math.round((score / 3) * 100), 99) : 85, // Random score if no match
              ratingCount: game.rating_count || 0
            };
          });
          
          // Sort by score
          const sortedGames = [...scoredGames].sort((a, b) => b.matchScore - a.matchScore);
          setRecommendations(sortedGames);
          setDebugInfo(prev => ({ 
            ...prev, 
            apiStatus: 'using fallback games with token scoring',
            recommendationSource: 'local fallback data',
            scoredGames: sortedGames.map(g => `${g.name}: ${g.matchScore}%`)
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Fatal error fetching personalized recommendations:', error);
        setError('Failed to load personalized recommendations');
        setLoading(false);
        setDebugInfo(prev => ({ ...prev, apiStatus: 'fatal error', error: error.message }));
        
        // Always fallback to mock data
        setRecommendations(getFallbackGames());
      }
    }

    fetchPersonalizedGames();
  }, [refreshKey]); // Add refreshKey as dependency to re-run on manual refresh

  // Fallback games function to avoid code duplication
  const getFallbackGames = () => {
    return [
      { 
        id: 1, 
        name: "The Witcher 3", 
        genres: [{ name: "RPG" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "The Witcher 3: Wild Hunt is a story-driven, next-generation open world role-playing game set in a visually stunning fantasy universe full of meaningful choices and impactful consequences."
      },
      { 
        id: 2, 
        name: "God of War", 
        genres: [{ name: "Action Adventure" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "His vengeance against the Gods of Olympus years behind him, Kratos now lives as a man in the realm of Norse Gods and monsters. It is in this harsh, unforgiving world that he must fight to survive... and teach his son to do the same."
      },
      { 
        id: 3, 
        name: "Hollow Knight", 
        genres: [{ name: "Metroidvania" }, { name: "Platformer" }],
        player_perspectives: [{ name: "Side View" }],
        summary: "Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes. Explore twisting caverns, battle tainted creatures and befriend bizarre bugs."
      },
      { 
        id: 4, 
        name: "Stardew Valley", 
        genres: [{ name: "Simulation" }, { name: "RPG" }],
        player_perspectives: [{ name: "Top-Down" }],
        summary: "You've inherited your grandfather's old farm plot in Stardew Valley. Armed with hand-me-down tools and a few coins, you set out to begin your new life. Can you learn to live off the land and turn these overgrown fields into a thriving home?"
      }
    ];
  };

  if (loading) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">For You</h2>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </section>
    );
  }
  
  if (!hasTokens) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">For You</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-center bg-surface-800 rounded-lg p-6 border border-surface-700">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Save a Game!</h3>
          <p className="text-gray-500 mb-6">
            Save games to your profile to get personalized recommendations based on your preferences.
          </p>
          <Link to="/profile" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
            Go to Profile
          </Link>
        </div>
      </section>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">For You</h2>
        </div>
        <div className="text-red-500 text-center py-4 bg-surface-800 rounded-lg">{error}</div>
      </section>
    );
  }

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">For You</h2>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleRefresh}
            className="text-primary-400 hover:text-primary-300 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
            Refresh
          </button>
          <Link to="/games" className="text-primary-400 hover:text-primary-300 text-sm font-medium">
            See More
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="text-amber-500 text-sm mb-4 p-2 bg-amber-900/30 rounded-md">
          {error}
        </div>
      )}
      
      <ScrollableGameCards games={recommendations} type="recommended" />
      
      {/* Debug info panel - only visible when forceShowDebug is true */}
      {(forceShowDebug && debugInfo) && (
        <div className="mt-6 p-3 bg-surface-900 border border-surface-700 rounded-md text-xs text-gray-400 overflow-x-auto">
          <div className="font-semibold mb-1">Debug Info:</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div>Token Source:</div>
            <div>{debugInfo.tokenSource}</div>
            
            <div>Has Tokens:</div>
            <div>{debugInfo.hasTokens ? 'Yes' : 'No'}</div>
            
            <div>API Status:</div>
            <div>{debugInfo.apiStatus}</div>
            
            {debugInfo.recommendationSource && (
              <>
                <div>Data Source:</div>
                <div>{debugInfo.recommendationSource}</div>
              </>
            )}
            
            {debugInfo.gameCount !== undefined && (
              <>
                <div>Game Count:</div>
                <div>{debugInfo.gameCount}</div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
} 