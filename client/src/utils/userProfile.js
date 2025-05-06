import { getTokens, updateTokens } from './api';

// Last decay timestamp
let lastDecayTime = 0;
const DECAY_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Token management for user preferences
export const UserProfileManager = {
  // Initialize or get tokens from server
  async getProfileTokens() {
    try {
      const tokens = await getTokens();
      
      // Handle case-sensitive tokens - normalize cases for matching
      // Server might return "Third person" while game data has "Third Person"
      const normalizedTokens = { _source: tokens._source || 'unknown' };
      
      Object.entries(tokens).forEach(([key, value]) => {
        if (key === '_source') return; // Skip source marker
        
        // Convert keys to lowercase for normalized comparison with game genres/perspectives
        // However, keep original case for display
        const normalizedKey = key.toLowerCase();
        normalizedTokens[key] = value; // Keep original for display
        
        // Also add lowercase version for matching
        if (normalizedKey !== key) {
          normalizedTokens[normalizedKey] = value;
        }
        
        // Special cases for common genre/perspective variations
        if (normalizedKey === 'third person') {
          normalizedTokens['Third Person'] = value;
          normalizedTokens['Third-Person'] = value;
        }
        else if (normalizedKey === 'first person') {
          normalizedTokens['First Person'] = value;
          normalizedTokens['First-Person'] = value;
        }
      });
      
      return normalizedTokens;
    } catch (error) {
      console.error('Error fetching user profile tokens:', error);
      return {};
    }
  },

  // Update tokens when a game is saved
  async updateProfileTokens(game) {
    try {
      // Extract categories from the game
      const categories = [
        ...(game.genres || []).map(genre => typeof genre === 'string' ? genre : genre.name),
        ...(game.playerPerspectives || []).map(perspective => typeof perspective === 'string' ? perspective : perspective.name)
      ];
      
      // Get current tokens
      const currentTokens = await this.getProfileTokens();
      
      // Update token counts
      const updatedTokens = {...currentTokens};
      
      categories.forEach(category => {
        if (category) {
          updatedTokens[category] = (updatedTokens[category] || 0) + 1;
        }
      });
      
      // Save updated tokens
      await updateTokens(updatedTokens);
      
      // Check if decay should be applied
      await this.checkAndApplyDecay();
      
      return updatedTokens;
    } catch (error) {
      console.error('Error updating user profile tokens:', error);
      throw error;
    }
  },
  
  // Check if decay should be applied based on time interval
  async checkAndApplyDecay() {
    const now = Date.now();
    
    // Only decay if sufficient time has passed since last decay
    if (now - lastDecayTime > DECAY_INTERVAL) {
      await this.decayTokens();
      lastDecayTime = now;
    }
  },
  
  // Apply decay to tokens (multiply by 0.9)
  async decayTokens() {
    try {
      const currentTokens = await this.getProfileTokens();
      
      // Skip decay if no tokens exist
      if (Object.keys(currentTokens).length === 0) {
        return currentTokens;
      }
      
      // Apply exponential decay to all tokens
      const decayedTokens = {};
      const decayFactor = 0.9;
      
      Object.keys(currentTokens).forEach(category => {
        // Apply decay
        const newValue = currentTokens[category] * decayFactor;
        
        // Only keep tokens above a minimum threshold
        if (newValue >= 0.1) {
          decayedTokens[category] = newValue;
        }
      });
      
      // Save decayed tokens if any changes occurred
      if (Object.keys(decayedTokens).length > 0) {
        await updateTokens(decayedTokens);
      }
      
      return decayedTokens;
    } catch (error) {
      console.error('Error decaying tokens:', error);
      throw error;
    }
  },
  
  // Vectorize a game for similarity comparison
  vectorizeGame(game) {
    // Create a sparse vector representation based on categories
    const vector = {};
    
    // Add genre dimensions
    if (game.genres) {
      game.genres.forEach(genre => {
        const genreName = typeof genre === 'string' ? genre : genre.name;
        if (genreName) {
          vector[genreName] = 1;
        }
      });
    }
    
    // Add player perspective dimensions
    if (game.playerPerspectives) {
      game.playerPerspectives.forEach(perspective => {
        const perspectiveName = typeof perspective === 'string' ? perspective : perspective.name;
        if (perspectiveName) {
          vector[perspectiveName] = 1;
        }
      });
    }
    
    return vector;
  },
  
  // Calculate similarity score between user profile and game
  calculateSimilarity(game, userTokens) {
    // Get game vector
    const gameVector = this.vectorizeGame(game);
    
    // Calculate dot product for similarity
    let similarityScore = 0;
    
    // For each category in the game
    Object.keys(gameVector).forEach(category => {
      // If the user has a preference for this category
      if (userTokens[category]) {
        // Weighted dot product
        similarityScore += gameVector[category] * userTokens[category];
      }
    });
    
    return similarityScore;
  }
};

// Algorithm to get personalized recommendations
export async function getPersonalizedRecommendations(candidateGames, alpha = 2) {
  try {
    // Get user profile tokens
    const userTokens = await UserProfileManager.getProfileTokens();
    
    // Skip if user has no tokens
    if (Object.keys(userTokens).length === 0) {
      return [];
    }
    
    // Calculate similarity scores for each game
    const scoredGames = candidateGames.map(game => ({
      ...game,
      similarityScore: UserProfileManager.calculateSimilarity(game, userTokens)
    }));
    
    // Sort by similarity score
    const sortedGames = scoredGames.sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Take top N games (e.g., top 20)
    const topN = sortedGames.slice(0, 20);
    
    // Apply weighting with exponent alpha
    const totalWeight = topN.reduce((sum, game) => {
      const weight = Math.pow(Math.max(game.similarityScore, 0.1), alpha);
      return sum + weight;
    }, 0);
    
    // If no significant weights, return empty results
    if (totalWeight <= 0) {
      return [];
    }
    
    // Sample based on weights
    const selectedGames = [];
    const numToSelect = Math.min(8, topN.length);
    
    // Select games based on weighted probability
    for (let i = 0; i < numToSelect; i++) {
      let randomValue = Math.random() * totalWeight;
      let cumulativeWeight = 0;
      
      // Find game based on random weighted selection
      for (const game of topN) {
        if (selectedGames.includes(game)) continue;
        
        const weight = Math.pow(Math.max(game.similarityScore, 0.1), alpha);
        cumulativeWeight += weight;
        
        if (cumulativeWeight >= randomValue) {
          selectedGames.push(game);
          break;
        }
      }
    }
    
    return selectedGames;
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    throw error;
  }
} 