export const API_BASE_URL = "https://api.igdb.com/v4"; 
export const SERVER_URL = "http://localhost:3001";

// Search for games by name with pagination
export const searchGames = async (game, page = 1, itemsPerPage = 25, filterByReviewCount = false) => {
  try {
    // Calculate offset based on page and itemsPerPage
    const offset = (page - 1) * itemsPerPage;
    
    let reviewFilterQuery = '';
    if (filterByReviewCount) {
      reviewFilterQuery = ' & (total_rating_count >= 5 | rating_count >= 5)';
    }

    // Construct the count query string
    let countQueryContent = `search "${game}"; fields id; limit 500;`;
    if (filterByReviewCount) {
      // If filtering by reviews, apply the filter to the count query.
      // Note: IGDB syntax for search + where can be tricky.
      // This attempts to count games matching the search AND the review filter.
      // A simple search might be `search "game name"; fields id; where (filter_condition); limit 500;`
      // If the search term itself is complex or contains special characters, this might need escaping.
      // For now, we assume the 'game' variable is a simple string.
      countQueryContent = `search "${game}"; fields id; where (total_rating_count >= 5 | rating_count >= 5); limit 500;`;
    } else {
      // If not filtering by reviews, just count games matching the search term.
      countQueryContent = `search "${game}"; fields id; limit 500;`;
    }
    
    // First get a count of matching games for pagination
    // Note: The count query might not perfectly reflect the review filter, leading to potentially inaccurate totalPages.
    // A more complex solution would be to make the count query also aware of the review filter, 
    // but that can be significantly more complex with IGDB's API for combined search + where.
    const countResponse = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: countQueryContent
      })
    });
    
    let totalEstimatedCount = 0;
    
    if (!countResponse.ok) {
      const errorText = await countResponse.text();
      totalEstimatedCount = itemsPerPage * 2; // Fallback if count fails
    } else {
      const countData = await countResponse.json();
      totalEstimatedCount = countData.length;
      // If count is 500, it might be capped, so we fetch actual results to refine
    }
    
    // Fetch the game data from the API with pagination and review filter
    // Let's rename mainQuery to mainQueryString for clarity before it's logged
    let mainQueryString = `search "${game}"; fields name, cover.url, summary, genres.name, player_perspectives.name, videos, websites, rating, total_rating, aggregated_rating, rating_count, total_rating_count; limit ${itemsPerPage}; offset ${offset}`;

    if (filterByReviewCount) {
      mainQueryString += '; where (total_rating_count >= 5 | rating_count >= 5)';
    }
    mainQueryString += ';'; // Ensure the query string properly ends with a semicolon

    const response = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: mainQueryString // Use the corrected query string
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText}. Details: ${errorText}`);
    }
    
    const games = await response.json();

    // Refine totalEstimatedCount if the initial count was capped at 500 and this is the first page
    if (totalEstimatedCount === 500 && page === 1 && games.length < itemsPerPage && filterByReviewCount) {
        // If fewer than itemsPerPage results on page 1 with filter, assume this is all there is.
        // This is a heuristic and might not be perfect for large datasets.
        totalEstimatedCount = games.length;
    } else if (filterByReviewCount && games.length < itemsPerPage && page === 1) {
        // If the count was less than 500 but we still get fewer than itemsPerPage, that's the total
        totalEstimatedCount = games.length;
    } else if (filterByReviewCount && games.length === 0 && page > 1) {
        // If we get no games on a subsequent page with the filter, the previous page was the last.
        totalEstimatedCount = (page - 1) * itemsPerPage;
    }


    return {
      games,
      pagination: {
        totalItems: totalEstimatedCount,
        totalPages: Math.max(1, Math.ceil(totalEstimatedCount / itemsPerPage)),
        currentPage: page,
        itemsPerPage
      }
    };
    
  } catch (error) {
    throw error; // Re-throw the original error or a new one wrapping it
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
    throw error;
  }
}

// Filter games by genre, player perspective, theme, and mode
export const filterGames = async (genres = [], playerPerspectives = [], themes = [], modes = [], page = 1, itemsPerPage = 25, filterByReviewCount = false) => {
  try {
    // Build the query string based on the filters using AND logic within each category type
    const genreQuery = genres.length > 0 ? genres.map(g => `genres = (${g})`).join(' & ') : '';
    const perspectiveQuery = playerPerspectives.length > 0 ? playerPerspectives.map(p => `player_perspectives = (${p})`).join(' & ') : '';
    const themeQuery = themes.length > 0 ? themes.map(t => `themes = (${t})`).join(' & ') : '';
    const modesQuery = modes.length > 0 ? modes.map(m => `game_modes = (${m})`).join(' & ') : '';
    
    // Join the different category types with AND logic
    let whereClause = [genreQuery, perspectiveQuery, themeQuery, modesQuery].filter(Boolean).join(' & ');

    if (filterByReviewCount) {
      const reviewFilter = '(total_rating_count >= 5 | rating_count >= 5)';
      if (whereClause) {
        whereClause += ` & ${reviewFilter}`;
      } else {
        whereClause = reviewFilter;
      }
    }
    
    if (!whereClause) { // If no filters are applied, it's problematic for a 'where only' query
        whereClause = 'id != null'; // Default to a condition that's always true if no other filters
    }

    // Calculate offset based on page and itemsPerPage
    const offset = (page - 1) * itemsPerPage;

    // Count query with all filters
    const countResponse = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `fields id; where ${whereClause}; limit 500;` // Max limit for count estimation
      }),
    });

    let totalEstimatedCount = 0;
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      totalEstimatedCount = countData.length;
    } else {
      totalEstimatedCount = itemsPerPage * 2; // Fallback
    }

    // Then get the actual page of games
    const mainQuery = `fields name, cover.url, summary, genres.name, player_perspectives.name, videos, rating, total_rating, aggregated_rating, rating_count, total_rating_count; where ${whereClause}; limit ${itemsPerPage}; offset ${offset};`;
    const response = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: mainQuery
      }),
    });

    const games = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    // Refine totalEstimatedCount if the initial count was capped at 500 and this is the first page
    if (totalEstimatedCount === 500 && page === 1 && games.length < itemsPerPage) {
        totalEstimatedCount = games.length;
    } else if (games.length < itemsPerPage && page === 1) {
        totalEstimatedCount = games.length;
    } else if (games.length === 0 && page > 1) {
        totalEstimatedCount = (page - 1) * itemsPerPage;
    }

    return {
      games,
      pagination: {
        totalItems: totalEstimatedCount,
        totalPages: Math.max(1, Math.ceil(totalEstimatedCount / itemsPerPage)),
        currentPage: page,
        itemsPerPage
      }
    };
    
  } catch (error) {
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
    throw error;
  }
};

// Get game by ID
export const getGameById = async (id) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Ensure all relevant rating fields are fetched
      body: JSON.stringify({
        content: `fields name, cover.url, summary, genres.name, player_perspectives.name, screenshots.url, videos.video_id, websites.url, release_dates.human, aggregated_rating, aggregated_rating_count, rating, rating_count, total_rating, total_rating_count, similar_games.name, similar_games.cover.url, storyline, themes.name, game_modes.name; where id = ${id};`
      })
    });
    const game = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    // Since we expect a single game, return the first element of the array
    return game.length > 0 ? game[0] : null;
    
  } catch (error) {
    throw error;
  }
};

// Get user category tokens for personalized recommendations
export const getTokens = async () => {
  try {
    
    // Get the auth token from local storage
    const token = localStorage.getItem('jwtToken');
    if (!token) {
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
      const errorText = await response.text();
      return getFallbackTokens();
    }
    
    const data = await response.json();
    return data.categoryTokens || {};
  } catch (error) {
    return getFallbackTokens();
  }
};

// Fallback tokens function to use when server is unavailable
function getFallbackTokens() {
  // For production, we should log this failure for monitoring
  // but still provide a minimal implementation that won't break the application
  
  // In production, you would add proper logging here like:
  // logger.warn('Failed to fetch user tokens from server, using empty tokens');
  
  return {
    "_source": "empty", 
    // Return an empty object with a source marker
    // This will trigger the app to show the appropriate UI for users without preferences
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
    throw error;
  }
};

// Get personalized game recommendations based on user tokens
export const getPersonalizedGames = async () => {
  try {
    
    // Get the auth token from local storage
    const token = localStorage.getItem('jwtToken');
    if (!token) {
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
      // Return empty array so the component can use the fallback logic
      return [];
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Add a default matchScore if not provided by the server
    return data.map(game => ({
      ...game,
      matchScore: game.matchScore || game.matchPercentage || (game.rating ? Math.min(95, Math.round(game.rating)) : 75)
    }));
  } catch (error) {
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
    throw error;
  }
};

// Helper to get game data for multiple IDs
export const getGamesByIds = async (ids) => {
  if (!ids || ids.length === 0) {
    return [];
  }
  try {
    const response = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `fields name, cover.url, summary, genres.name, player_perspectives.name, rating, total_rating, aggregated_rating, rating_count, total_rating_count; where id = (${ids.join(',')}); limit ${ids.length};`
      })
    });
    const games = await response.json();
    if (!response.ok) {
      throw new Error(`API Error fetching games by IDs: ${response.statusText}`);
    }
    return games;
  } catch (error) {
    return []; // Return empty array on error
  }
};