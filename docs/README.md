# RespawnRoom Documentation

Welcome to the RespawnRoom documentation. This guide provides detailed information about the application's components, architecture, and features.

## Home Page

The home page is the main landing page of the RespawnRoom application. It showcases various game collections and personalized recommendations.

- [Home Page Components](HomePage.md) - Overview of all components on the home page
- [Personalized Recommendations](PersonalizedRecommendations.md) - In-depth documentation of the personalization feature
- [Token System](TokenSystem.md) - Detailed explanation of the preference tracking system

## Key Features

### Personalized Game Recommendations

RespawnRoom provides personalized game recommendations using a token-based system that tracks user preferences:

1. Users build their preference profile by saving games they enjoy
2. The system tracks genres, perspectives, and other categories as "tokens"
3. Token values grow when users interact with similar games and decay over time
4. Games are scored based on how well they match the user's token profile
5. The system presents games with the highest match scores as recommendations

See [Token System](TokenSystem.md) for detailed implementation information.

### Multi-Tier Recommendation Strategy

The recommendation system employs a three-tier approach for maximum reliability:

1. **Server API Recommendations**: The primary method uses server-side processing 
2. **Client-Side Trending Games**: If server recommendations fail, trending games are scored locally
3. **Fallback Recommendations**: A set of diverse hardcoded games ensures recommendations are always available

See [Personalized Recommendations](PersonalizedRecommendations.md) for implementation details.

## Implementation Highlights

### Resilient Architecture

The application is designed to be resilient to various failure modes:

- API rate limiting (especially with the IGDB external API)
- Network connectivity issues
- Authentication token problems
- Missing or incomplete game data

Each component includes appropriate fallback mechanisms to ensure the application remains functional even when parts of the system encounter problems.

### Token Normalization

The system handles case sensitivity and naming variation issues between different data sources:

- Normalizes token keys for consistent matching (e.g., "Third Person" vs "third person")
- Handles special cases for common variations (e.g., "Third-Person", "ThirdPerson")
- Adds lowercase versions of all tokens for more robust matching

This ensures that recommendations remain accurate even when game data comes from different sources with inconsistent naming conventions.

### API Request Optimization

The application optimizes API requests to minimize server load and rate limit issues:

- Uses client-side scoring when possible
- Implements progressive loading for different sections of the page
- Caches data where appropriate
- Provides user-controlled refresh buttons for on-demand updates

## Development and Debugging

The application includes development tools to assist with troubleshooting:

- Debug panels showing token sources and values
- API status tracking in the UI
- Clear error states with informative messages
- Token source markers (`_source` property)

These tools help developers understand the state of the system and diagnose any issues that arise. 