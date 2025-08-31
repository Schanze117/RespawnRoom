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
        throw new Error('Login failed - no token received');
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
    
    // Handle token in URL before anything else
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



  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 force-repaint color-accelerate zoom-stable" style={{backgroundColor: '#020817'}}>
      <div className="w-full max-w-md p-8 mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{color: '#6D9F5B'}}>RespawnRoom</h1>
          <p className="text-tonal-400">Log in to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-white px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <div className="relative">
              <span className="input-icon-stable text-tonal-400">
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
                className="bg-surface-800 text-light w-full pl-10 pr-4 py-3 rounded-md focus:outline-none border-2 border-surface-600 focus:border-primary-600 transition-colors"
                required
              />
            </div>
          </div>
          
          <div>
            <div className="relative">
              <span className="input-icon-stable text-tonal-400">
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
                className="bg-surface-800 text-light w-full pl-10 pr-4 py-3 rounded-md focus:outline-none border-2 border-surface-600 focus:border-primary-600 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full text-white font-medium py-3 rounded-md transition-colors"
            style={{backgroundColor: '#6D9F5B'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5a8a4f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#6D9F5B'}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        
        <div className="mt-8 text-center">
          <Link to="/register" className="text-white transition-colors" onMouseEnter={(e) => e.target.style.color = '#6D9F5B'} onMouseLeave={(e) => e.target.style.color = 'white'}>
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