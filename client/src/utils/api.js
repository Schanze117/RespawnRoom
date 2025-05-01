export const API_BASE_URL = "https://api.igdb.com/v4"; 
export const SERVER_URL = "http://localhost:3001";

// Search for games by name
export const searchGames = async (game) => {
  try {
    // Fetch the game data from the API
    const response = await fetch(`${SERVER_URL}/api/games`, {
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

// Filter games by genre, player perspective, theme, and mode
export const filterGames = async (genres = [], playerPerspectives = [], themes = [], modes = []) => {
  try {

    // Build the query string based on the filters
    const genreQuery = genres.length > 0 ? `genres = (${genres.join(',')})` : '';
    const perspectiveQuery = playerPerspectives.length > 0 ? `player_perspectives = (${playerPerspectives.join(',')})` : '';
    const themeQuery = themes.length > 0 ? `themes = (${themes.join(',')})` : '';
    const modesQuery = modes.length > 0 ? `game_modes = (${modes.join(',')})` : '';
    const whereClause = [genreQuery, perspectiveQuery, themeQuery, modesQuery].filter(Boolean).join(' & ');

    const response = await fetch(`${SERVER_URL}/api/games`, {
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

// Get trending games
export const getTrendingGames = async () => {
  try {
    // Add cache busting timestamp to prevent cached results
    const timestamp = new Date().getTime();
    const response = await fetch(`${SERVER_URL}/api/games/trending?_cb=${timestamp}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching trending games:', error);
    throw error;
  }
};

// Get latest releases
export const getLatestReleases = async () => {
  try {
    // Add cache busting timestamp to prevent cached results
    const timestamp = new Date().getTime();
    const response = await fetch(`${SERVER_URL}/api/games/latest?_cb=${timestamp}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching latest releases:', error);
    throw error;
  }
};

// Get top rated games
export const getTopRatedGames = async () => {
  try {
    // Add cache busting timestamp to prevent cached results
    const timestamp = new Date().getTime();
    const response = await fetch(`${SERVER_URL}/api/games/top-rated?_cb=${timestamp}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching top rated games:', error);
    throw error;
  }
};

// Get upcoming games
export const getUpcomingGames = async () => {
  try {
    // Add cache busting timestamp to prevent cached results
    const timestamp = new Date().getTime();
    const response = await fetch(`${SERVER_URL}/api/games/upcoming?_cb=${timestamp}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    throw error;
  }
};

// Get game by ID
export const getGameById = async (id) => {
  try {
    // Add cache busting timestamp to prevent cached results
    const timestamp = new Date().getTime();
    const response = await fetch(`${SERVER_URL}/api/games/${id}?_cb=${timestamp}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching game with ID ${id}:`, error);
    throw error;
  }
};

// Get user category tokens for personalized recommendations
export const getTokens = async () => {
  try {
    console.log('Attempting to fetch user tokens from server');
    
    // Get the auth token from local storage
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.warn('No auth token found, user may not be logged in');
      return getFallbackTokens();
    }
    
    const response = await fetch(`${SERVER_URL}/api/user/tokens`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error(`Token API request failed with status ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      console.log('Using fallback tokens due to server error');
      return getFallbackTokens();
    }
    
    const data = await response.json();
    console.log('Successfully retrieved tokens from server:', data.categoryTokens);
    return data.categoryTokens || {};
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    console.log('Using fallback tokens due to error');
    return getFallbackTokens();
  }
};

// Fallback tokens function to use when server is unavailable
function getFallbackTokens() {
  console.log('Using hardcoded fallback tokens');
  return {
    "RPG": 2,
    "Action": 1,
    "Adventure": 1,
    "Third Person": 2,
    "Puzzle": 1,
    "Shooter": 1,
    "Strategy": 1,
    "_source": "fallback" // Marker to indicate these are fallback tokens
  };
}

// Update user category tokens for personalized recommendations
export const updateTokens = async (categoryTokens) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/user/tokens`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify({ categoryTokens })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating user tokens:', error);
    throw error;
  }
};

// Get personalized game recommendations based on user tokens
export const getPersonalizedGames = async () => {
  try {
    console.log('Requesting personalized games from server');
    
    // Get the auth token from local storage
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.warn('No auth token found, user may not be logged in');
      return [];
    }
    
    const response = await fetch(`${SERVER_URL}/api/games/personalized`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Handle different status codes
    if (response.status === 429) {
      console.warn('IGDB API rate limit reached (429) - using client-side fallback');
      // Return empty array so the component can use the fallback logic
      return [];
    }
    
    if (!response.ok) {
      console.error(`API request failed with status ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} personalized games from server`);
    
    // Add a default matchScore if not provided by the server
    return data.map(game => ({
      ...game,
      matchScore: game.matchScore || game.matchPercentage || 85
    }));
  } catch (error) {
    console.error('Error fetching personalized games:', error);
    throw error;
  }
};

export const getGameVideo = async (id) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/game_videos`, {
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

// Fetch all game categories in a single request
export const getAllCategorizedGames = async () => {
  try {
    // Add cache busting timestamp to prevent cached results
    const timestamp = new Date().getTime();
    const response = await fetch(`${SERVER_URL}/api/games/all-categories?_cb=${timestamp}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.allGames?.length || 0} total games with categories: `, 
      `Trending (${data.trending?.primary?.length + data.trending?.secondary?.length || 0}), `,
      `Latest (${data.latest?.primary?.length + data.latest?.secondary?.length || 0}), `,
      `Top Rated (${data.topRated?.primary?.length + data.topRated?.secondary?.length || 0}), `,
      `Upcoming (${data.upcoming?.primary?.length + data.upcoming?.secondary?.length || 0})`
    );
    return data;
  } catch (error) {
    console.error('Error fetching all categorized games:', error);
    throw error;
  }
};