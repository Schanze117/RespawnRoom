import { API_BASE_URL, getTrendingGames, getLatestReleases, getTopRatedGames, getUpcomingGames, getGameById } from './api';

// IGDB ID for our featured game
const FEATURED_GAME_ID = 238532;

// Store already displayed game IDs to prevent duplicates across sections
let displayedGameIds = new Set();

/**
 * Resets the tracking of displayed games
 */
export function resetDisplayedGames() {
  displayedGameIds.clear();
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
    console.error('Error fetching featured game:', error);
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
      console.warn('No trending games returned from API');
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
    
    // Extract the selected games
    const selected = shuffledGames.slice(0, useCount);
    
    // Add these games to our tracking Set
    selected.forEach(game => displayedGameIds.add(game.id));
    
    // Split into primary and secondary groups
    const primaryCount = Math.min(maxPrimaryCount, Math.ceil(useCount / 2));
    const primary = selected.slice(0, primaryCount);
    const secondary = selected.slice(primaryCount, primaryCount + maxSecondaryCount);
    
    // Return the games split into primary and secondary groups
    return { primary, secondary };
  } catch (error) {
    console.error('Error fetching featured games:', error);
    return { primary: [], secondary: [] };
  }
}

/**
 * Fetches, processes and returns latest game releases from IGDB API via backend proxy
 */
export async function getLatestGames() {
  try {
    // Use the API function to get latest releases
    const games = await getLatestReleases();
    
    // Handle empty response
    if (!games || games.length === 0) {
      console.warn('No latest releases returned from API');
      return { primary: [], secondary: [] };
    }
    
    // Sort games by release date (newest first)
    const sortedGames = [...games].sort((a, b) => {
      return (b.first_release_date || 0) - (a.first_release_date || 0);
    });
    
    // Filter out games already displayed elsewhere
    const availableGames = sortedGames.filter(game => !displayedGameIds.has(game.id));
    
    // If we have fewer than 10 games after filtering, take what we can get
    const useCount = Math.min(15, availableGames.length);
    
    // Extract the selected games 
    const selected = availableGames.slice(0, useCount);
    
    // Add these games to our tracking Set
    selected.forEach(game => displayedGameIds.add(game.id));
    
    // Split into primary and secondary groups
    const primaryCount = Math.min(5, Math.ceil(useCount / 2));
    const primary = selected.slice(0, primaryCount);
    const secondary = selected.slice(primaryCount);
    
    // Return the games split into primary and secondary groups
    return { primary, secondary };
  } catch (error) {
    console.error('Error fetching latest games:', error);
    return { primary: [], secondary: [] };
  }
} 

/**
 * Fetches, processes and returns top-rated games from IGDB API via backend proxy
 */
export async function getTopGames() {
  try {
    // Use the API function to get top rated games
    const games = await getTopRatedGames();
    
    // Handle empty response
    if (!games || games.length === 0) {
      console.warn('No top rated games returned from API');
      return { primary: [], secondary: [] };
    }
    
    // Filter out games already displayed elsewhere
    const availableGames = games.filter(game => !displayedGameIds.has(game.id));
    
    // If we have fewer than 10 games after filtering, take what we can get
    const useCount = Math.min(15, availableGames.length);
    
    // Shuffle the filtered games array using Fisher-Yates algorithm
    const shuffledGames = [...availableGames];
    for (let i = shuffledGames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledGames[i], shuffledGames[j]] = [shuffledGames[j], shuffledGames[i]];
    }
    
    // Extract the selected games
    const selected = shuffledGames.slice(0, useCount);
    
    // Add these games to our tracking Set
    selected.forEach(game => displayedGameIds.add(game.id));
    
    // Split into primary and secondary groups
    const primaryCount = Math.min(5, Math.ceil(useCount / 2));
    const primary = selected.slice(0, primaryCount);
    const secondary = selected.slice(primaryCount);
    
    // Return the games split into primary and secondary groups
    return { primary, secondary };
  } catch (error) {
    console.error('Error fetching top rated games:', error);
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
    
    // Handle empty response
    if (!games || games.length === 0) {
      console.warn('No upcoming games returned from API');
      return { primary: [], secondary: [] };
    }
    
    // Sort games by release date (closest first)
    const sortedGames = [...games].sort((a, b) => {
      return (a.first_release_date || 0) - (b.first_release_date || 0);
    });
    
    // Filter out games already displayed elsewhere
    const availableGames = sortedGames.filter(game => !displayedGameIds.has(game.id));
    
    // If we have fewer than 10 games after filtering, take what we can get
    const useCount = Math.min(15, availableGames.length);
    
    // Extract the selected games
    const selected = availableGames.slice(0, useCount);
    
    // Add these games to our tracking Set
    selected.forEach(game => displayedGameIds.add(game.id));
    
    // Split into primary and secondary groups
    const primaryCount = Math.min(5, Math.ceil(useCount / 2));
    const primary = selected.slice(0, primaryCount);
    const secondary = selected.slice(primaryCount);
    
    // Return the games split into primary and secondary groups
    return { primary, secondary };
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return { primary: [], secondary: [] };
  }
} 