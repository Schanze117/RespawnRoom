import { API_BASE_URL, getTrendingGames, getLatestReleases, getTopRatedGames, getUpcomingGames, getGameById, getAllCategorizedGames as apiGetAllCategorizedGames } from './api';

// IGDB ID for our featured game
const FEATURED_GAME_ID = 2903;

// Store already displayed game IDs to prevent duplicates across sections
let displayedGameIds = new Set();

// Store categorized games for reuse
let cachedCategorizedGames = null;

/**
 * Resets the tracking of displayed games
 */
export function resetDisplayedGames() {
  displayedGameIds.clear();
  
  // Make sure the set is actually cleared
  if (displayedGameIds.size > 0) {
    displayedGameIds = new Set();
  }
  
  // Clear cached data to force fresh fetches
  cachedCategorizedGames = null;
}

/**
 * Gets all categorized games in a single API call
 */
export async function getAllCategorizedGames() {
  try {
    // Use cached data if available, otherwise fetch from API
    if (cachedCategorizedGames) {
      return cachedCategorizedGames;
    }
    
    // Get categorized games from API
    try {
      const categorizedGames = await apiGetAllCategorizedGames();
      
      // Cache the results for future use
      cachedCategorizedGames = categorizedGames;
      
      // Add featured game ID to the tracking set
      displayedGameIds.add(FEATURED_GAME_ID);
      
      // Add all displayed games to tracking set
      if (categorizedGames.trending) {
        [...categorizedGames.trending.primary, ...categorizedGames.trending.secondary].forEach(game => {
          if (game && game.id) displayedGameIds.add(game.id);
        });
      }
      
      if (categorizedGames.latest) {
        [...categorizedGames.latest.primary, ...categorizedGames.latest.secondary].forEach(game => {
          if (game && game.id) displayedGameIds.add(game.id);
        });
      }
      
      if (categorizedGames.topRated) {
        [...categorizedGames.topRated.primary, ...categorizedGames.topRated.secondary].forEach(game => {
          if (game && game.id) displayedGameIds.add(game.id);
        });
      }
      
      if (categorizedGames.upcoming) {
        [...categorizedGames.upcoming.primary, ...categorizedGames.upcoming.secondary].forEach(game => {
          if (game && game.id) displayedGameIds.add(game.id);
        });
      }
      
      return categorizedGames;
    } catch (error) {
      // Fallback to individual API calls if the unified endpoint fails
      
      // Make all API calls in parallel
      const [trending, latest, topRated, upcoming] = await Promise.all([
        getTrendingGames().catch(() => []),
        getLatestReleases().catch(() => []),
        getTopRatedGames().catch(() => []),
        getUpcomingGames().catch(() => [])
      ]);
      
      // Function to split games into primary and secondary
      const splitGames = (games, primaryCount = 5) => {
        // Add all games to tracking set
        games.forEach(game => {
          if (game && game.id) displayedGameIds.add(game.id);
        });
        
        return {
          primary: games.slice(0, primaryCount),
          secondary: games.slice(primaryCount, primaryCount + 10)
        };
      };
      
      // Create categorized object manually
      const manualCategorizedGames = {
        trending: splitGames(trending),
        latest: splitGames(latest),
        topRated: splitGames(topRated),
        upcoming: splitGames(upcoming),
        allGames: [...trending, ...latest, ...topRated, ...upcoming]
      };
      
      // Cache the results
      cachedCategorizedGames = manualCategorizedGames;
      
      return manualCategorizedGames;
    }
  } catch (error) {
    // Return empty data structure on error
    return {
      trending: { primary: [], secondary: [] },
      latest: { primary: [], secondary: [] },
      topRated: { primary: [], secondary: [] },
      upcoming: { primary: [], secondary: [] },
      allGames: []
    };
  }
}

/**
 * Gets the featured game that should always appear first
 */
export async function getFeaturedGame() {
  try {
    // Immediately add featured game ID to displayed set to exclude from other sections
    displayedGameIds.add(FEATURED_GAME_ID);
    
    const game = await getGameById(FEATURED_GAME_ID);
    if (game) {
      return game;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetches, processes and returns featured games from IGDB API via backend proxy
 */
export async function getFeaturedGames() {
  try {
    // Make sure the featured game ID is already in the displayed set
    // This ensures it won't appear in trending games
    displayedGameIds.add(FEATURED_GAME_ID);
    
    // Use the API function to get trending games
    const games = await getTrendingGames();
    
    // Handle empty response from API
    if (!games || games.length === 0) {
      return { primary: [], secondary: [] };
    }
    
    // Filter out games already displayed elsewhere (including our featured game)
    const availableGames = games.filter(game => !displayedGameIds.has(game.id));
    
    // If we have fewer than 10 games after filtering, take what we can get
    const maxPrimaryCount = 5;
    const maxSecondaryCount = 5;
    const useCount = Math.min(maxPrimaryCount + maxSecondaryCount, availableGames.length);
    
    // Shuffle the filtered games array using Fisher-Yates algorithm
    const shuffledGames = [...availableGames];
    for (let i = shuffledGames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledGames[i], shuffledGames[j]] = [shuffledGames[j], shuffledGames[i]];
    }
    
    // Take the first 5 games for primary section and next 5 for secondary section
    const primary = shuffledGames.slice(0, maxPrimaryCount);
    const secondary = shuffledGames.slice(maxPrimaryCount, useCount);
    
    // Add all selected games to the set of displayed games
    [...primary, ...secondary].forEach(game => {
      if (game && game.id) displayedGameIds.add(game.id);
    });
    
    return { primary, secondary };
  } catch (error) {
    return { primary: [], secondary: [] };
  }
}

/**
 * Fetches, processes and returns latest games from IGDB API via backend proxy
 */
export async function getLatestGames() {
  try {
    // Use the API function to get latest games
    const games = await getLatestReleases();
    
    // Handle empty response from API
    if (!games || games.length === 0) {
      return { primary: [], secondary: [] };
    }
    
    // Filter out games already displayed elsewhere
    const availableGames = games.filter(game => !displayedGameIds.has(game.id));
    
    // If we have fewer than 10 games after filtering, take what we can get
    const maxPrimaryCount = 5;
    const maxSecondaryCount = 10;
    const useCount = Math.min(maxPrimaryCount + maxSecondaryCount, availableGames.length);
    
    // Sort by release date (newest first)
    const sortedGames = [...availableGames].sort((a, b) => {
      const dateA = new Date(a.first_release_date * 1000);
      const dateB = new Date(b.first_release_date * 1000);
      return dateB - dateA;
    });
    
    // Take the first 5 games for primary section and next 10 for secondary section
    const primary = sortedGames.slice(0, maxPrimaryCount);
    const secondary = sortedGames.slice(maxPrimaryCount, useCount);
    
    // Add all selected games to the set of displayed games
    [...primary, ...secondary].forEach(game => {
      if (game && game.id) displayedGameIds.add(game.id);
    });
    
    return { primary, secondary };
  } catch (error) {
    return { primary: [], secondary: [] };
  }
}

/**
 * Fetches, processes and returns top rated games from IGDB API via backend proxy
 */
export async function getTopGames() {
  try {
    // Use the API function to get top rated games
    const games = await getTopRatedGames();
    
    // Handle empty response from API
    if (!games || games.length === 0) {
      return { primary: [], secondary: [] };
    }
    
    // Filter out games already displayed elsewhere
    const availableGames = games.filter(game => !displayedGameIds.has(game.id));
    
    // If we have fewer than 10 games after filtering, take what we can get
    const maxPrimaryCount = 5;
    const maxSecondaryCount = 10;
    const useCount = Math.min(maxPrimaryCount + maxSecondaryCount, availableGames.length);
    
    // Sort by rating (highest first)
    const sortedGames = [...availableGames].sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });
    
    // Take the first 5 games for primary section and next 10 for secondary section
    const primary = sortedGames.slice(0, maxPrimaryCount);
    const secondary = sortedGames.slice(maxPrimaryCount, useCount);
    
    // Add all selected games to the set of displayed games
    [...primary, ...secondary].forEach(game => {
      if (game && game.id) displayedGameIds.add(game.id);
    });
    
    return { primary, secondary };
  } catch (error) {
    return { primary: [], secondary: [] };
  }
}

/**
 * Fetches, processes and returns upcoming games from IGDB API via backend proxy
 */
export async function getUpcomingReleases() {
  try {
    // Use the API function to get upcoming games
    const games = await getUpcomingGames();
    
    // Handle empty response from API
    if (!games || games.length === 0) {
      return { primary: [], secondary: [] };
    }
    
    // Filter out games already displayed elsewhere
    const availableGames = games.filter(game => !displayedGameIds.has(game.id));
    
    // If we have fewer than 10 games after filtering, take what we can get
    const maxPrimaryCount = 5;
    const maxSecondaryCount = 10;
    const useCount = Math.min(maxPrimaryCount + maxSecondaryCount, availableGames.length);
    
    // Sort by release date (soonest first)
    const sortedGames = [...availableGames].sort((a, b) => {
      const dateA = new Date(a.first_release_date * 1000);
      const dateB = new Date(b.first_release_date * 1000);
      return dateA - dateB;
    });
    
    // Take the first 5 games for primary section and next 10 for secondary section
    const primary = sortedGames.slice(0, maxPrimaryCount);
    const secondary = sortedGames.slice(maxPrimaryCount, useCount);
    
    // Add all selected games to the set of displayed games
    [...primary, ...secondary].forEach(game => {
      if (game && game.id) displayedGameIds.add(game.id);
    });
    
    return { primary, secondary };
  } catch (error) {
    return { primary: [], secondary: [] };
  }
} 