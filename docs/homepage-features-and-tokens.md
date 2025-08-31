# Homepage Features and Token System

## Overview

The homepage is made up of several sections: Trending Games, Latest Releases, Top Rated, Upcoming Releases, and Personalized Recommendations ("For You"). Each section uses data from the backend and your profile to show games that are relevant, recent, or just plain interesting. Here's a detailed look at how each part works, how the data flows, and how the recommendation system uses your activity to get smarter over time.

---

## Data Fetching and API Requests

- When you load the homepage, the app fetches lists of games for each section (trending, latest, top rated, upcoming) from the backend. These are usually split into `primary` and `secondary` arrays for each category.
- For recommendations, the app tries to get your user tokens from your profile. If you have tokens, it requests personalized games from the server. If not, it falls back to trending games.
- If the server is slow or unavailable, the app uses any trending games already in context, so you always see something.
- The app is designed to be resilient: even if some requests fail, the homepage won't be empty.

---

## Trending Games

**File:** `TrendingGames.jsx`

- Combines `primary` and `secondary` games from the `featuredGames` context.
- Adds a `_respawnId` to each game to force React to treat them as new when `respawnCount` changes, ensuring the carousel updates.
- Normalizes the rating count field for UI compatibility.
- Shows skeleton cards while loading, so the layout stays consistent.
- If there are no games, the section is not rendered.

---

## Latest Releases

**File:** `LatestReleases.jsx`

- Merges `primary` and `secondary` games from the `latestGames` context.
- Adds a `_respawnId` and normalizes the rating count.
- Shows skeletons while loading.
- If there are no games, the section is not rendered.

---

## Top Rated

**File:** `TopRated.jsx`

- Merges `primary` and `secondary` games from the `topGames` context.
- Adds a `_respawnId` and normalizes the rating count.
- Shows skeletons while loading.
- If there are no games, the section is not rendered.

---

## Upcoming Releases

**File:** `UpcomingReleases.jsx`

- Merges `primary` and `secondary` games from the `upcomingGames` context.
- Formats the release date for each game for display, using either a timestamp or a string.
- Adds a `_respawnId`, normalizes the rating count, and includes an `isExpanded` state for each game (for future features like expanded details).
- Shows a message if there are no upcoming games, or skeletons while loading.
- Supports expanding/collapsing game details for a more interactive experience.

---

## Personalized Recommendations ("For You")

**File:** `PersonalizedRecommendations.jsx`

- Checks for user tokens. If none are found, prompts you to save a game to your profile to get recommendations.
- If tokens exist, tries to fetch personalized games from the server. If that fails, falls back to trending games and scores them locally using your tokens.
- Mixes in a few trending games for variety, so you don't just see the same types of games every time.
- Includes a refresh button to reload recommendations.
- Uses debug info and logs to help with troubleshooting and to make sure the recommendations are working as expected.
- The recommendation logic tries to balance what you like with a bit of randomness, so things don't get stale.

---

## Token System and Recommendation Scoring

The token system is what makes recommendations personal. Here's how it works in detail:

- **Tokens** represent the genres and perspectives of games you've saved. Every time you save a game, the system increases the count for each relevant token (like "RPG" or "First Person").
- Tokens are stored in your profile and sometimes fetched from the server. They're used to score new games for recommendations.
- **Token Decay:** To keep recommendations fresh and avoid old preferences dominating forever, tokens decay over time. Every 24 hours, each token's value is multiplied by 0.9 (a 10% decay). Tokens below 0.1 are dropped. This means your recent activity matters more, but your history still counts.

**Token Decay Example:**

```js
// Apply decay to all tokens (run once per day)
const decayFactor = 0.9;
Object.keys(currentTokens).forEach(category => {
  const newValue = currentTokens[category] * decayFactor;
  if (newValue >= 0.1) {
    decayedTokens[category] = newValue;
  }
});
```

- **Scoring:** When building recommendations, each game is scored by how many of its genres or perspectives match your tokens. More matches mean a higher score. The score is normalized to a 0-100 scale and capped at 95.

**Scoring Example:**

```js
let score = 0;
const gameGenres = game.genres?.map(g => g.name) || [];
const gamePerspectives = game.player_perspectives?.map(p => p.name) || [];

[...gameGenres, ...gamePerspectives].forEach(category => {
  if (tokens[category]) {
    score += tokens[category];
  }
});

// Convert to a 0-100 scale, cap at 95
const matchScore = score > 0 ? Math.min(Math.round((score / 3) * 100), 95) : 70;
```

- Games are sorted by score, and the top ones are shown as recommendations.
- A few random trending games are also included to keep the list fresh and introduce new options.
- The system is designed to adapt: if you start saving different types of games, your tokens shift, and so do your recommendations.

---

## Summary

Each homepage section is powered by context data, re-rendering logic, and the token system for personalization. The app is designed to always show content, even if the backend is slow or unavailable. The recommendation system uses a straightforward scoring method based on your saved games, with some randomness and token decay to keep things relevant and interesting.

**Tip:** To keep the homepage responsive and relevant, make sure your data is fresh, use unique keys for React lists, and let the token system do its work—your recommendations will keep evolving as you play and save more games. 