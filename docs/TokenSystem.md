# Token-Based Recommendation System

## Overview

The RespawnRoom application uses a token-based system to track user preferences and generate personalized game recommendations. This document explains how the token system works and how it's implemented.

## Key Concepts

### What are Tokens?

Tokens are numerical values assigned to game categories (genres, perspectives, themes) that represent a user's interest level in each category. For example:

```json
{
  "RPG": 2.5,
  "Action": 1.8,
  "Third Person": 3.2,
  "Puzzle": 0.7
}
```

In this example, the user has shown the strongest preference for "Third Person" games, followed by "RPG" games.

### Token Collection

Tokens are collected automatically when users interact with games:

1. **Saving Games**: When a user saves a game to their profile, tokens for all categories associated with that game increase
2. **Rating Games**: (Future feature) When a user rates a game highly, relevant category tokens increase more significantly

### Token Lifecycle

Tokens have a natural lifecycle to ensure recommendations stay relevant:

1. **Creation**: New tokens are created when a user first interacts with a category
2. **Growth**: Token values increase as the user shows more interest in the category
3. **Decay**: Token values decrease gradually over time (by default 10% every 24 hours) to prioritize recent interests
4. **Removal**: Tokens below a minimum threshold (0.1) are removed from the profile

## Implementation

### Storage Model

Tokens are stored in the User model:

```javascript
// Simplified User model schema
{
  userName: String,
  email: String,
  savedGames: Array,
  categoryTokens: Map  // Key-value pairs of category names and token values
}
```

The `categoryTokens` field is a Map structure to allow efficient updates and lookups.

### Token Management Functions

The `UserProfileManager` in `client/src/utils/userProfile.js` provides these key functions:

#### Get Profile Tokens

```javascript
async getProfileTokens() {
  // Fetches tokens from server
  const tokens = await getTokens();
  
  // Normalizes tokens to handle case sensitivity
  const normalizedTokens = { _source: tokens._source || 'unknown' };
  
  Object.entries(tokens).forEach(([key, value]) => {
    // Normalization logic...
  });
  
  return normalizedTokens;
}
```

This function retrieves tokens from the server and normalizes them to handle case sensitivity issues between different data sources.

#### Update Profile Tokens

```javascript
async updateProfileTokens(game) {
  // Extract categories from game
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
}
```

This function extracts categories from a game, increases their token values, and saves the updated tokens to the server.

#### Decay Tokens

```javascript
async decayTokens() {
  const currentTokens = await this.getProfileTokens();
  
  // Skip decay if no tokens exist
  if (Object.keys(currentTokens).length === 0) {
    return currentTokens;
  }
  
  // Apply exponential decay to all tokens
  const decayedTokens = {};
  const decayFactor = 0.9;  // 10% decay
  
  Object.keys(currentTokens).forEach(category => {
    // Apply decay
    const newValue = currentTokens[category] * decayFactor;
    
    // Only keep tokens above a minimum threshold
    if (newValue >= 0.1) {
      decayedTokens[category] = newValue;
    }
  });
  
  // Save decayed tokens
  await updateTokens(decayedTokens);
  
  return decayedTokens;
}
```

This function applies a decay factor to all token values, ensuring that preferences gradually fade if not reinforced by new interactions.

### Server-Side Implementation

On the server side, tokens are managed in `server/src/routes/api/userRoutes.js`:

#### GET /api/user/tokens

```javascript
router.get('/tokens', authenticateToken, async (req, res) => {
  // Get user from authenticated request
  const userId = req.user._id;
  
  // Find the user
  const user = await User.findById(userId);
  
  // Apply token decay if needed
  await user.decayTokens();
  
  // Check if user has saved games but no tokens
  if (user.savedGames && user.savedGames.length > 0 && 
      (!user.categoryTokens || user.categoryTokens.size === 0)) {
    // Generate tokens from saved games
    for (const game of user.savedGames) {
      await user.updateCategoryTokens(game);
    }
    await user.save();
  }
  
  // Convert Map to Object for response
  const categoryTokens = {
    _source: 'server'
  };
  
  user.categoryTokens.forEach((value, key) => {
    categoryTokens[key] = value;
  });
  
  return res.json({ categoryTokens });
});
```

This endpoint retrieves the user's category tokens, applies decay if needed, and ensures tokens exist if the user has saved games.

#### PUT /api/user/tokens

```javascript
router.put('/tokens', authenticateToken, async (req, res) => {
  // Get user from authenticated request
  const userId = req.user._id;
  const { categoryTokens } = req.body;
  
  // Find the user
  const user = await User.findById(userId);
  
  // Update category tokens
  Object.entries(categoryTokens).forEach(([category, value]) => {
    user.categoryTokens.set(category, value);
  });
  
  // Save the updated user
  await user.save();
  
  return res.json({ message: 'Category tokens updated successfully' });
});
```

This endpoint updates the user's category tokens with values provided in the request body.

### User Model Methods

The User model (`server/src/models/users.js`) includes these methods for token management:

#### updateCategoryTokens

```javascript
userSchema.methods.updateCategoryTokens = async function(game) {
  // Initialize categoryTokens if it doesn't exist
  if (!this.categoryTokens) {
    this.categoryTokens = new Map();
  }
  
  // Extract categories from game
  const categories = [
    ...(game.genres || []).map(genre => typeof genre === 'string' ? genre : genre.name),
    ...(game.playerPerspectives || []).map(perspective => typeof perspective === 'string' ? perspective : perspective.name)
  ];
  
  // Update token counts
  categories.forEach(category => {
    if (category) {
      const currentValue = this.categoryTokens.get(category) || 0;
      this.categoryTokens.set(category, currentValue + 1);
    }
  });
};
```

This method extracts categories from a game and updates the corresponding token values in the user's profile.

#### decayTokens

```javascript
userSchema.methods.decayTokens = async function() {
  // Skip if no tokens
  if (!this.categoryTokens || this.categoryTokens.size === 0) {
    return;
  }
  
  const decayFactor = 0.9;  // 10% decay
  const toRemove = [];
  
  // Apply decay to each token
  this.categoryTokens.forEach((value, key) => {
    const newValue = value * decayFactor;
    
    if (newValue < 0.1) {
      // Queue for removal if below threshold
      toRemove.push(key);
    } else {
      // Update with decayed value
      this.categoryTokens.set(key, newValue);
    }
  });
  
  // Remove tokens below threshold
  toRemove.forEach(key => {
    this.categoryTokens.delete(key);
  });
};
```

This method applies a decay factor to all token values and removes any that fall below the minimum threshold.

## Using Tokens for Recommendations

### Scoring Process

The recommendation scoring process uses tokens to calculate how well a game matches a user's preferences:

1. For each game, extract all categories (genres, perspectives, themes)
2. For each category, check if the user has a matching token
3. If a match exists, add the token value to the game's score
4. Convert the raw score to a percentage (typically dividing by 3 and capping at 99%)
5. Sort games by their scores to rank recommendations

```javascript
// Score calculation pseudocode
function calculateScore(game, userTokens) {
  let score = 0;
  
  // Extract all game categories
  const gameCategories = [
    ...game.genres.map(g => g.name),
    ...game.playerPerspectives.map(p => p.name)
  ];
  
  // Add up matching token values
  gameCategories.forEach(category => {
    if (userTokens[category]) {
      score += userTokens[category];
    }
  });
  
  // Convert to percentage
  return Math.min(Math.round((score / 3) * 100), 99);
}
```

### Match Percentage Display

The calculated score is displayed to users as a "Match" percentage, indicating how well the game aligns with their preferences:

- 90-99%: Strong match with user preferences
- 70-89%: Good match with user preferences
- 50-69%: Moderate match with user preferences
- Below 50%: Weak match, but may still be interesting

## Benefits of the Token System

1. **Adaptive**: Recommendations adjust automatically as user preferences change
2. **Balanced**: Decay mechanism ensures a mix of established interests and new suggestions
3. **Transparent**: Match percentages help users understand why games are recommended
4. **Resilient**: Token-based scoring works even with limited data about games
5. **Efficient**: Can be computed client-side when server-side processing is unavailable

## Future Improvements

1. **Negative Tokens**: Track categories users explicitly dislike to improve filtering
2. **Weighted Categories**: Assign different importance to genres vs. perspectives
3. **Social Tokens**: Incorporate friend recommendations into token values
4. **Context Awareness**: Apply different token weights based on user's current mood or session type 