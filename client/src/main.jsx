import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { lazy, Suspense } from 'react';
import './index.css';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

import App from './App.jsx';
// Import Home normally as it's the initial page users see
import Home from './pages/home.jsx';
// Lazy load other page components
const Search = lazy(() => import('./pages/search.jsx'));
const Discover = lazy(() => import('./pages/discover.jsx'));
const Login = lazy(() => import('./pages/loginPage.jsx'));
const Saved = lazy(() => import('./pages/saved.jsx'));
const Register = lazy(() => import('./pages/register.jsx'));
const Friends = lazy(() => import('./pages/friends/index.jsx'));
const RoomsRoutes = lazy(() => import('./pages/rooms/index.jsx'));
import { GameProvider } from './utils/GameContext.jsx';
import ProtectedRoute from './utils/ProtectedRoute.jsx';

// Create an HTTP link
const httpLink = createHttpLink({
  uri: 'http://localhost:3001/graphql',
  credentials: 'include',
  fetchOptions: {
    mode: 'cors',
  },
});

// Create an auth link to include the token in the headers
const authLink = setContext((_, { headers }) => {
  // Get the token from localStorage
  const token = localStorage.getItem('jwtToken');
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Create an error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}, Operation: ${operation.operationName}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`, operation);
  }
});

// Add retry capability
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => !!error && error.networkError !== undefined,
  },
});

// Create an Apollo Client instance with improved cache configuration
const client = new ApolloClient({
  link: errorLink.concat(retryLink).concat(authLink.concat(httpLink)),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getFriends: {
            merge(existing, incoming) {
              return incoming;
            },
            keyArgs: []
          },
          getFriendRequests: {
            merge(existing, incoming) {
              return incoming;
            },
            keyArgs: []
          },
          searchUsers: {
            merge(existing, incoming) {
              return incoming;
            },
            keyArgs: ['username']
          }
        }
      },
      User: {
        keyFields: ["_id"],
        fields: {
          friends: {
            merge(existing, incoming) {
              return incoming;
            }
          },
          friendRequests: {
            merge(existing, incoming) {
              return incoming;
            }
          }
        }
      }
    },
    dataIdFromObject: (object) => {
      if (object.__typename && object._id) {
        return `${object.__typename}:${object._id}`;
      }
      return null;
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Always fetch from server first
      nextFetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only', // Always fetch from server first
      errorPolicy: 'all',
    },
    mutate: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
});

// Loading component that maintains the app's appearance
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="animate-pulse flex space-x-2">
      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute><Home /></ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: '/search',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute><Search /></ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: '/discover',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute><Discover /></ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: '/saved',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute><Saved /></ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: '/friends',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute><Friends /></ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: '/login',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: '/register',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Register />
          </Suspense>
        ),
      },
      {
        // Redirect rooms/* route to homepage
        path: '/rooms/*',
        element: <Navigate to="/" replace />
      },
      {
        // Catch-all for any unmatched routes
        path: '*',
        element: <Navigate to="/login" replace />
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <ApolloProvider client={client}>
    <GameProvider>
      <RouterProvider router={router} />
    </GameProvider>
  </ApolloProvider>
);