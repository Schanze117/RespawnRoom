// API Configuration
export const API_BASE_URL = import.meta.env.VITE_IGDB_API_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_IGDB_API_URL is not configured');
}
export const SERVER_URL = import.meta.env.VITE_API_URL;
export const IGDB_IMAGE_URL = import.meta.env.VITE_IGDB_IMAGE_URL;
if (!IGDB_IMAGE_URL) {
  throw new Error('VITE_IGDB_IMAGE_URL is not configured');
}

//

// Format image URLs
export const getOptimizedImageUrl = (url, size = "t_720p") => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  
  // Handle URLs that might come with or without the cover ID format
  const imageId = url.includes("/") ? url.split("/")[1] : url;
  return `${IGDB_IMAGE_URL}/${size}/${imageId}`;
};

/**
 * Get trending games from the API
 */
export async function getTrendingGames() {
  try {
    // Add a timestamp for cache busting
    const timestamp = Date.now();
    const url = `${SERVER_URL}/api/games/trending?_cb=${timestamp}`;
    const method = 'GET';
    const headers = {
      'Content-Type': 'application/json',
    };
    
    
    const response = await fetch(url, {
      method,
      headers,
    });
    
    
    if (!response.ok) {
      throw new Error('Error fetching trending games');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return [];
  }
}

/**
 * Get latest releases from the API
 */
export async function getLatestReleases() {
  try {
    // Add a timestamp for cache busting
    const timestamp = Date.now();
    const response = await fetch(`${SERVER_URL}/api/games/latest?_cb=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching latest releases');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return [];
  }
}

/**
 * Get top rated games from the API
 */
export async function getTopRatedGames() {
  try {
    // Add a timestamp for cache busting
    const timestamp = Date.now();
    const response = await fetch(`${SERVER_URL}/api/games/top-rated?_cb=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching top rated games');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return [];
  }
}

/**
 * Get upcoming games from the API
 */
export async function getUpcomingGames() {
  try {
    // Add a timestamp for cache busting
    const timestamp = Date.now();
    const response = await fetch(`${SERVER_URL}/api/games/upcoming?_cb=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching upcoming games');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return [];
  }
}

/**
 * Get a game by its ID
 */
export async function getGameById(id) {
  try {
    const response = await fetch(`${SERVER_URL}/api/games/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching game with ID ${id}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Get game video by game ID
 */
export async function getGameVideo(id) {
  try {
    const content = `
      fields video_id, game, name;
      where game = ${id};
      limit 10;
    `;

    const response = await fetch(`${SERVER_URL}/api/game_videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Error fetching videos for game with ID ${id}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return [];
  }
}

/**
 * Search games by name
 */
export async function searchGames(query, page = 1, limit = 50, requireReviews = false) {
  try {
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build search query with optional review filter
    let content = `
      fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id;
      search "${query}";
    `;
    
    // Add review filter if required
    if (requireReviews) {
      content += `
        where rating_count >= 5;
      `;
    }
    
    content += `
      limit ${limit};
      offset ${offset};
    `;

    const response = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error searching games');
    }

    const data = await response.json();
    
    // Ensure data is always an array
    const games = Array.isArray(data) ? data : [];
    
    // For search results, we return the games directly with pagination info
    // The frontend expects this format based on searchForm.jsx
    return {
      games: games,
      pagination: {
        totalItems: games.length, // This is approximate since IGDB doesn't give total count
        totalPages: games.length === limit ? page + 1 : page, // Estimate if there are more pages
        currentPage: page,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    console.error('Search games error:', error);
    // Return a valid structure instead of throwing to prevent .length errors
    return {
      games: [],
      pagination: {
        totalItems: 0,
        totalPages: 1,
        currentPage: page,
        itemsPerPage: limit
      }
    };
  }
}

/**
 * Filter games by genre, perspective, themes, and modes
 */
export async function filterGames(
  genres = [],
  perspectives = [],
  themes = [],
  modes = [],
  page = 1,
  limit = 25,
  requireReviews = false
) {
  try {
    // Build the where clauses for the query
    const whereConditions = [];
    
    // Add genre filter if any genres are selected
    if (genres && genres.length > 0) {
      const genreIds = genres.map(g => parseInt(g));
      whereConditions.push(`genres = (${genreIds.join(',')})`);
    }
    
    // Add player perspective filter if any are selected
    if (perspectives && perspectives.length > 0) {
      const perspectiveIds = perspectives.map(p => parseInt(p));
      whereConditions.push(`player_perspectives = (${perspectiveIds.join(',')})`);
    }
    
    // Add themes filter if any are selected
    if (themes && themes.length > 0) {
      const themeIds = themes.map(t => parseInt(t));
      whereConditions.push(`themes = (${themeIds.join(',')})`);
    }
    
    // Add game modes filter if any are selected
    if (modes && modes.length > 0) {
      const modeIds = modes.map(m => parseInt(m));
      whereConditions.push(`game_modes = (${modeIds.join(',')})`);
    }
    
    // Add review count filter if required
    if (requireReviews) {
      whereConditions.push(`rating_count >= 5`);
    }
    
    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;
    
    // Build the complete query
    let query = `
      fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id;
    `;
    
    // Add where clause if we have any conditions
    if (whereConditions.length > 0) {
      query += `where ${whereConditions.join(' & ')};`;
    }
    
    // Add sort, limit and offset
    query += `
      sort rating desc;
      limit ${limit};
      offset ${offset};
    `;
    
    // Build the count query to get total number of matching games
    let countQuery = `
      fields id;
    `;
    
    // Add where clause if we have any conditions
    if (whereConditions.length > 0) {
      countQuery += `where ${whereConditions.join(' & ')};`;
    }
    
    // Send the requests
    const response = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: query }),
    });
    
    const countResponse = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: countQuery }),
    });
    
    if (!response.ok || !countResponse.ok) {
      throw new Error('Error filtering games');
    }
    
    const games = await response.json();
    const countData = await countResponse.json();
    
    // Calculate total pages
    const totalItems = countData.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      games,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    return {
      games: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        itemsPerPage: limit
      }
    };
  }
}

/**
 * Get user preference tokens from the server
 */
export async function getTokens() {
  try {
    const response = await fetch(`${SERVER_URL}/api/user/tokens`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('id_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching user tokens');
    }

    const data = await response.json();
    return data.tokens || {};
  } catch (error) {
    return {};
  }
}

/**
 * Update user preference tokens
 */
export async function updateTokens(tokens) {
  try {
    const response = await fetch(`${SERVER_URL}/api/user/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('id_token')}`,
      },
      body: JSON.stringify({ tokens }),
    });

    if (!response.ok) {
      throw new Error('Error updating user tokens');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get personalized game recommendations
 */
export async function getPersonalizedGames() {
  try {
    const response = await fetch(`${SERVER_URL}/api/games/personalized`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('id_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching personalized games');
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Get all categorized games in a single API call
 */
export async function getAllCategorizedGames() {
  try {
    // Add a timestamp for cache busting
    const timestamp = Date.now();
    const response = await fetch(`${SERVER_URL}/api/games/all-categories?_cb=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching all categorized games');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}
