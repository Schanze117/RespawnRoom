export const API_BASE_URL = "https://api.igdb.com/v4"; 
export const SERVER_URL = "http://localhost:3001";

// Search for games by name with pagination
export const searchGames = async (game, page = 1, itemsPerPage = 25) => {
  try {
    // Calculate offset based on page and itemsPerPage
    const offset = (page - 1) * itemsPerPage;
    
    // First get a count of matching games for pagination
    const countResponse = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `search "${game}"; fields id; limit 500;`
      })
    });
    
    let totalEstimatedCount = 0;
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      totalEstimatedCount = countData.length;
    } else {
      // If count request fails, assume a reasonable number
      totalEstimatedCount = 100;
    }
    
    // Fetch the game data from the API with pagination
    const response = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `search "${game}"; fields name, cover.url, summary, genres.name, player_perspectives.name, videos, websites; limit ${itemsPerPage}; offset ${offset};`
      })
    });
    
    const games = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    // If we got fewer games than requested and we're on the first page,
    // assume this is the actual total count
    if (games.length < itemsPerPage && page === 1) {
      totalEstimatedCount = games.length;
    }

    // If we're on a page beyond the first and got no results,
    // adjust the estimated count to match what we've seen
    if (games.length === 0 && page > 1) {
      totalEstimatedCount = (page - 1) * itemsPerPage;
    }

    return {
      games,
      pagination: {
        totalItems: totalEstimatedCount,
        totalPages: Math.ceil(totalEstimatedCount / itemsPerPage),
        currentPage: page,
        itemsPerPage
      }
    };
    
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
export const filterGames = async (genres = [], playerPerspectives = [], themes = [], modes = [], page = 1, itemsPerPage = 25) => {
  try {
    // Build the query string based on the filters using AND logic within each category type
    const genreQuery = genres.length > 0 ? genres.map(g => `genres = (${g})`).join(' & ') : '';
    const perspectiveQuery = playerPerspectives.length > 0 ? playerPerspectives.map(p => `player_perspectives = (${p})`).join(' & ') : '';
    const themeQuery = themes.length > 0 ? themes.map(t => `themes = (${t})`).join(' & ') : '';
    const modesQuery = modes.length > 0 ? modes.map(m => `game_modes = (${m})`).join(' & ') : '';
    
    // Join the different category types with AND logic
    const whereClause = [genreQuery, perspectiveQuery, themeQuery, modesQuery].filter(Boolean).join(' & ');

    // Calculate offset based on page and itemsPerPage
    const offset = (page - 1) * itemsPerPage;

    // Instead of getting counts separately, we'll request a large batch to estimate total count
    // We'll request a maximum of 500 games to get a reasonable estimate of the total
    const countResponse = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `fields id; where ${whereClause}; limit 500;`
      }),
    });

    let totalEstimatedCount = 0;
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      totalEstimatedCount = countData.length;
    } else {
      // If count request fails, assume a reasonable number
      totalEstimatedCount = 100;
    }

    // Then get the actual page of games
    const response = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `fields name, cover.url, summary, genres.name, player_perspectives.name, videos; where ${whereClause}; limit ${itemsPerPage}; offset ${offset};`
      }),
    });

    const games = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    // If we got fewer games than requested and we're on the first page,
    // assume this is the actual total count
    if (games.length < itemsPerPage && page === 1) {
      totalEstimatedCount = games.length;
    }

    // If we're on a page beyond the first and got no results,
    // adjust the estimated count to match what we've seen
    if (games.length === 0 && page > 1) {
      totalEstimatedCount = (page - 1) * itemsPerPage;
    }

    return {
      games,
      pagination: {
        totalItems: totalEstimatedCount,
        totalPages: Math.ceil(totalEstimatedCount / itemsPerPage),
        currentPage: page,
        itemsPerPage
      }
    };
    
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
      return getFallbackTokens();
    }
    
    const data = await response.json();
    return data.categoryTokens || {};
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return getFallbackTokens();
  }
};

// Fallback tokens function to use when server is unavailable
function getFallbackTokens() {
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
    return data;
  } catch (error) {
    console.error('Error fetching all categorized games:', error);
    throw error;
  }
};