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
    console.log('🔍 PROTECTED ROUTE DEBUG: Checking authentication status...');
    const authStatus = Auth.loggedIn();
    console.log('🔍 PROTECTED ROUTE DEBUG: Auth.loggedIn() returned:', authStatus);
    
    setIsAuthenticated(authStatus);
    setIsLoading(false);
    
    // If not authenticated, save current path for redirect after login
    if (!authStatus) {
      console.log('🔍 PROTECTED ROUTE DEBUG: User not authenticated, saving redirect path...');
      
      // Only save meaningful paths, not auth-related paths
      const isAuthPath = ['/login', '/register'].includes(location.pathname) || 
                        location.pathname.includes('logout');
      
      if (!isAuthPath && location.pathname !== '/') {
        // Save non-root, non-auth paths for future redirect
        console.log('🔍 PROTECTED ROUTE DEBUG: Saving redirect path:', location.pathname);
        sessionStorage.setItem('redirectUrl', location.pathname);
      } else if (location.pathname === '/' && !sessionStorage.getItem('redirectUrl')) {
        // For home page, only save if we don't already have a better redirect
        console.log('🔍 PROTECTED ROUTE DEBUG: Saving home page as redirect path');
        sessionStorage.setItem('redirectUrl', '/');
      }
    } else {
      console.log('🔍 PROTECTED ROUTE DEBUG: User is authenticated, allowing access');
    }
  }, [location.pathname]);
  
  // Block direct access to API endpoints through client routes
  if (location.pathname.includes('/graphql') || 
      location.pathname.includes('/api/') || 
      location.pathname.startsWith('/api')) {
    return <Navigate to="/unauthorized" state={{ from: location.pathname }} replace />;
  }
  
  // Show a minimal loading state
  if (isLoading) {
    console.log('🔍 PROTECTED ROUTE DEBUG: Still loading, showing loading state');
    return <div className="p-4 text-center">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('🔍 PROTECTED ROUTE DEBUG: Not authenticated, redirecting to login from:', location.pathname);
    // Redirect to login if not authenticated - pass state to indicate we're coming from ProtectedRoute
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // If authenticated, render the protected content
  console.log('🔍 PROTECTED ROUTE DEBUG: Authenticated, rendering protected content for:', location.pathname);
  return children;
};

export default ProtectedRoute; 