import { Navigate, useLocation } from 'react-router-dom';
import Auth from './auth';
import { useEffect, useState } from 'react';

// ProtectedRoute component that redirects to login if user is not authenticated
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check authentication status
    const authStatus = Auth.loggedIn();
    console.log('ProtectedRoute - Authentication status:', authStatus);
    setIsAuthenticated(authStatus);
    setIsLoading(false);
    
    // If not authenticated, save current path for redirect after login
    if (!authStatus) {
      // Only save meaningful paths, not auth-related paths
      const isAuthPath = ['/login', '/register'].includes(location.pathname) || 
                        location.pathname.includes('logout');
      
      if (!isAuthPath && location.pathname !== '/') {
        // Save non-root, non-auth paths for future redirect
        sessionStorage.setItem('redirectUrl', location.pathname);
        console.log('Saved redirect URL:', location.pathname);
      } else if (location.pathname === '/' && !sessionStorage.getItem('redirectUrl')) {
        // For home page, only save if we don't already have a better redirect
        sessionStorage.setItem('redirectUrl', '/');
        console.log('Saved home as fallback redirect URL');
      }
    }
  }, [location.pathname]);
  
  // Show a minimal loading state
  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('ProtectedRoute - User not authenticated, redirecting to login');
    // Redirect to login if not authenticated - pass state to indicate we're coming from ProtectedRoute
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // If authenticated, render the protected content
  console.log('ProtectedRoute - User authenticated, showing protected content');
  return children;
};

export default ProtectedRoute; 