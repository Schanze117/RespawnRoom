import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, memo, useMemo } from 'react';
import Header from './components/Header';
import LoginPrompt from './components/LoginPrompt';
import FloatingRoomWindow from './components/rooms/FloatingRoomWindow';
import { RoomProvider, useRoomContext } from './utils/RoomContext';
import './App.css'
import Auth from './utils/auth';
// import Footer from './components/Footer';

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

  const handleClearDataAndCache = () => {
    if (window.confirm(
      "Are you sure you want to clear all local site data and refresh? " +
      "This will log you out and remove any saved preferences for this site."
    )) {
      try {
        localStorage.clear();
        console.log("Local storage cleared successfully.");
        alert("Local storage has been cleared. The page will now perform a hard reload to attempt to clear cached assets for this page.");
        window.location.reload(true); // true forces a reload from the server, bypassing cache for the current page
      } catch (error) {
        console.error("Error clearing local storage or reloading:", error);
        alert("An error occurred while trying to clear data. Please check the console.");
      }
    } else {
      console.log("User cancelled clearing data.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-900">
      <Header />
      <div className="flex flex-1 relative">
        <main className="flex-1 w-full z-10 relative">
          {showLoginPrompt ? <LoginPrompt /> : <Outlet />}
        </main>
      </div>
      {/* <Footer /> */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleClearDataAndCache}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg focus:outline-none focus:shadow-outline"
          title="Clears all data stored by this site in your browser (localStorage) and forces a page refresh from the server for the current page."
        >
          Clear Cache & Data
        </button>
      </div>
      <FloatingRoomWindow />
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
    </RoomProvider>
  );
}

export default App
