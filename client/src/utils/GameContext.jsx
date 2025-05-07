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
      // Load the featured game first
      const featured = await getFeaturedGame();
      setFeaturedGame(featured);
      
      // Then load all games at once using our new endpoint
      const categorizedGames = await getAllCategorizedGames();
      
      // Update state with fetched data
      setFeaturedGames(categorizedGames.trending || { primary: [], secondary: [] });
      setLatestGames(categorizedGames.latest || { primary: [], secondary: [] });
      setTopGames(categorizedGames.topRated || { primary: [], secondary: [] });
      setUpcomingGames(categorizedGames.upcoming || { primary: [], secondary: [] });
      setAllGames(categorizedGames.allGames || []);
      
      setInitialLoadComplete(true);
    } catch (error) {
      // Silently fail - errors are already logged in the fetcher functions
    } finally {
      setIsLoading(false);
    }
  };

  // Handle respawn button click
  const handleRespawn = async () => {
    if (isRespawning) return;
    
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
    
    // Increment the respawn count to trigger component updates
    setRespawnCount(prev => prev + 1);
    
    // Add a small delay to ensure state updates have propagated
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reload all game data with a fresh API fetch
    try {
      await loadAllGameData();
    } catch (error) {
      // Error handling in loadAllGameData
    }
    
    // Reset the respawning state after a delay
    setTimeout(() => {
      setIsRespawning(false);
      
      // Force one more respawnCount update to ensure all components re-render
      setRespawnCount(prev => prev + 1);
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