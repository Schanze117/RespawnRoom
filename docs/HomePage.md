# Home Page Documentation

This document provides an overview of the Home page components in the RespawnRoom application.

## Table of Contents
1. [Home Page Structure](#home-page-structure)
2. [Components](#components)
   - [HeroCarousel](#herocarousel)
   - [PersonalizedRecommendations](#personalizedrecommendations)
   - [GamesLayout](#gameslayout)
   - [UpcomingReleases](#upcomingreleases)
   - [TopRated](#toprated)
   - [TrendingGames](#trendinggames)
   - [LatestReleases](#latestreleases)
   - [GenreSpotlights](#genrespotlights)
   - [HomePageCard](#homepagecard)
   - [ScrollableGameCards](#scrollablegamecards)

## Home Page Structure

The Home page (`client/src/pages/home.jsx`) serves as the main landing page of the RespawnRoom application. It organizes and displays various game collections and recommendations.

Key features:
- **Respawn Functionality**: A global "Respawn All Games" button that refreshes all game sections with new content
- **Featured Game**: A hero carousel that loads first and showcases featured games
- **Personalized Content**: Game recommendations based on user preferences
- **Curated Collections**: Various game collections (upcoming, top-rated, trending, latest)

## Components

### HeroCarousel

**File**: `client/src/components/homePage/HeroCarousel.jsx`

**Purpose**: Displays a featured game in a prominent carousel at the top of the home page.

**Logic Flow**:
1. When mounted, calls `getFeaturedGame()` from `gameFetcher.js`
2. API Request: Makes a request to get trending games if no specific featured game is defined
3. Renders a carousel with the featured game's details, including title, description, and a background image
4. Provides a "View Details" button that links to the game's detail page

**API Requests**:
- Only through the `getFeaturedGame()` utility which may fetch from `/api/games/trending` if needed

---

### PersonalizedRecommendations

**File**: `client/src/components/homePage/PersonalizedRecommendations.jsx`

**Purpose**: Shows games recommendations personalized to the user's preferences based on their token profile.

**Logic Flow**:
1. Fetches user's preference tokens using `UserProfileManager.getProfileTokens()`
2. Implements a three-tier recommendation strategy:
   - Tier 1: Try to get personalized games from the server API
   - Tier 2: If server recommendations fail, fetch trending games and score them based on user tokens
   - Tier 3: Fall back to hardcoded games if all else fails

3. Calculates match scores for each game based on how well they match the user's preference tokens
4. Sorts games by match score and displays the top recommendations
5. Shows a "Save a Game" message if the user has no preference tokens

**API Requests**:
1. `getTokens()` → `GET /api/user/tokens` (Retrieves user preference tokens)
2. `getPersonalizedGames()` → `GET /api/games/personalized` (Tier 1)
3. `getTrendingGames()` → `GET /api/games/trending` (Tier 2 fallback)

**Key Features**:
- Token normalization to handle case sensitivity in category matching
- Refresh button to manually trigger recommendation updates
- Debug information panel showing token sources and recommendation process
- Multi-tier fallback system ensuring recommendations are always available

---

### GamesLayout

**File**: `client/src/components/homePage/GamesLayout.jsx`

**Purpose**: Simple layout component that organizes TrendingGames and LatestReleases components in a grid.

**Logic Flow**:
1. Acts as a container for TrendingGames and LatestReleases components
2. Does not make any API requests directly
3. Simply renders child components in the appropriate layout

---

### UpcomingReleases

**File**: `client/src/components/homePage/UpcomingReleases.jsx`

**Purpose**: Displays a collection of upcoming game releases.

**Logic Flow**:
1. When mounted, calls `getUpcomingGames()` to fetch upcoming games
2. Handles loading and error states
3. Uses `ScrollableGameCards` to render the games in a scrollable format

**API Requests**:
- `getUpcomingGames()` → `GET /api/games/upcoming` (Gets games scheduled for future release)

---

### TopRated

**File**: `client/src/components/homePage/TopRated.jsx`

**Purpose**: Displays a collection of highest-rated games.

**Logic Flow**:
1. When mounted, calls `getTopRatedGames()` to fetch top-rated games
2. Handles loading and error states
3. Uses `ScrollableGameCards` to render the games in a scrollable format

**API Requests**:
- `getTopRatedGames()` → `GET /api/games/top-rated` (Gets games with highest ratings)

---

### TrendingGames

**File**: `client/src/components/homePage/TrendingGames.jsx`

**Purpose**: Displays currently popular and trending games.

**Logic Flow**:
1. When mounted, calls `getTrendingGames()` to fetch trending games
2. Handles loading and error states
3. Uses `ScrollableGameCards` to render the games in a scrollable format

**API Requests**:
- `getTrendingGames()` → `GET /api/games/trending` (Gets currently popular games)

---

### LatestReleases

**File**: `client/src/components/homePage/LatestReleases.jsx`

**Purpose**: Displays recently released games.

**Logic Flow**:
1. When mounted, calls `getLatestReleases()` to fetch recently released games
2. Handles loading and error states
3. Uses `ScrollableGameCards` to render the games in a scrollable format

**API Requests**:
- `getLatestReleases()` → `GET /api/games/latest` (Gets most recently released games)

---

### GenreSpotlights

**File**: `client/src/components/homePage/GenreSpotlights.jsx`

**Purpose**: Highlights specific game genres to help users discover games by category.

**Logic Flow**:
1. Contains a predefined list of popular genres with icons and descriptions
2. Renders these genres as clickable cards
3. Clicking a genre navigates to the discover page with that genre pre-selected as a filter

**API Requests**:
- None (uses predefined data)

---

### HomePageCard

**File**: `client/src/components/homePage/HomePageCard.jsx`

**Purpose**: Reusable card component for displaying game information on the home page.

**Logic Flow**:
1. Accepts a list of games and display type as props
2. Renders each game as a card with image, title, genres, and match percentage (for recommendations)
3. Provides hover effects and click navigation to the game detail page
4. Handles different display formats based on the type prop

**API Requests**:
- None (displays data passed as props)

---

### ScrollableGameCards

**File**: `client/src/components/homePage/ScrollableGameCards.jsx`

**Purpose**: Reusable component for displaying a horizontal scrollable list of game cards.

**Logic Flow**:
1. Accepts a list of games, a section title, and display options as props
2. Implements horizontal scrolling navigation with left/right buttons
3. Uses HomePageCard component to render individual games
4. Provides "View All" navigation option

**API Requests**:
- None (displays data passed as props)

## Component Relationships

1. **Home** renders all main sections in this order:
   - HeroCarousel (loads first)
   - PersonalizedRecommendations
   - GamesLayout
   - UpcomingReleases
   - TopRated
   - GenreSpotlights

2. **GamesLayout** renders:
   - TrendingGames
   - LatestReleases

3. Most collection components use:
   - ScrollableGameCards for layout
   - HomePageCard for individual game display

## API Request Flow

1. The page load triggers these API requests in parallel:
   - Featured game loading (from HeroCarousel)
   - User token retrieval (from PersonalizedRecommendations)
   - Collection data loading (from each game collection component)

2. The PersonalizedRecommendations component makes sequential API requests:
   - First fetches user tokens
   - Then attempts to get personalized recommendations
   - Falls back to trending games if needed

3. Each game collection component (TopRated, UpcomingReleases, etc.) makes a single API request to its corresponding endpoint.

## Data Caching and Refresh

- The "Respawn All Games" button refreshes all game sections by:
  - Resetting the list of displayed games in memory
  - Triggering component re-mounts via key changes
  - Each component then makes fresh API requests

- The PersonalizedRecommendations component has its own refresh button that triggers a token and recommendation refresh independently of other components. 