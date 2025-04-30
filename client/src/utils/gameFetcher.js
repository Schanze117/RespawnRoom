import { API_BASE_URL } from './api';

/**
 * Fetches, processes and returns featured games from IGDB API via backend proxy
 */
export async function getFeaturedGames() {
  try {
    // Make a request to our backend proxy instead of directly to IGDB
    const response = await fetch('/api/games/trending', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Parse the JSON response
    const games = await response.json();
    
    // Handle empty response
    if (!games || games.length === 0) {
      console.warn('No trending games returned from API');
      return { primary: [], secondary: [] };
    }
    
    // Shuffle the games array using Fisher-Yates algorithm
    for (let i = games.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [games[i], games[j]] = [games[j], games[i]];
    }
    
    // Extract the first 10 entries
    const selected = games.slice(0, 10);
    
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