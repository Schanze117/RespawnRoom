import React, { useState, useEffect } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { getPersonalizedGames, getTrendingGames } from '../../utils/api';
import { UserProfileManager } from '../../utils/userProfile';
import { Link } from 'react-router-dom';
import { useGameContext } from '../../utils/GameContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { processTrendingGames } from '../../utils/gameFetcher';

export default function PersonalizedRecommendations() {
  const { respawnCount, featuredGames } = useGameContext();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasTokens, setHasTokens] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Function to handle manual refresh
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setInitialLoadComplete(false); // Reset the initialLoadComplete flag to trigger a reload
  };

  // Function to get random items from an array
  const getRandomItems = (array, count) => {
    if (!array || array.length === 0) return [];
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  };

  // Function to mix trending games with personalized recommendations
  const mixRecommendations = (personalizedGames, trendingGames) => {
    if (!personalizedGames || personalizedGames.length === 0) {
      return [];
    }
    
    if (!trendingGames || trendingGames.length === 0) {
      return personalizedGames.map(game => ({
        ...game,
        _respawnId: respawnCount
      }));
    }
    
    // Get existing genres from personalized games to find diverse trending games
    const existingGenres = new Set();
    personalizedGames.forEach(game => {
      if (game.genres) {
        game.genres.forEach(genre => {
          if (genre && genre.name) existingGenres.add(genre.name.toLowerCase());
        });
      }
    });
    
    // Filter trending games to prioritize those with different genres
    const diverseTrendingGames = trendingGames.filter(game => {
      if (!game.genres || game.genres.length === 0) return false;
      
      // Check if this game has at least one genre not in existingGenres
      return game.genres.some(genre => 
        genre && genre.name && !existingGenres.has(genre.name.toLowerCase())
      );
    });
    
    // Get up to 3 diverse trending games, fall back to random if needed
    const randomTrending = getRandomItems(
      diverseTrendingGames.length > 0 ? diverseTrendingGames : trendingGames, 
      3
    );
    
    // Mark them as trending recommendations and add respawnId
    const markedTrending = randomTrending.map(game => ({
      ...game,
      isTrending: true,
      _respawnId: respawnCount, // Add respawn ID to force a reference change
      ratingCount: game.rating_count || game.ratingCount || 0 // Use existing rating count
    }));
    
    // Take the top 12 personalized games and add respawnId
    const topPersonalized = personalizedGames.slice(0, 12).map(game => ({
      ...game,
      _respawnId: respawnCount, // Add respawn ID to force a reference change
    }));
    
    // Combine both arrays
    const mixed = [...topPersonalized, ...markedTrending];
    
    // Shuffle them slightly to distribute the trending games
    return mixed.sort(() => 0.3 - Math.random());
  };

  useEffect(() => {
    // If we've already loaded recommendations and there's no respawn, don't reload
    if (initialLoadComplete && recommendations.length > 0) {
      return;
    }

    async function fetchPersonalizedGames() {
      try {
        setLoading(true);
        
        // STEP 1: Get user tokens
        let tokens = {};
        try {
          // Get actual tokens from server
          tokens = await UserProfileManager.getProfileTokens();
        } catch (tokenError) {
          // Handle error silently
        }
        
        // Update state with token info
        const hasAnyTokens = Object.keys(tokens).filter(k => k !== '_source').length > 0;
        setHasTokens(hasAnyTokens);
        
        if (!hasAnyTokens) {
          // Show empty state instead of fallback games
          setLoading(false);
          return;
        }
        
        // Get trending games for mixing
        let trendingGamesForMixing = [];
        
        // Try to get trending games from the context first
        const contextTrending = [...featuredGames.primary, ...featuredGames.secondary];
        if (contextTrending && contextTrending.length > 0) {
          trendingGamesForMixing = contextTrending;
        } else {
          // Fallback - fetch trending games directly
          try {
            trendingGamesForMixing = await processTrendingGames();
          } catch (err) {
            // Handle error silently
          }
        }
        
        // STEP 2: Try to get personalized recommendations from the server API
        try {
          // Get personalized games from server
          const personalizedGames = await getPersonalizedGames();
          
          if (personalizedGames && personalizedGames.length > 0) {
            
            // Mix personalized games with trending games
            const mixedRecommendations = mixRecommendations(personalizedGames, trendingGamesForMixing);
            
            setRecommendations(mixedRecommendations);
            setLoading(false);
            setInitialLoadComplete(true);
            return;
          }
        } catch (apiError) {
          // Continue to fallback
        }
        
        // STEP 3: Fallback - Get trending games and score them locally
        try {
          // Get trending games from API if we don't already have them
          const trendingGames = trendingGamesForMixing.length > 0 
            ? trendingGamesForMixing 
            : await processTrendingGames();
          
          if (!trendingGames || trendingGames.length === 0) {
            throw new Error('No trending games available');
          }
                    
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
              ratingCount: game.rating_count || game.ratingCount || 0, // Normalize rating count
              rating: game.rating || null // Ensure rating is properly passed through
            };
          });
          
          // Sort by score and take top 12 games
          const sortedGames = [...scoredGames]
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 12);
          
          // Get 3 random trending games that aren't in the top 12
          const remainingGames = scoredGames.filter(
            game => !sortedGames.some(sg => sg.id === game.id)
          );
          
          const randomTrending = getRandomItems(remainingGames, 3).map(game => ({
            ...game,
            isTrending: true,
            _respawnId: respawnCount, // Add respawn ID to force a reference change
            ratingCount: game.rating_count || game.ratingCount || 0, // Normalize rating count
            rating: game.rating || null // Ensure rating is properly passed through
          }));
          
          // Combine and shuffle a bit
          const finalMix = [...sortedGames, ...randomTrending].sort(() => 0.3 - Math.random());
          
          setRecommendations(finalMix);
          setInitialLoadComplete(true);
          setLoading(false);
          
        } catch (trendingError) {
          setError('Unable to load recommendations. Please try again later.');
          setLoading(false);
        }
      } catch (error) {
        setError('Failed to load personalized recommendations');
        setLoading(false);
      }
    }

    fetchPersonalizedGames();
  }, [initialLoadComplete, recommendations.length, respawnCount, featuredGames]);

  if (loading) {
    return (
      <section className="w-full mb-12">
        <div className="relative mb-6">
          <div className="absolute left-0 top-0 w-1 h-full bg-primary-600"></div>
          <h2 className="text-2xl font-bold text-primary-500 pl-4">For You</h2>
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
  
  if (!hasTokens) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">For You</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-center bg-surface-800 rounded-lg p-6 border border-surface-700">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Save a Game!
          </h3>
          <p className="text-gray-500 mb-6">
            Save games to your profile to get personalized recommendations based
            on your preferences.
          </p>
          <Link
            to="/Discover"
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Go Discover
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
      <div className="relative mb-6">
        <div className="absolute left-0 top-0 w-1 h-full bg-primary-600"></div>
        <div className="flex justify-between items-center pl-4">
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
          </div>
        </div>
      </div>
      
      {error && (
        <div className="text-amber-500 text-sm mb-4 p-2 bg-amber-900/30 rounded-md">
          {error}
        </div>
      )}
      
      <ScrollableGameCards 
        games={recommendations} 
        type="recommended" 
        key={`recommended-${respawnCount}`} 
      />
    </section>
  );
} 