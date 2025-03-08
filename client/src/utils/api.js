const API_BASE_URL = "/api"; 

export const searchGames = async (game) => {
  try {
    const token = import.meta.env.VITE_ACCESS_TOKEN;
    const clientId = import.meta.env.VITE_CLIENT_ID;

    if (!token) {
      throw new Error("No valid authentication token available.");
    }
    
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

export const filterGames = async (genres = [], playerPerspectives = []) => {
  try {
    const token = import.meta.env.VITE_ACCESS_TOKEN;
    const clientId = import.meta.env.VITE_CLIENT_ID;

    if (!token) {
      throw new Error("No valid authentication token available.");
    }

    const genreQuery = genres.length > 0 ? `genres = (${genres.join(',')})` : '';
    console.log("genreQuery", genreQuery);
    const perspectiveQuery = playerPerspectives.length > 0 ? `player_perspectives = (${playerPerspectives.join(',')})` : '';
    const whereClause = [genreQuery, perspectiveQuery].filter(Boolean).join(' & ');

    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
      },
      body: `fields name, cover.url, summary, genres.name, player_perspectives.name; where ${whereClause};`,
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