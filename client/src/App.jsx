import { Outlet, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import './App.css'
import { useEffect } from 'react';
import Auth from './utils/auth';

function App() {
  const navigate = useNavigate();

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
  }, [navigate]);

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default App
