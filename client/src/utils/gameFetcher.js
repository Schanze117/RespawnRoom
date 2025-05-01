import { API_BASE_URL, getTrendingGames, getLatestReleases, getTopRatedGames, getUpcomingGames, getGameById, getAllCategorizedGames as apiGetAllCategorizedGames } from './api';

// IGDB ID for our featured game
const FEATURED_GAME_ID = 238532;

// Store already displayed game IDs to prevent duplicates across sections
let displayedGameIds = new Set();

// Store categorized games for reuse
let cachedCategorizedGames = null;

/**
 * Resets the tracking of displayed games
 */
export function resetDisplayedGames() {
  console.log(`🧹 Clearing displayed games tracking. Before: ${displayedGameIds.size} games tracked`);
  displayedGameIds.clear();
  // Make sure the set is actually cleared
  if (displayedGameIds.size > 0) {
    console.warn('⚠️ Failed to clear displayedGameIds, forcing a new Set');
    displayedGameIds = new Set();
  }
  // Clear cached data to force fresh fetches
  cachedCategorizedGames = null;
  console.log(`🧹 Cleared displayed games tracking. After: ${displayedGameIds.size} games tracked`);
}

/**
 * Gets all categorized games in a single API call
 */
export async function getAllCategorizedGames() {
  try {
    // Use cached data if available, otherwise fetch from API
    if (cachedCategorizedGames) {
      console.log('📦 Using cached categorized games data');
      return cachedCategorizedGames;
    }

    console.log('🔍 Fetching all categorized games from API...');
    
    // Get categorized games from API
    try {
      const categorizedGames = await apiGetAllCategorizedGames();
      
      // Cache the results for future use
      cachedCategorizedGames = categorizedGames;
      
      // Add featured game ID to the tracking set
      displayedGameIds.add(FEATURED_GAME_ID);
      
      // Add all displayed games to tracking set
      if (categorizedGames.trending) {
        [...categorizedGames.trending.primary, ...categorizedGames.trending.secondary].forEach(game => {
          if (game && game.id) displayedGameIds.add(game.id);
        });
      }
      
      if (categorizedGames.latest) {
        [...categorizedGames.latest.primary, ...categorizedGames.latest.secondary].forEach(game => {
          if (game && game.id) displayedGameIds.add(game.id);
        });
      }
      
      if (categorizedGames.topRated) {
        [...categorizedGames.topRated.primary, ...categorizedGames.topRated.secondary].forEach(game => {
          if (game && game.id) displayedGameIds.add(game.id);
        });
      }
      
      if (categorizedGames.upcoming) {
        [...categorizedGames.upcoming.primary, ...categorizedGames.upcoming.secondary].forEach(game => {
          if (game && game.id) displayedGameIds.add(game.id);
        });
      }
      
      console.log('✅ Successfully fetched and processed categorized games');
      return categorizedGames;
    } catch (error) {
      console.error('Error with unified endpoint, falling back to individual API calls:', error);
      
      // Fallback to individual API calls if the unified endpoint fails
      console.log('🔄 Falling back to individual API calls...');
      
      // Make all API calls in parallel
      const [trending, latest, topRated, upcoming] = await Promise.all([
        getTrendingGames().catch(err => {
          console.error('Failed to fetch trending games:', err);
          return [];
        }),
        getLatestReleases().catch(err => {
          console.error('Failed to fetch latest games:', err);
          return [];
        }),
        getTopRatedGames().catch(err => {
          console.error('Failed to fetch top rated games:', err);
          return [];
        }),
        getUpcomingGames().catch(err => {
          console.error('Failed to fetch upcoming games:', err);
          return [];
        })
      ]);
      
      console.log(`📊 Fallback API calls returned: Trending (${trending.length}), Latest (${latest.length}), Top Rated (${topRated.length}), Upcoming (${upcoming.length})`);
      
      // Function to split games into primary and secondary
      const splitGames = (games, primaryCount = 5) => {
        // Add all games to tracking set
        games.forEach(game => {
          if (game && game.id) displayedGameIds.add(game.id);
        });
        
        return {
          primary: games.slice(0, primaryCount),
          secondary: games.slice(primaryCount, primaryCount + 10)
        };
      };
      
      // Create categorized object manually
      const manualCategorizedGames = {
        trending: splitGames(trending),
        latest: splitGames(latest),
        topRated: splitGames(topRated),
        upcoming: splitGames(upcoming),
        allGames: [...trending, ...latest, ...topRated, ...upcoming]
      };
      
      // Cache the results
      cachedCategorizedGames = manualCategorizedGames;
      
      return manualCategorizedGames;
    }
  } catch (error) {
    console.error('Error fetching all categorized games:', error);
    // Return empty data structure on error
    return {
      trending: { primary: [], secondary: [] },
      latest: { primary: [], secondary: [] },
      topRated: { primary: [], secondary: [] },
      upcoming: { primary: [], secondary: [] },
      allGames: []
    };
  }
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
    
    // Debug log the number of games received
    console.log(`📊 Received ${games?.length || 0} trending games from API`);
    
    // Handle empty response from API
    if (!games || games.length === 0) {
      console.warn('No trending games returned from API');
      return { primary: [], secondary: [] };
    }
    
    // Filter out games already displayed elsewhere (including our featured game)
    const availableGames = games.filter(game => !displayedGameIds.has(game.id));
    console.log(`📊 After filtering, ${availableGames.length} trending games are available`);
    
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
    
    console.log(`📊 Selected ${primary.length} primary and ${secondary.length} secondary trending games`);
    
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
    console.log(`📊 Received ${games?.length || 0} latest games from API`);
    
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
    console.log(`📊 After filtering, ${availableGames.length} latest games are available`);
    
    // If we have fewer than 10 games after filtering, take what we can get
    const useCount = Math.min(15, availableGames.length);
    
    // Add some randomization - take a random subset when there are many games
    let selected;
    if (availableGames.length > useCount * 2) {
      // If we have a lot of games, pick randomly from the first portion
      const randomPool = availableGames.slice(0, useCount * 3);
      // Shuffle the pool
      const shuffled = [...randomPool].sort(() => 0.5 - Math.random());
      selected = shuffled.slice(0, useCount);
    } else {
      // Otherwise just take the top ones
      selected = availableGames.slice(0, useCount);
    }
    
    // Add these games to our tracking Set
    selected.forEach(game => displayedGameIds.add(game.id));
    
    // Split into primary and secondary groups
    const primaryCount = Math.min(5, Math.ceil(useCount / 2));
    const primary = selected.slice(0, primaryCount);
    const secondary = selected.slice(primaryCount);
    
    console.log(`📊 Selected ${primary.length} primary and ${secondary.length} secondary latest games`);
    
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
    console.log(`📊 Received ${games?.length || 0} top-rated games from API`);
    
    // Handle empty response
    if (!games || games.length === 0) {
      console.warn('No top rated games returned from API');
      return { primary: [], secondary: [] };
    }
    
    // Filter out games already displayed elsewhere
    const availableGames = games.filter(game => !displayedGameIds.has(game.id));
    console.log(`📊 After filtering, ${availableGames.length} top-rated games are available`);
    
    // If we have fewer than 10 games after filtering, take what we can get
    const useCount = Math.min(15, availableGames.length);
    
    // Add some randomization - take a random subset from different rating tiers
    let selected;
    if (availableGames.length > useCount * 2) {
      // Create tiers of ratings to ensure variety
      const tier1 = availableGames.filter(game => (game.rating || 0) >= 95);
      const tier2 = availableGames.filter(game => (game.rating || 0) >= 90 && (game.rating || 0) < 95);
      const tier3 = availableGames.filter(game => (game.rating || 0) < 90);
      
      // Shuffle each tier
      const shuffledTier1 = [...tier1].sort(() => 0.5 - Math.random());
      const shuffledTier2 = [...tier2].sort(() => 0.5 - Math.random());
      const shuffledTier3 = [...tier3].sort(() => 0.5 - Math.random());
      
      // Take from each tier proportionally
      const tier1Count = Math.ceil(useCount * 0.4); // 40% from highest tier
      const tier2Count = Math.ceil(useCount * 0.4); // 40% from middle tier
      const tier3Count = useCount - tier1Count - tier2Count; // Remainder from lowest tier
      
      selected = [
        ...shuffledTier1.slice(0, tier1Count),
        ...shuffledTier2.slice(0, tier2Count),
        ...shuffledTier3.slice(0, tier3Count)
      ];
      
      // Final shuffle for presentation order
      selected.sort(() => 0.5 - Math.random());
    } else {
    // Shuffle the filtered games array using Fisher-Yates algorithm
    const shuffledGames = [...availableGames];
    for (let i = shuffledGames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledGames[i], shuffledGames[j]] = [shuffledGames[j], shuffledGames[i]];
    }
    
    // Extract the selected games
      selected = shuffledGames.slice(0, useCount);
    }
    
    // Add these games to our tracking Set
    selected.forEach(game => displayedGameIds.add(game.id));
    
    // Split into primary and secondary groups
    const primaryCount = Math.min(5, Math.ceil(useCount / 2));
    const primary = selected.slice(0, primaryCount);
    const secondary = selected.slice(primaryCount);
    
    console.log(`📊 Selected ${primary.length} primary and ${secondary.length} secondary top-rated games`);
    
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
    console.log(`📊 Received ${games?.length || 0} upcoming games from API`);
    
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
    console.log(`📊 After filtering, ${availableGames.length} upcoming games are available`);
    
    // If we have fewer than 10 games after filtering, take what we can get
    const useCount = Math.min(15, availableGames.length);
    
    // Add some randomization - take a mix of soon releases and later ones
    let selected;
    if (availableGames.length > useCount * 2) {
      // Get games releasing soon (first third of the data)
      const soonGames = availableGames.slice(0, Math.ceil(availableGames.length / 3));
      // Get games releasing later
      const laterGames = availableGames.slice(Math.ceil(availableGames.length / 3));
      
      // Shuffle each group
      const shuffledSoon = [...soonGames].sort(() => 0.5 - Math.random());
      const shuffledLater = [...laterGames].sort(() => 0.5 - Math.random());
      
      // Select 2/3 from soon and 1/3 from later
      const soonCount = Math.ceil(useCount * 0.67);
      const laterCount = useCount - soonCount;
      
      selected = [
        ...shuffledSoon.slice(0, soonCount),
        ...shuffledLater.slice(0, laterCount)
      ];
      
      // Sort by release date for proper display order
      selected.sort((a, b) => (a.first_release_date || 0) - (b.first_release_date || 0));
    } else {
    // Extract the selected games
      selected = availableGames.slice(0, useCount);
    }
    
    // Add these games to our tracking Set
    selected.forEach(game => displayedGameIds.add(game.id));
    
    // Split into primary and secondary groups
    const primaryCount = Math.min(5, Math.ceil(useCount / 2));
    const primary = selected.slice(0, primaryCount);
    const secondary = selected.slice(primaryCount);
    
    console.log(`📊 Selected ${primary.length} primary and ${secondary.length} secondary upcoming games`);
    
    // Return the games split into primary and secondary groups
    return { primary, secondary };
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return { primary: [], secondary: [] };
  }
} 