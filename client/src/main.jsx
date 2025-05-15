import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { lazy, Suspense } from 'react';
import './index.css';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { DotLoader } from './utils/LoadingSkeletons';

// Lazily load all components, including App
const App = lazy(() => import('./App.jsx'));
const Home = lazy(() => import('./pages/home.jsx'));
const Search = lazy(() => import('./pages/search.jsx'));
const Discover = lazy(() => import('./pages/discover.jsx'));
const Login = lazy(() => import('./pages/loginPage.jsx'));
const Saved = lazy(() => import('./pages/saved.jsx'));
const Register = lazy(() => import('./pages/register.jsx'));
const Friends = lazy(() => import('./pages/friends/index.jsx'));
const UnauthorizedAccess = lazy(() => import('./pages/UnauthorizedAccess.jsx'));
const ErrorPage = lazy(() => import('./pages/ErrorPage.jsx'));
// const RoomsRoutes = lazy(() => import('./pages/rooms/index.jsx')); // Removed as rooms feature is no longer used
import { GameProvider } from './utils/GameContext.jsx';
import { AuthProvider } from './utils/AuthContext.jsx';
import { MessageProvider } from './utils/MessageContext.jsx';
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
    });
  }
  if (networkError) {
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
    <DotLoader />
  </div>
);

// Error loading component for when lazy components fail to load
const ErrorFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-surface-900 text-white p-4">
    <div className="w-full max-w-md bg-surface-800 rounded-lg shadow-lg p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-500 mx-auto mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h1 className="text-2xl font-bold mb-4">Failed to Load</h1>
      <p className="text-gray-300 mb-6">We couldn't load the necessary resources for this page.</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary-700 hover:bg-primary-600 text-white font-medium rounded-md transition-colors"
      >
        Reload Page
      </button>
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    ),
    errorElement: (
      <Suspense fallback={<ErrorFallback />}>
        <ErrorPage />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute><Home /></ProtectedRoute>
          </Suspense>
        ),
        errorElement: (
          <Suspense fallback={<ErrorFallback />}>
            <ErrorPage />
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
        errorElement: (
          <Suspense fallback={<ErrorFallback />}>
            <ErrorPage />
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
        errorElement: (
          <Suspense fallback={<ErrorFallback />}>
            <ErrorPage />
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
        errorElement: (
          <Suspense fallback={<ErrorFallback />}>
            <ErrorPage />
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
        errorElement: (
          <Suspense fallback={<ErrorFallback />}>
            <ErrorPage />
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
        errorElement: (
          <Suspense fallback={<ErrorFallback />}>
            <ErrorPage />
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
        errorElement: (
          <Suspense fallback={<ErrorFallback />}>
            <ErrorPage />
          </Suspense>
        ),
      },
      {
        path: '/unauthorized',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UnauthorizedAccess />
          </Suspense>
        ),
        errorElement: (
          <Suspense fallback={<ErrorFallback />}>
            <ErrorPage />
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
      <AuthProvider>
        <MessageProvider>
          <RouterProvider router={router} />
        </MessageProvider>
      </AuthProvider>
    </GameProvider>
  </ApolloProvider>
);