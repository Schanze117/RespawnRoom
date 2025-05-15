import React, { createContext, useState, useContext, useEffect } from 'react';
import Auth from './auth';

// Create a context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount and token changes
  useEffect(() => {
    const checkAuthStatus = () => {
      setLoading(true);
      try {
        const isLoggedIn = Auth.loggedIn();
        
        if (isLoggedIn) {
          // Get user profile from token
          const userProfile = Auth.getProfile();
          setUser({
            id: userProfile._id,
            username: userProfile.userName,
            email: userProfile.email
          });
        } else {
          // User is not logged in
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkAuthStatus();

    // Set up storage event listener to handle auth changes in other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'jwtToken') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Login function
  const login = (token) => {
    Auth.login(token);
    // Auth.login will handle the redirect, so we don't need to set user here
  };

  // Logout function
  const logout = () => {
    Auth.logout();
    // Auth.logout will handle the redirect, so we don't need to clear user here
  };

  // Context value
  const contextValue = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 