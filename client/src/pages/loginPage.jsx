import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from '@apollo/client';
import { LOGIN_USER } from '../utils/mutations';
import Auth from '../utils/auth';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  // Use Apollo's useMutation hook for the LOGIN_USER mutation
  const [loginUser, { loading }] = useMutation(LOGIN_USER);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const { data } = await loginUser({
        variables: { email: loginData.email, password: loginData.password },
      });
      
      if (data && data.login && data.login.token) {
        // Store token and redirect (this will reload the page)
        Auth.login(data.login.token);
      } else {
        throw new Error('Login failed');
      }
    } catch (err) {
      setError('Failed to login. Please check your credentials and try again.');
    }
  };

  // Verify and handle redirects/authentication
  useEffect(() => {
    // Parse URL parameters first
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    const authError = query.get('error');
    const redirect = query.get('redirect');
    const justLoggedOut = query.get('just_logged_out') === 'true';
    
    // Check if we came from a protected route redirect
    const cameFromProtectedRoute = location.state?.from === 'protectedRoute';
    
    // Handle token in URL (e.g., from Google auth) before anything else
    if (token) {
      // If we have a redirect parameter, save it before processing the token
      if (redirect) {
        sessionStorage.setItem('redirectUrl', redirect);
      }
      // Process the token - this will redirect and reload the page
      setTimeout(() => {
        Auth.login(token);
      }, 100); // Small delay to ensure sessionStorage is set
      return; // Stop further execution
    }
    
    // If user just logged out, clear any redirect URLs to ensure they stay on login page
    if (justLoggedOut) {
      sessionStorage.removeItem('redirectUrl');
    } 
    // If a specific redirect is provided in the URL, save it
    else if (redirect && !justLoggedOut) {
      sessionStorage.setItem('redirectUrl', redirect);
    }
    // If we came from a protected route and have a 'from' in the state
    else if (cameFromProtectedRoute && location.state?.from) {
      if (!sessionStorage.getItem('redirectUrl')) {
        sessionStorage.setItem('redirectUrl', location.state.from);
      }
    }
    
    // Check if user is already logged in
    if (Auth.loggedIn()) {
      // Get redirect URL from session storage or default to home
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      // Don't redirect to login page again
      if (redirectUrl !== '/login') {
        navigate(redirectUrl);
      } else {
        // If redirect would go back to login, go to home instead
        navigate('/');
      }
    }
    
    if (authError) {
      setError('Authentication failed. Please try again.');
    }
  }, [location, navigate]);

  // Define the Google login URL
  let googleUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/auth/google` : "http://localhost:3001/auth/google";

  // Generate Google auth URL with redirect state
  const getGoogleAuthUrl = () => {
    // Get any saved redirect URL from session storage
    const redirectUrl = sessionStorage.getItem('redirectUrl');
    
    // Base Google auth URL
    const baseGoogleUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/auth/google` : "http://localhost:3001/auth/google";
    
    // Add state parameter with redirect URL if available
    if (redirectUrl) {
      // URL encode the redirect path
      const encodedRedirect = encodeURIComponent(redirectUrl);
      return `${baseGoogleUrl}?state=${encodedRedirect}`;
    }
    
    return baseGoogleUrl;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121827]">
      <div className="w-full max-w-md p-8 mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-500 mb-2">RespawnRoom</h1>
          <p className="text-gray-400">Log in to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleChange}
                placeholder="Email address"
                className="bg-[#1b2435] text-white w-full pl-10 pr-4 py-3 rounded-md focus:outline-none"
                required
              />
            </div>
          </div>
          
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleChange}
                placeholder="Password"
                className="bg-[#1b2435] text-white w-full pl-10 pr-4 py-3 rounded-md focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-md transition-colors"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-4">OR</p>
          <a
            href={getGoogleAuthUrl()}
            className="flex items-center justify-center w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 rounded-md transition-colors"
          >
            <span className="mr-2">
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </span>
            Continue with Google
          </a>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/register" className="text-white hover:text-green-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}