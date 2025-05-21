# RespawnRoom Environment Variables Guide

## Client-Side Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL for API/backend server endpoints |
| `VITE_GRAPHQL_URL` | URL for GraphQL endpoint |
| `VITE_PUBNUB_PUBLISH_KEY` | PubNub publish key for real-time messaging |
| `VITE_PUBNUB_SUBSCRIBE_KEY` | PubNub subscribe key for real-time messaging |
| `VITE_IGDB_IMAGE_URL` | Base URL for IGDB game images |

## Server-Side Environment Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Port number the server runs on |
| `CLIENT_URL` | URL of the frontend/client (used for CORS and redirects) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET_KEY` | Secret key for JWT token generation and verification |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL |
| `IGDB_CLIENT_ID` | IGDB API client ID |
| `IGDB_ACCESS_TOKEN` | IGDB API access token |
| `PUBNUB_SUBSCRIBE_KEY` | PubNub subscribe key (server-side) |
| `PUBNUB_PUBLISH_KEY` | PubNub publish key (server-side) |

## Environment Setup

For production deployment:
- Server runs on AWS Lambda with the serverless-http adapter
- Frontend is hosted at https://respawnroom.online
- Backend Lambda URL: https://kp527ouiz74fmouhq2dzzqciky0feltt.lambda-url.us-east-1.on.aws

All environment variables must be properly set with no fallbacks for production deployment. 