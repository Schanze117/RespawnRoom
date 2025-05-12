import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, memo, useMemo } from 'react';
import Header from './components/Header';
import LoginPrompt from './components/LoginPrompt';
import FloatingRoomWindow from './components/rooms/FloatingRoomWindow';
import { RoomProvider, useRoomContext } from './utils/RoomContext';
import './App.css'
import Auth from './utils/auth';

// This component is just to track location changes and notify the room context
const LocationListener = memo(function LocationListener() {
  const location = useLocation();
  const { activeRoom, checkPathAndToggleWindow } = useRoomContext();
  
  // Update when either location or activeRoom changes
  useEffect(() => {
    checkPathAndToggleWindow(location.pathname);
  }, [location.pathname, activeRoom, checkPathAndToggleWindow]);
  
  return null;
});

const AppContent = memo(function AppContent() {
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
    <div className="flex flex-col min-h-screen bg-surface-900">
      <Header />
      <div className="flex flex-1 relative">
        <main className="flex-1 w-full z-10 relative">
          {showLoginPrompt ? <LoginPrompt /> : <Outlet />}
        </main>
      </div>
    </div>
  );
});

function App() {
  // Use useMemo to prevent unnecessary re-renders of provider value
  const roomProviderValue = useMemo(() => ({}), []);
  
  return (
    <RoomProvider value={roomProviderValue}>
      <LocationListener />
      <AppContent />
      <FloatingRoomWindow />
    </RoomProvider>
  );
}

export default App
