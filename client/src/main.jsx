import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { lazy, Suspense } from 'react';
import './index.css';

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

// Create an HTTP link
const httpLink = createHttpLink({
  uri: 'http://localhost:3001/graphql',
  credentials: 'include',
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

// Create an Apollo Client instance with the auth link
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
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
        element: <Home />,
      },
      {
        path: '/search',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Search />
          </Suspense>
        ),
      },
      {
        path: '/discover',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Discover />
          </Suspense>
        ),
      },
      {
        path: '/saved',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Saved />
          </Suspense>
        ),
      },
      {
        path: '/friends',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Friends />
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
        path: '/rooms/*',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <RoomsRoutes />
          </Suspense>
        ),
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