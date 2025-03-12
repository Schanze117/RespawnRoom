import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css'

import App from './App.jsx';
import Home from './pages/home.jsx';
import Search from './pages/search.jsx';
import Login from './pages/loginPage.jsx';
import Saved from './pages/saved.jsx';
import Register from './pages/register.jsx';

const router = createBrowserRouter([

  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: '/search',
        element: <Search />
      },
      {
        path: '/saved',
        element: <Saved />
      },
      {
        path: '/login',
        element: <Login />
      },
      {
        path: '/register',
        element: <Register />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router}/>
)
