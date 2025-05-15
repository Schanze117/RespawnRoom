import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation, Navigate, Outlet, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import { useAuth } from './utils/AuthContext.jsx';
import Auth from './utils/auth';
import './App.css';

// Lazily load Modal component
const Modal = lazy(() => import('./components/Modal'));

// Create a separate lazy-loaded wrapper for AlertModal
const AlertModalWrapper = lazy(() => import('./components/AlertModalWrapper'));

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
      // Set redirect URL if available
      if (redirectParam) {
        sessionStorage.setItem('redirectUrl', redirectParam);
      }
      
      // Process login (this will redirect and reload the page)
      Auth.login(token);
      
      // Mark as processed to prevent re-runs
      setProcessed(true);
    }
  }, [processed]);
  
  return processed;
}

const App = React.memo(function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth(); // Get user and loading state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // State for modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); 
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  // Process any tokens in the URL (using our custom hook)
  const tokenProcessed = useProcessUrlToken();
  
  // Clear URL parameters if token was processed (cleanup)
  useEffect(() => {
    if (tokenProcessed && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [tokenProcessed]);

  const openClearDataModal = () => {
    setIsConfirmModalOpen(true);
  };

  const handleClearDataAndCache = () => {
    try {
      localStorage.clear();
      setIsConfirmModalOpen(false);
      setAlertMessage("Local storage has been cleared. The page will now perform a reload to clear cached assets for this page.");
      setIsAlertModalOpen(true);
    } catch (error) {
      setIsConfirmModalOpen(false);
      setAlertMessage("An error occurred while trying to clear data. Please try again.");
      setIsAlertModalOpen(true);
    }
  };

  const handleReload = () => {
    setIsAlertModalOpen(false);
    // Use a more controlled approach to reload the page
    window.location.href = window.location.pathname;
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
          onClick={openClearDataModal}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg focus:outline-none focus:shadow-outline"
          title="Clears all data stored by this site in your browser (localStorage) and forces a page refresh from the server for the current page."
        >
          Clear Cache & Data
        </button>
      </div>
      */}
      
      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" />}>
          <Modal
            isOpen={isConfirmModalOpen}
            title="Clear Site Data"
            message="Are you sure you want to clear all local site data and refresh? This will log you out and remove any saved preferences for this site."
            confirmLabel="Clear Data"
            cancelLabel="Cancel"
            onConfirm={handleClearDataAndCache}
            onCancel={() => setIsConfirmModalOpen(false)}
          />
        </Suspense>
      )}
      
      {/* Alert Modal */}
      {isAlertModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" />}>
          <AlertModalWrapper
            isOpen={isAlertModalOpen}
            title="Operation Complete"
            message={alertMessage}
            onClose={handleReload}
          />
        </Suspense>
      )}
    </div>
  );
});

export default App;
