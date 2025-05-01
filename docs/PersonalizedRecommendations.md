# PersonalizedRecommendations Component Documentation

## Overview

The `PersonalizedRecommendations` component provides customized game suggestions based on user preferences and play history. It's a key feature of the RespawnRoom application that improves user engagement by displaying games matching the user's interests.

**File**: `client/src/components/homePage/PersonalizedRecommendations.jsx`

## How It Works

### Token-Based Recommendation System

The personalization system is based on a "token" model:

1. **Token Collection**: 
   - When users save games to their profile, the system tracks genres and perspectives (e.g., "RPG", "Third Person")
   - Each category gets a token value that increases as the user saves more games in that category
   - Tokens naturally decay over time, ensuring recommendations stay current with user preferences

2. **Token Storage**:
   - Tokens are stored in the user's profile on the server
   - Each token is a key-value pair (e.g., `{"RPG": 2, "Action": 1}`)
   - Higher values indicate stronger user preference for that category

### Multi-Tier Recommendation Strategy

The component uses a three-tier approach to ensure reliability:

#### Tier 1: Server-Side Personalization
- API call: `GET /api/user/tokens` → `GET /api/games/personalized`
- The server processes user tokens and returns ranked games
- Most efficient method when available

#### Tier 2: Client-Side Scoring of Trending Games
- API calls: `GET /api/user/tokens` → `GET /api/games/trending`
- If server recommendations fail, fetch trending games
- Score each game client-side using the token matching algorithm
- Sort by match score and display top 10

#### Tier 3: Fallback to Hardcoded Games
- Uses a small set of predefined games if all else fails
- Still scores them using actual user tokens for relevance

## Implementation Details

### Component State
```jsx
const [recommendations, setRecommendations] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [hasTokens, setHasTokens] = useState(true);
const [debugInfo, setDebugInfo] = useState(null);
const [refreshKey, setRefreshKey] = useState(0);
```

### Main Logic Flow

1. **Token Retrieval**:
   ```jsx
   // Get user tokens from server
   tokens = await UserProfileManager.getProfileTokens();
   
   // Check if user has any valid tokens
   const hasAnyTokens = Object.keys(tokens).filter(k => k !== '_source').length > 0;
   ```

2. **Server API Recommendation Attempt**:
   ```jsx
   // Try to get personalized games from server
   const personalizedGames = await getPersonalizedGames();
   
   if (personalizedGames && personalizedGames.length > 0) {
     setRecommendations(personalizedGames);
     return;
   }
   ```

3. **Trending Games Fallback**:
   ```jsx
   // Fetch trending games to score locally
   const trendingGames = await getTrendingGames();
   
   // Score games based on token matches
   const scoredGames = trendingGames.map(game => {
     let score = 0;
     const gameGenres = game.genres?.map(g => g.name) || [];
     const gamePerspectives = game.player_perspectives?.map(p => p.name) || [];
     
     [...gameGenres, ...gamePerspectives].forEach(category => {
       if (tokens[category]) {
         score += tokens[category];
       }
     });
     
     return {
       ...game,
       matchScore: score > 0 ? Math.min(Math.round((score / 3) * 100), 99) : 70
     };
   });
   
   // Sort by score and take top 10
   const sortedGames = [...scoredGames]
     .sort((a, b) => b.matchScore - a.matchScore)
     .slice(0, 10);
   ```

4. **Hardcoded Games Final Fallback**:
   ```jsx
   // Final fallback if trending games fail
   const fallbackGameData = getFallbackGames();
   
   // Still score the games using user tokens
   const scoredGames = fallbackGameData.map(game => {
     // Calculate score based on token matches
     // ...
   });
   ```

### Scoring Algorithm

The core matching algorithm works by comparing game categories to user tokens:

1. Extract all genres and perspectives from the game
2. For each category that matches a user token, add that token's value to the score
3. Convert the raw score to a percentage (capped at 99%)
4. Higher scores mean the game is more aligned with user preferences

```jsx
// Example scoring pseudocode
let score = 0;
gameCategories.forEach(category => {
  if (userTokens[category]) {
    score += userTokens[category];
  }
});

// Convert to percentage
const matchPercentage = Math.min(Math.round((score / 3) * 100), 99);
```

### Token Normalization

To handle variations in category naming across different data sources:

```jsx
// Handle case-sensitive tokens
const normalizedTokens = { _source: tokens._source || 'unknown' };

Object.entries(tokens).forEach(([key, value]) => {
  if (key === '_source') return;
  
  // Store original case
  normalizedTokens[key] = value;
  
  // Also add lowercase version
  const normalizedKey = key.toLowerCase();
  if (normalizedKey !== key) {
    normalizedTokens[normalizedKey] = value;
  }
  
  // Handle common variations
  if (normalizedKey === 'third person') {
    normalizedTokens['Third Person'] = value;
    normalizedTokens['Third-Person'] = value;
  }
});
```

## API Requests Timeline

The component makes API requests in this specific order:

1. `UserProfileManager.getProfileTokens()`
   - Internally calls `getTokens()` → `GET /api/user/tokens`
   - Authentication: JWT token in Authorization header
   - Success response: `{ categoryTokens: { "RPG": 2, "Action": 1, ... } }`
   - Time: Immediate on component mount

2. If tokens exist, then:
   - `getPersonalizedGames()` → `GET /api/games/personalized`
   - Authentication: JWT token in Authorization header
   - Time: After token retrieval completes
   - Success response: Array of game objects with match scores

3. If personalized games fail or are empty:
   - `getTrendingGames()` → `GET /api/games/trending`
   - Authentication: None required
   - Time: After personalized games request fails
   - Success response: Array of trending game objects

## Error Handling & Fallbacks

The component implements robust error handling to ensure users always get recommendations:

- If token retrieval fails: Show "Save a Game!" message
- If server recommendations fail: Try trending games
- If trending games fail: Use hardcoded games
- If scoring algorithm fails: Display games without scores

## UI Components

1. **Section Header**:
   - "Personalized to you" title
   - Refresh button
   - "View All" link

2. **Game Cards**:
   - Uses `HomePageCard` component to render each recommendation
   - Displays match percentage for each game

3. **Loading State**:
   - Spinning indicator while loading data

4. **Empty State**:
   - "Save a Game!" message when user has no preference tokens
   - Link to game discovery page

5. **Debug Panel**:
   - Token source information
   - API status tracking
   - Game score details
   - Error messages

## Refresh Mechanism

The component provides a manual refresh button:

```jsx
const handleRefresh = () => {
  setLoading(true);
  setError(null);
  setRefreshKey(prev => prev + 1);
};

useEffect(() => {
  // Fetch data
  // ...
}, [refreshKey]);
```

This allows users to:
- Refresh recommendations after saving new games
- Retry if there were connection issues
- Get new recommendations based on updated token values

## Best Practices Implemented

1. **Resilience**: Multiple fallback mechanisms ensure recommendations are always available
2. **Transparency**: Debug panel shows exactly what's happening (in development)
3. **Error Graceful Degradation**: Falls back to simpler methods rather than failing completely
4. **Performance**: Avoids unnecessary API calls when possible
5. **User Control**: Refresh button gives users control over content updates 