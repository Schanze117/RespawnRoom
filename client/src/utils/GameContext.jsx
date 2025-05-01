import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  getFeaturedGame, 
  getAllCategorizedGames,
  resetDisplayedGames 
} from './gameFetcher';

// Create a context
const GameContext = createContext();

// Custom hook to use the game context
export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRespawning, setIsRespawning] = useState(false);
  const [respawnCount, setRespawnCount] = useState(0);
  
  // Game data states
  const [featuredGame, setFeaturedGame] = useState(null);
  const [featuredGames, setFeaturedGames] = useState({ primary: [], secondary: [] });
  const [latestGames, setLatestGames] = useState({ primary: [], secondary: [] });
  const [topGames, setTopGames] = useState({ primary: [], secondary: [] });
  const [upcomingGames, setUpcomingGames] = useState({ primary: [], secondary: [] });
  const [allGames, setAllGames] = useState([]);

  // Load all game data
  const loadAllGameData = async () => {
    setIsLoading(true);
    try {
      console.log('🎮 Starting to load game data using the optimized approach');
      
      // Load the featured game first
      console.log('⭐ Loading featured game...');
      const featured = await getFeaturedGame();
      setFeaturedGame(featured);
      console.log('⭐ Featured game loaded', featured?.name || 'No featured game');
      
      // Then load all games at once using our new endpoint
      console.log('🔄 Loading all game categories in a single API call...');
      const categorizedGames = await getAllCategorizedGames();
      
      console.log('📊 Game data loaded:',
        `Featured: ${categorizedGames.trending?.primary?.length + categorizedGames.trending?.secondary?.length || 0}`,
        `Latest: ${categorizedGames.latest?.primary?.length + categorizedGames.latest?.secondary?.length || 0}`,
        `Top: ${categorizedGames.topRated?.primary?.length + categorizedGames.topRated?.secondary?.length || 0}`,
        `Upcoming: ${categorizedGames.upcoming?.primary?.length + categorizedGames.upcoming?.secondary?.length || 0}`,
        `Total unique games: ${categorizedGames.allGames?.length || 0}`
      );
      
      setFeaturedGames(categorizedGames.trending || { primary: [], secondary: [] });
      setLatestGames(categorizedGames.latest || { primary: [], secondary: [] });
      setTopGames(categorizedGames.topRated || { primary: [], secondary: [] });
      setUpcomingGames(categorizedGames.upcoming || { primary: [], secondary: [] });
      setAllGames(categorizedGames.allGames || []);
      
      setInitialLoadComplete(true);
      console.log('✅ All game data loaded and set in state');
    } catch (error) {
      console.error('❌ Error loading game data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle respawn button click
  const handleRespawn = async () => {
    if (isRespawning) return;
    
    console.log('🔄 Starting respawn process...');
    setIsRespawning(true);
    
    // First, reset the game data state to empty arrays
    setFeaturedGame(null);
    setFeaturedGames({ primary: [], secondary: [] });
    setLatestGames({ primary: [], secondary: [] });
    setTopGames({ primary: [], secondary: [] });
    setUpcomingGames({ primary: [], secondary: [] });
    setAllGames([]);
    
    // Clear the displayed games tracking
    resetDisplayedGames();
    console.log('🧹 Cleared displayed games tracking');
    
    // Increment the respawn count to trigger component updates
    setRespawnCount(prev => {
      const newCount = prev + 1;
      console.log(`🔢 Incremented respawn count to ${newCount}`);
      return newCount;
    });
    
    // Add a small delay to ensure state updates have propagated
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reload all game data with a fresh API fetch
    try {
      console.log('📥 Loading new game data from API...');
    await loadAllGameData();
    console.log('✅ New game data loaded successfully');
    } catch (error) {
      console.error('❌ Error reloading game data:', error);
    }
    
    // Reset the respawning state after a delay
    setTimeout(() => {
      setIsRespawning(false);
      console.log('🏁 Respawn process completed');
      
      // Force one more respawnCount update to ensure all components re-render
      setRespawnCount(prev => {
        const finalCount = prev + 1;
        console.log(`🔄 Final respawn count update to ${finalCount}`);
        return finalCount;
      });
    }, 2000);
  };

  // Load data on initial mount only
  useEffect(() => {
    if (!initialLoadComplete) {
      loadAllGameData();
    }
  }, [initialLoadComplete]);

  // Context value
  const contextValue = {
    isLoading,
    isRespawning,
    respawnCount,
    featuredGame,
    featuredGames,
    latestGames,
    topGames,
    upcomingGames,
    allGames,
    handleRespawn,
    initialLoadComplete
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext; 