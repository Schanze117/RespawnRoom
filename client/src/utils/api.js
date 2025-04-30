const API_BASE_URL = "https://api.igdb.com/v4"; 

// Search for games by name
export const searchGames = async (game) => {
  try {
    // Fetch the game data from the API
    const response = await fetch(`/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `search "${game}"; fields name, cover.url, summary, genres.name, player_perspectives.name, videos, websites; limit 10;`
      })
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

export const getGameVideo = async (id) => {
  try {
    const response = await fetch(`/api/game_videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `fields checksum,game,name,video_id; where id = (${id});`
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return data;
  }
  catch (error) {
    console.error("Error fetching game video data:", error);
    throw error;
  }
}

// Filter games by genre, player perspective, theme, and mode
export const filterGames = async (genres = [], playerPerspectives = [], themes = [], modes = []) => {
  try {

    // Build the query string based on the filters
    const genreQuery = genres.length > 0 ? `genres = (${genres.join(',')})` : '';
    const perspectiveQuery = playerPerspectives.length > 0 ? `player_perspectives = (${playerPerspectives.join(',')})` : '';
    const themeQuery = themes.length > 0 ? `themes = (${themes.join(',')})` : '';
    const modesQuery = modes.length > 0 ? `game_modes = (${modes.join(',')})` : '';
    const whereClause = [genreQuery, perspectiveQuery, themeQuery, modesQuery].filter(Boolean).join(' & ');

    const response = await fetch(`/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content:  `fields name, cover.url, summary, genres.name, player_perspectives.name, videos; where ${whereClause}; limit 100;`
      }),
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