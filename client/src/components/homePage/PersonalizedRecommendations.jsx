import React, { useState, useEffect } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { getPersonalizedGames, getTrendingGames } from '../../utils/api';
import { UserProfileManager } from '../../utils/userProfile';
import { Link } from 'react-router-dom';
import { useGameContext } from '../../utils/GameContext';

export default function PersonalizedRecommendations() {
  const { respawnCount, featuredGames } = useGameContext();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasTokens, setHasTokens] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // For immediate debugging visibility
  const forceShowDebug = false; // Don't show debug info in production

  // Function to handle manual refresh
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setInitialLoadComplete(false); // Reset the initialLoadComplete flag to trigger a reload
  };

  // Function to get random items from an array
  const getRandomItems = (array, count) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Function to mix trending games with personalized recommendations
  const mixRecommendations = (personalizedGames, trendingGames) => {
    // Get 3 random trending games
    const randomTrending = getRandomItems(trendingGames, 3);
    
    // Mark them as trending recommendations and add respawnId
    const markedTrending = randomTrending.map(game => ({
      ...game,
      isTrending: true,
      _respawnId: respawnCount, // Add respawn ID to force a reference change
      matchScore: Math.floor(Math.random() * 15) + 75 // Random score between 75-90 for trending
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
        
        // Get trending games for mixing
        let trendingGamesForMixing = [];
        
        // Try to get trending games from the context first
        const contextTrending = [...featuredGames.primary, ...featuredGames.secondary];
        if (contextTrending && contextTrending.length > 0) {
          trendingGamesForMixing = contextTrending;
        } else {
          // Fallback - fetch trending games directly
          try {
            trendingGamesForMixing = await getTrendingGames();
          } catch (err) {
            console.warn('Could not get trending games for mixing', err);
          }
        }
        
        // STEP 2: Try to get personalized recommendations from the server API
        try {
          console.log('Attempting to fetch personalized games from server API');
          setDebugInfo(prev => ({ ...prev, apiStatus: 'fetching from server API' }));
          
          // Get personalized games from server
          const personalizedGames = await getPersonalizedGames();
          
          if (personalizedGames && personalizedGames.length > 0) {
            console.log(`Received ${personalizedGames.length} personalized games from server`);
            
            // Mix personalized games with trending games
            const mixedRecommendations = mixRecommendations(
              personalizedGames,
              trendingGamesForMixing.length > 0 ? trendingGamesForMixing : getFallbackGames()
            );
            
            setRecommendations(mixedRecommendations);
            setDebugInfo(prev => ({ 
              ...prev, 
              apiStatus: 'success - using mixed recommendations',
              recommendationSource: 'server API + trending mix',
              gameCount: mixedRecommendations.length,
              trending: mixedRecommendations.filter(g => g.isTrending).map(g => g.name),
              personalized: mixedRecommendations.filter(g => !g.isTrending).map(g => g.name)
            }));
            setLoading(false);
            setInitialLoadComplete(true);
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
          
          // Get trending games from API if we don't already have them
          const trendingGames = trendingGamesForMixing.length > 0 
            ? trendingGamesForMixing 
            : await getTrendingGames();
          
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
            matchScore: Math.floor(Math.random() * 15) + 75 // Random score between 75-90
          }));
          
          // Combine and shuffle a bit
          const finalMix = [...sortedGames, ...randomTrending].sort(() => 0.3 - Math.random());
          
          setRecommendations(finalMix);
          setDebugInfo(prev => ({ 
            ...prev, 
            apiStatus: 'success - using locally scored trending games with random mix',
            recommendationSource: 'trending games with token scoring + random trending',
            gameCount: finalMix.length,
            trending: finalMix.filter(g => g.isTrending).map(g => g.name),
            personalized: finalMix.filter(g => !g.isTrending).map(g => g.name)
          }));
          setInitialLoadComplete(true);
          
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
              matchScore: score > 0 ? Math.min(Math.round((score / 3) * 100), 99) : 85, // Default score if no match
              ratingCount: game.rating_count || 0
            };
          });
          
          // Create a mix of personalized and trending games
          const sortedGames = [...scoredGames]
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 12);
            
          // Add 3 random games marked as trending
          const trendingGames = [...scoredGames]
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(game => ({
              ...game,
              isTrending: true,
              matchScore: Math.floor(Math.random() * 15) + 75 // Random score between 75-90
            }));
            
          // Mix them together
          const mixedGames = [...sortedGames, ...trendingGames].sort(() => 0.3 - Math.random());
          
          // Map rating_count to ratingCount for UI compatibility
          const formattedGames = mixedGames.map(game => ({
            ...game,
            ratingCount: game.rating_count || game.ratingCount || 0
          }));
          
          setRecommendations(formattedGames);
          setDebugInfo(prev => ({ 
            ...prev, 
            apiStatus: 'using fallback games with token scoring + random mix',
            recommendationSource: 'local fallback data',
            trending: mixedGames.filter(g => g.isTrending).map(g => g.name),
            personalized: mixedGames.filter(g => !g.isTrending).map(g => g.name)
          }));
          setInitialLoadComplete(true);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Fatal error fetching personalized recommendations:', error);
        setError('Failed to load personalized recommendations');
        setLoading(false);
        setDebugInfo(prev => ({ ...prev, apiStatus: 'fatal error', error: error.message }));
        
        // Always fallback to mock data
        const fallbackGames = getFallbackGames();
        // Take 12 as personalized and 3 as trending
        const personalizedFallback = fallbackGames.slice(0, 12);
        const trendingFallback = fallbackGames.slice(0, 3).map(game => ({
          ...game,
          isTrending: true,
          matchScore: Math.floor(Math.random() * 15) + 75
        }));
        
        // Map rating_count to ratingCount for UI compatibility
        const allFallbackGames = [...personalizedFallback, ...trendingFallback].map(game => ({
          ...game,
          ratingCount: game.rating_count || game.ratingCount || 0
        }));
        
        setRecommendations(allFallbackGames);
        setInitialLoadComplete(true);
      }
    }

    fetchPersonalizedGames();
  }, [initialLoadComplete, recommendations.length, respawnCount, featuredGames]);

  // Fallback games function to avoid code duplication
  const getFallbackGames = () => {
    return [
      { 
        id: 1, 
        name: "The Witcher 3", 
        genres: [{ name: "RPG" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "The Witcher 3: Wild Hunt is a story-driven, next-generation open world role-playing game set in a visually stunning fantasy universe full of meaningful choices and impactful consequences.",
        rating: 93.5,
        rating_count: 12487
      },
      { 
        id: 2, 
        name: "God of War", 
        genres: [{ name: "Action Adventure" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "His vengeance against the Gods of Olympus years behind him, Kratos now lives as a man in the realm of Norse Gods and monsters. It is in this harsh, unforgiving world that he must fight to survive... and teach his son to do the same.",
        rating: 94.2,
        rating_count: 8752
      },
      { 
        id: 3, 
        name: "Hollow Knight", 
        genres: [{ name: "Metroidvania" }, { name: "Platformer" }],
        player_perspectives: [{ name: "Side View" }],
        summary: "Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes. Explore twisting caverns, battle tainted creatures and befriend bizarre bugs.",
        rating: 89.7,
        rating_count: 4328
      },
      { 
        id: 4, 
        name: "Stardew Valley", 
        genres: [{ name: "Simulation" }, { name: "RPG" }],
        player_perspectives: [{ name: "Top-Down" }],
        summary: "You've inherited your grandfather's old farm plot in Stardew Valley. Armed with hand-me-down tools and a few coins, you set out to begin your new life. Can you learn to live off the land and turn these overgrown fields into a thriving home?",
        rating: 90.3, 
        rating_count: 10254
      },
      { 
        id: 5, 
        name: "Cyberpunk 2077", 
        genres: [{ name: "RPG" }, { name: "Open World" }],
        player_perspectives: [{ name: "First Person" }],
        summary: "Cyberpunk 2077 is an open-world, action-adventure story set in Night City, a megalopolis obsessed with power, glamour and body modification.",
        rating: 84.6,
        rating_count: 9421
      },
      { 
        id: 6, 
        name: "Elden Ring", 
        genres: [{ name: "Action RPG" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "THE NEW FANTASY ACTION RPG. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.",
        rating: 95.8,
        rating_count: 15284
      },
      { 
        id: 7, 
        name: "Baldur's Gate 3", 
        genres: [{ name: "RPG" }],
        player_perspectives: [{ name: "Isometric" }],
        summary: "Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power.",
        rating: 96.2,
        rating_count: 14762
      },
      { 
        id: 8, 
        name: "The Legend of Zelda: Breath of the Wild", 
        genres: [{ name: "Action Adventure" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "Step into a world of discovery, exploration, and adventure in The Legend of Zelda: Breath of the Wild.",
        rating: 97.3,
        rating_count: 18452
      },
      { 
        id: 9, 
        name: "Hades", 
        genres: [{ name: "Roguelike" }, { name: "Action" }],
        player_perspectives: [{ name: "Isometric" }],
        summary: "Hades is a god-like rogue-like dungeon crawler that combines the best aspects of Supergiant's critically acclaimed titles.",
        rating: 93.2,
        rating_count: 7854
      },
      { 
        id: 10, 
        name: "Red Dead Redemption 2", 
        genres: [{ name: "Action Adventure" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "America, 1899. The end of the Wild West era has begun. After a robbery goes badly wrong, Arthur Morgan and the Van der Linde gang are forced to flee.",
        rating: 95.5,
        rating_count: 13879
      },
      { 
        id: 11, 
        name: "Disco Elysium", 
        genres: [{ name: "RPG" }],
        player_perspectives: [{ name: "Isometric" }],
        summary: "Disco Elysium is a groundbreaking open world role playing game. You're a detective with a unique skill system at your disposal and a whole city block to carve your path across.",
        rating: 91.4,
        rating_count: 5218
      },
      { 
        id: 12, 
        name: "Persona 5 Royal", 
        genres: [{ name: "JRPG" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "Wear the mask. Reveal your truth. Prepare for an all-new RPG experience in Persona 5 Royal.",
        rating: 94.8,
        rating_count: 8623
      },
      { 
        id: 13, 
        name: "Mass Effect Legendary Edition", 
        genres: [{ name: "Action RPG" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "The Mass Effect Legendary Edition includes single-player base content and over 40 DLC from Mass Effect, Mass Effect 2, and Mass Effect 3 games.",
        rating: 92.1,
        rating_count: 6748
      },
      { 
        id: 14, 
        name: "Bloodborne", 
        genres: [{ name: "Action RPG" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "Bloodborne is an action RPG in which you hunt for answers in the ancient city of Yharnam, now cursed with a strange endemic illness spreading through the streets.",
        rating: 93.7,
        rating_count: 9547
      },
      { 
        id: 15, 
        name: "Ghost of Tsushima", 
        genres: [{ name: "Action Adventure" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "In the late 13th century, the Mongol empire has laid waste to entire nations. Tsushima Island is all that stands between mainland Japan and a massive Mongol invasion fleet.",
        rating: 91.9,
        rating_count: 7326
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
      
      <ScrollableGameCards 
        games={recommendations} 
        type="recommended" 
        key={`recommended-${respawnCount}`} 
      />
    </section>
  );
} 