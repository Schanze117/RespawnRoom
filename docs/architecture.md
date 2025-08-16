# 📐 Architecture

<div align="center">


```
┌─────────────────────────────────┐
│  Client (React + Vite + Apollo) │
└───────────────┬─────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ Express + Apollo Server (GraphQL) │
└───────────────┬───────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│    MongoDB (Mongoose Models)    │
└───────────────┬─────────────────┘
                │
                ▼
┌──────────────────────────────────┐
│         Third-Party APIs         │
├──────────┬──────────┬────────────┤
│   IGDB   │  Google  │  PubNub    │
└──────────┴──────────┴────────────┘
```

</div>

---

## 🧩 Core Components

### 🖥️ Frontend (`client/src/`)

| Category | Components |
|----------|------------|
| **Pages** | `home` `login` `register` `search` `discover` `saved` `friends` `error` |
| **UI Components** | `Header` `Avatar` `Modal` `Cards` `Carousel` `Loading` |
| **State** | `AuthContext` `GameContext` `MessageContext` |
| **Utils** | `api` `pubnubChat` `auth` `gameFetcher` `queries` `mutations` |
| **Styling** | Tailwind CSS |
| **Routing** | React Router |

### ⚙️ Backend (`server/src/`)

| Category | Components |
|----------|------------|
| **Server** | Express.js with Apollo Server (GraphQL) |
| **API** | GraphQL schemas and REST endpoints |
| **Auth** | JWT authentication |
| **Security** | CORS, Rate limiting, Error handling |
| **Data** | Mongoose models (`User`, `VideoGame`, `Message`) |
| **Services** | Controllers, Middleware, Utilities |

### 🔌 Third-Party Integrations

- **IGDB API**: Game data, search, details, covers

- **PubNub**: Real-time messaging and presence
- **Twitch API**: Game streaming integration

---

## 📊 GraphQL API

### Data Models

<div style="display: flex; justify-content: space-between;">

<div style="flex: 1; margin-right: 10px;">

**User**
- Authentication
- Profile data
- Friend connections
- Saved games collection
- Chat history

</div>

<div style="flex: 1; margin-right: 10px;">

**VideoGame**
- Cover image
- Name and genres
- Player perspectives
- Summary
- User references

</div>

<div style="flex: 1;">

**Message**
- Sender & receiver
- Content
- Timestamp
- Read status
- References

</div>

</div>

### Key Operations

| Queries | Mutations |
|---------|-----------|
| `me` - Current user | `login` - Authenticate |
| `getVideoGames` - Games list | `addUser` - Register |
| `getFriends` - User connections | `saveGame` - Add to collection |
| `getFriendRequests` - Pending requests | `removeGame` - Remove from collection |
| `searchUsers` - Find users | `sendFriendRequest` - Connect |
| `getMessages` - Chat history | `sendMessage` - Chat |

### Error Handling

- `UNAUTHENTICATED`: Invalid/missing token
- `NOT_FOUND`: Resource doesn't exist
- `BAD_USER_INPUT`: Invalid parameters
- `INTERNAL_SERVER_ERROR`: Server issues (masked in production)

---

## 🔄 Data Flow

1. **👤 User Action**  
   User interacts with React UI (search games, send message, etc.)

2. **📤 Request**  
   - GraphQL queries/mutations via Apollo Client
   - REST endpoints for auth/specialized operations

3. **🔐 Authentication**  
   - JWT verification for most operations
   - Passport.js for OAuth flow

4. **⚙️ Processing**  
   - GraphQL resolvers handle business logic
   - Controllers manage complex workflows
   - Rate limiting prevents abuse

5. **💾 Database**  
   - MongoDB operations via Mongoose
   - Friend/game relationships management

6. **🔌 External APIs**  
   - IGDB for game data
   - PubNub for real-time messaging
   

7. **📥 Response**  
   - Data returned to client
   - Real-time updates via PubNub/Apollo
   - Error handling with detailed codes

---

## 📂 Key Modules

### Backend Structure

```
server/src/
├── server.js          # App entry point
├── config/            # Environment & DB setup
├── models/            # MongoDB schemas
├── schemas/           # GraphQL types & resolvers
├── routes/            # REST endpoints
├── controllers/       # Business logic
├── middleware/        # Auth, errors, rate limiting
└── utils/             # Helper functions
```

### Frontend Organization

```
client/src/
├── main.jsx          # App entry point
├── App.jsx           # Main component
├── pages/            # Route components
├── components/       # UI building blocks
│   ├── card/         # Game cards
│   ├── homePage/     # Home components
│   └── headerComponents/ # Navigation
├── utils/            # Helpers & contexts
└── assets/           # Static resources
```

---

## 🔒 Security Features

- **JWT Authentication**: Secure, stateless user sessions

- **CORS Protection**: Strict origin control
- **Rate Limiting**: Prevent brute-force attacks
- **Password Hashing**: bcrypt for secure storage
- **Error Masking**: Hide implementation details in production
- **HTTPS**: Secure data transmission

---

## ⚡ Performance Optimizations

- **Code Splitting**: Lazy-loaded React components
- **Apollo Cache**: Client-side data management
- **GraphQL**: Precise data fetching, no over/under-fetching
- **MongoDB Indexes**: Optimized queries
- **React Suspense**: Improved loading states

---

## 🧰 Extensibility

- **Modular Architecture**: Easy to add new features
- **GraphQL Schema**: Extensible type system
- **REST Endpoints**: For specialized integrations
- **Third-party Connectors**: Flexible integration points