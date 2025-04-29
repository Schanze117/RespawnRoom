import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import './App.css'
import { useEffect } from 'react';
import Auth from './utils/auth';

function App() {
  useEffect(() => {
    // Parse
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      Auth.login(token); // Store token and redirect
    }
  }, []);

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
