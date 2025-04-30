import { API_BASE_URL, getTrendingGames } from './api';

/**
 * Fetches, processes and returns featured games from IGDB API via backend proxy
 */
export async function getFeaturedGames() {
  try {
    // Use the API function to get trending games
    const games = await getTrendingGames();
    
    // Handle empty response
    if (!games || games.length === 0) {
      console.warn('No trending games returned from API');
      return { primary: [], secondary: [] };
    }
    
    // Shuffle the games array using Fisher-Yates algorithm
    const shuffledGames = [...games];
    for (let i = shuffledGames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledGames[i], shuffledGames[j]] = [shuffledGames[j], shuffledGames[i]];
    }
    
    // Extract the first 10 entries
    const selected = shuffledGames.slice(0, 10);
    
    // Return the games split into primary and secondary groups
    return {
      primary: selected.slice(0, 5),
      secondary: selected.slice(5)
    };
  } catch (error) {
    console.error('Error fetching featured games:', error);
    return { primary: [], secondary: [] };
  }
} 