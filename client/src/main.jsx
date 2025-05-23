import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import './index.css';

import App from './App.jsx';
import Home from './pages/home.jsx';
import Search from './pages/search.jsx';
import Discover from './pages/discover.jsx';
import Login from './pages/loginPage.jsx';
import Saved from './pages/saved.jsx';
import Register from './pages/register.jsx';
import Friends from './pages/friends/index.jsx';
import RoomsRoutes from './pages/rooms/index.jsx';
import { GameProvider } from './utils/GameContext.jsx';

// Create an HTTP link
const httpLink = createHttpLink({
  uri: 'https://respawnroom-server.onrender.com/graphql',
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
        element: <Search />,
      },
      {
        path: '/discover',
        element: <Discover />,
      },
      {
        path: '/saved',
        element: <Saved />,
      },
      {
        path: '/friends',
        element: <Friends />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/rooms/*',
        element: <RoomsRoutes />,
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