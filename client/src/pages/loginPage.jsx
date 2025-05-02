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
      console.error('Failed to login:', err);
      setError('Failed to login. Please check your credentials and try again.');
    }
  };

  // Check for token in URL (Google auth token)
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    const authError = query.get('error');
    
    if (token) {
      Auth.login(token);
    }
    
    if (authError) {
      setError('Authentication failed. Please try again.');
    }
    
    // We're no longer redirecting from login page when already logged in
    // This allows the AuthWrapper to handle all redirects
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center mt-35">
        <div className="w-full max-w-sm p-4 border border-surface-600 rounded-lg shadow-sm sm:p-6 md:p-8 bg-tonal-900">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <h5 className="text-xl font-medium text-light">RespawnRoom // Login</h5>
                <div>
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-light">Email</label>
                    <input 
                    type="email" 
                    name="email" 
                    onChange={handleChange}
                    value={loginData.email} 
                    placeholder="Enter Your Email"
                    className="bg-surface-600 border border-tonal-400 text-light text-sm rounded-lg focus:outline-2 focus:outline-primary-400 focus:outline-offset-2 focus:border-primary-400 block w-full p-2.5" 
                    required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-light">Password</label>
                    <input 
                    type="password" 
                    name="password" 
                    onChange={handleChange}
                    value={loginData.password} 
                    placeholder="Enter Your Password" 
                    className="bg-surface-600 border border-tonal-400 text-light text-sm rounded-lg focus:outline-2 focus:outline-primary-400 focus:outline-offset-2 focus:border-primary-400 block w-full p-2.5"
                    required
                    />
                </div>
                {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
                <button type="submit" className="w-full text-white focus:ring-4 bg-primary-600 hover:bg-primary-700 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center focus:ring-primary-900">
                  {loading ? 'Logging in...' : 'Login to your account'}
                </button>
                
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-tonal-900 text-gray-400">Or</span>
                    </div>
                </div>
                
                <a href="http://localhost:3001/auth/google" className="w-full flex justify-center items-center text-white bg-red-600 hover:bg-red-700 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-4">
                    <svg className="w-4 h-4 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
                        <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z" clipRule="evenodd"/>
                    </svg>
                    Sign in with Google
                </a>
                
                <div className="text-sm font-medium text-gray-300">
                    Not registered? <Link to="/register" className="text-primary-800 hover:underline">Create account</Link>
                </div>
            </form>
        </div>  
    </div>
  );
}