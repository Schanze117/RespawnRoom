# RespawnRoom Environment Setup Guide

## Client-Side Environment Variables (.env file in client/ directory)

```
# API Endpoints
VITE_API_URL=https://kp527ouiz74fmouhq2dzzqciky0feltt.lambda-url.us-east-1.on.aws
VITE_GRAPHQL_URL=https://kp527ouiz74fmouhq2dzzqciky0feltt.lambda-url.us-east-1.on.aws/graphql

# IGDB
VITE_IGDB_IMAGE_URL=https://images.igdb.com/igdb/image/upload/t_cover_big/

# PubNub
VITE_PUBNUB_PUBLISH_KEY=your_pubnub_publish_key
VITE_PUBNUB_SUBSCRIBE_KEY=your_pubnub_subscribe_key
```

## Server-Side Environment Variables (.env file in root directory)

```
# Server Configuration
PORT=3001
CLIENT_URL=https://respawnroom.online
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/respawnroom
JWT_SECRET_KEY=your_jwt_secret_key

# IGDB API
IGDB_CLIENT_ID=your_igdb_client_id
IGDB_ACCESS_TOKEN=your_igdb_access_token

# PubNub
PUBNUB_PUBLISH_KEY=your_pubnub_publish_key
PUBNUB_SUBSCRIBE_KEY=your_pubnub_subscribe_key
```

## Environment Variable Descriptions

### Client-Side Variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL for API endpoints |
| `VITE_GRAPHQL_URL` | URL for GraphQL endpoint |
| `VITE_PUBNUB_PUBLISH_KEY` | PubNub publish key for real-time messaging |
| `VITE_PUBNUB_SUBSCRIBE_KEY` | PubNub subscribe key for real-time messaging |
| `VITE_IGDB_IMAGE_URL` | Base URL for IGDB game images |

### Server-Side Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Port number the server runs on |
| `CLIENT_URL` | URL of the frontend (for CORS and redirects) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET_KEY` | Secret key for JWT token generation/verification |

| `IGDB_CLIENT_ID` | IGDB API client ID |
| `IGDB_ACCESS_TOKEN` | IGDB API access token |
| `PUBNUB_SUBSCRIBE_KEY` | PubNub subscribe key (server-side) |
| `PUBNUB_PUBLISH_KEY` | PubNub publish key (server-side) |

## Production Deployment

- Server runs on AWS Lambda with the serverless-http adapter
- Frontend is hosted at https://respawnroom.online
- Backend Lambda URL: https://kp527ouiz74fmouhq2dzzqciky0feltt.lambda-url.us-east-1.on.aws

## Important Notes

1. No environment variable fallbacks should be used in production code
2. Both client and server environments must be properly configured
3. Environment variables are loaded from the respective .env files
4. For AWS Lambda deployment, environment variables must be configured in the Lambda function settings