import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginPrompt from './components/LoginPrompt';
import './App.css'
import Auth from './utils/auth';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    // Process token from URL if present
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      // Store token and redirect (page will reload)
      Auth.login(token);
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Show login prompt if not on login/register page and not logged in
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    setShowLoginPrompt(!isAuthPage && !Auth.loggedIn());
  }, [navigate, location]);

  return (
    <>
      <Header />
      <main>
        {showLoginPrompt ? <LoginPrompt /> : <Outlet />}
      </main>
    </>
  )
}

export default App
