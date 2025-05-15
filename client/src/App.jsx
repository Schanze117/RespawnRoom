import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, memo, useMemo } from 'react';
import Header from './components/Header';
import FloatingRoomWindow from './pages/rooms/components/FloatingRoomWindow';
import { RoomProvider, useRoomContext } from './utils/RoomContext';
import './App.css'
import Auth from './utils/auth';
// import Footer from './components/Footer';

// This component is just to track location changes and notify the room context
const LocationListener = memo(function LocationListener() {
  const location = useLocation();
  const { activeRoom, checkPathAndToggleWindow } = useRoomContext();
  
  // Update when either location changes
  useEffect(() => {
    // Only process if we have a pathname
    if (location.pathname) {
      checkPathAndToggleWindow(location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Removed activeRoom and checkPathAndToggleWindow from dependencies
  
  return null;
});

// Hook to handle URL token processing - this ensures we only do it once at the initial load
function useProcessUrlToken() {
  const [processed, setProcessed] = useState(false);
  
  useEffect(() => {
    // Only run this once
    if (processed) return;
    
    // Process token from URL if present
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const redirectParam = params.get('redirect');
    
    if (token) {
      console.log('[App] Token found in URL, processing login...');
      
      // Set redirect URL if available
      if (redirectParam) {
        console.log('[App] Redirect path found:', redirectParam);
        sessionStorage.setItem('redirectUrl', redirectParam);
      }
      
      // Process login (this will redirect and reload the page)
      console.log('[App] Calling Auth.login with token...');
      Auth.login(token);
      
      // Mark as processed to prevent re-runs
      setProcessed(true);
    }
  }, [processed]);
  
  return processed;
}

const AppContent = memo(function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Process any tokens in the URL (using our custom hook)
  const tokenProcessed = useProcessUrlToken();
  
  // Clear URL parameters if token was processed (cleanup)
  useEffect(() => {
    if (tokenProcessed && window.location.search) {
      console.log('[App] Cleaning up URL parameters after token processing');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [tokenProcessed]);

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
          <Outlet />
        </main>
      </div>
      {/* <Footer /> */}
      {/* Clear Cache & Data button hidden as requested, but functionality preserved */}
      {/* 
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleClearDataAndCache}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg focus:outline-none focus:shadow-outline"
          title="Clears all data stored by this site in your browser (localStorage) and forces a page refresh from the server for the current page."
        >
          Clear Cache & Data
        </button>
      </div>
      */}
      <FloatingRoomWindow />
    </div>
  );
});

function App() {
  return (
    <RoomProvider>
      <LocationListener />
      <AppContent />
    </RoomProvider>
  );
}

export default App
