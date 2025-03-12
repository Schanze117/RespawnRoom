const API_BASE_URL = "/api"; 

// Search for games by name
export const searchGames = async (game) => {
  try {
    // Get the access token and client ID from the environment
    const token = import.meta.env.VITE_ACCESS_TOKEN;
    const clientId = import.meta.env.VITE_CLIENT_ID;

    if (!token) {
      throw new Error("No valid authentication token available.");
    }
    
    // Fetch the game data from the API
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
      },
      body: `search "${game}"; fields name, cover.url, summary, genres.name, player_perspectives.name; limit 10;`,
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return data;
    
  } catch (error) {
    console.error("Error fetching game data:", error);
    throw error;
  }
};

// Filter games by genre, player perspective, theme, and mode
export const filterGames = async (genres = [], playerPerspectives = [], themes = [], modes = []) => {
  try {
    // Get the access token and client ID from the environment
    const token = import.meta.env.VITE_ACCESS_TOKEN;
    const clientId = import.meta.env.VITE_CLIENT_ID;

    if (!token) {
      throw new Error("No valid authentication token available.");
    }

    // Build the query string based on the filters
    const genreQuery = genres.length > 0 ? `genres = (${genres.join(',')})` : '';
    const perspectiveQuery = playerPerspectives.length > 0 ? `player_perspectives = (${playerPerspectives.join(',')})` : '';
    const themeQuery = themes.length > 0 ? `themes = (${themes.join(',')})` : '';
    const modesQuery = modes.length > 0 ? `game_modes = (${modes.join(',')})` : '';
    const whereClause = [genreQuery, perspectiveQuery, themeQuery, modesQuery].filter(Boolean).join(' & ');

    // Fetch the game data from the API
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
      },
      body: `fields name, cover.url, summary, genres.name, player_perspectives.name; where ${whereClause}; limit 100;`,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    // Randomize the results
    const shuffled = data.sort(() => 0.5 - Math.random());

    // Return the first 10 games
    return shuffled.slice(0, 10);
    
  } catch (error) {
    console.error("Error fetching game data:", error);
    throw error;
  }
};