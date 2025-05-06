# Home Page Components Documentation

## Overview
The home page is built using several React components that work together to create an engaging gaming platform interface. Each component serves a specific purpose in displaying different types of game content.

## Core Components

### 1. PersonalizedRecommendations
The most sophisticated component that provides personalized game suggestions based on user preferences.

**Features:**
- Dynamic game recommendations based on user tokens
- Mix of trending and personalized games
- Debug information display
- Manual refresh capability
- Loading and error states
- Empty state handling

**States:**
- `recommendations`: Array of recommended games
- `loading`: Loading state indicator
- `error`: Error state handling
- `hasTokens`: Token availability check
- `debugInfo`: Debug information
- `initialLoadComplete`: Initial load tracking

### 2. TopRated
Displays the highest-rated games on the platform.

**Features:**
- Displays top-rated games with ratings
- Responsive grid layout
- Loading state handling
- Empty state handling
- Force refresh capability

**States:**
- `displayGames`: Array of top-rated games
- `isLoading`: Loading state indicator

### 3. TrendingGames
Shows currently popular games on the platform.

**Features:**
- Displays trending games with popularity indicators
- Loading state handling
- Force refresh capability
- Responsive layout

**States:**
- `displayGames`: Array of trending games
- `isLoading`: Loading state indicator

### 4. UpcomingReleases
Displays games that will be released soon.

**Features:**
- Release date formatting
- Loading state handling
- Empty state handling
- Force refresh capability
- Responsive layout

**States:**
- `displayGames`: Array of upcoming games
- `isLoading`: Loading state indicator

### 5. LatestReleases
Shows recently released games.

**Features:**
- Displays latest game releases
- Loading state handling
- Empty state handling
- Force refresh capability
- Responsive layout

**States:**
- `displayGames`: Array of latest games
- `isLoading`: Loading state indicator

## Recommendations Token System

### 1. Token Basics

**What are Tokens?**
- Weights assigned to game attributes
- Represent user preferences
- Used to calculate match scores
- Stored in user profile

**Token Structure:**
// Example token structure
const userTokens = {
  "RPG": 0.8,          // Strong preference for RPGs
  "First Person": 0.6, // Moderate preference for first-person games
  "Action": 0.4,       // Mild preference for action games
  "_source": "server"  // Indicates token source
};
```

### 2. Token Sources

**Server-Side Tokens:**
- Generated from user's saved games
- Based on play history
- Updated with user interactions
- Stored in user profile

**Local Tokens:**
- Generated from recent interactions
- Temporary preferences
- Session-based
- Used for immediate feedback

### 3. Token Weighting

**Base Weights:**
- Genre preferences: 0.1 - 1.0
- Perspective preferences: 0.1 - 0.8
- Theme preferences: 0.1 - 0.6

**Weight Calculation:**
// Example weight calculation
const calculateWeight = (interactionCount, totalInteractions) => {
  const baseWeight = interactionCount / totalInteractions;
  return Math.min(baseWeight * 1.5, 1.0); // Cap at 1.0
};
```

### 4. Recommendation Process

**Step 1: Token Collection**
// When user saves a game
const game = {
  genres: ["RPG", "Action"],
  player_perspectives: ["First Person"]
};

// Update tokens
game.genres.forEach(genre => {
  tokens[genre] = (tokens[genre] || 0) + 0.2;
});
```

**Step 2: Game Scoring**
// Calculate match score based on tokens
const calculateMatchScore = (game, tokens) => {
  let score = 0;
  const gameGenres = game.genres?.map(g => g.name) || [];
  const gamePerspectives = game.player_perspectives?.map(p => p.name) || [];
  
  // Calculate score based on token matches
  [...gameGenres, ...gamePerspectives].forEach(category => {
    if (tokens[category]) {
      score += tokens[category];
    }
  });
  
  return score > 0 ? Math.min(Math.round((score / 3) * 100), 95) : 70;
};
```

**Step 3: Recommendation Generation**
// Get recommendations
const getRecommendations = async () => {
  // 1. Get user tokens
  const tokens = await getUserTokens();
  
  // 2. Get potential games
  const games = await getGames();
  
  // 3. Score games
  const scoredGames = games.map(game => ({
    ...game,
    matchScore: calculateMatchScore(game, tokens)
  }));
  
  // 4. Sort and filter
  return scoredGames
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 15);
};
```

**Step 4: Mixing Strategies**
// Mix personalized and trending games
const mixRecommendations = (personalizedGames, trendingGames) => {
  // Get 3 random trending games
  const randomTrending = getRandomItems(trendingGames, 3);
  
  // Mark them as trending recommendations
  const markedTrending = randomTrending.map(game => ({
    ...game,
    isTrending: true,
    matchScore: Math.floor(Math.random() * 25) + 70
  }));
  
  // Take top 12 personalized games
  const topPersonalized = personalizedGames.slice(0, 12);
  
  // Combine and shuffle
  return [...topPersonalized, ...markedTrending].sort(() => 0.3 - Math.random());
};
```

### 5. Display and UI

**Recommendation Card:**
const RecommendationCard = ({ game }) => (
  <div>
    <h3>{game.name}</h3>
    <div>Match Score: {game.matchScore}%</div>
    <div>Based on: {game.genres.join(", ")}</div>
  </div>
);
```

## Best Practices

### 1. Token Management
- Regular token updates
- Weight decay over time
- Minimum weight thresholds
- Maximum weight caps

### 2. Performance
- Batch token updates
- Cache token calculations
- Optimize scoring algorithms
- Use efficient data structures

### 3. User Experience
- Clear explanation of recommendations
- Option to adjust preferences
- Feedback mechanisms
- Regular updates

### 4. Error Handling
- Clear error messages
- Recovery mechanisms
- User feedback
- System monitoring

## Common Patterns

### 1. Respawn System
All components use a respawn system to force re-renders when needed:

useEffect(() => {
  // Force re-render when respawnCount changes
  const refreshedGames = games.map(game => ({
    ...game,
    _respawnId: respawnCount
  }));
}, [respawnCount]);
```

### 2. Loading States
Consistent loading state handling across components:

if (isLoading && displayGames.length === 0) {
  return (
    <section className="w-full mb-12">
      <div className="text-center py-8">Loading...</div>
    </section>
  );
}
```

### 3. Empty States
Consistent empty state handling:

if (displayGames.length === 0) {
  return null;
}
```

### 4. Error Handling
Consistent error handling across components:

if (error) {
  return (
    <div className="text-red-500 text-center py-4">
      {error}
    </div>
  );
}
``` 