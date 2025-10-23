import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { ADD_USER } from "../utils/mutations";
import Auth from "../utils/auth";

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const [registerForm, setRegisterForm] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  // Use Apollo's useMutation hook for the ADD_USER mutation
  const [addUser, { loading }] = useMutation(ADD_USER, {
    errorPolicy: 'all'
  });

  // Handle URL parameters and authentication redirects
  useEffect(() => {
    // Parse URL parameters
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    const redirect = query.get('redirect');
    
    // Handle token in URL
    if (token) {
      // If we have a redirect parameter, save it before processing the token
      if (redirect) {
        sessionStorage.setItem('redirectUrl', redirect);
      }
      
      // Process the token - this will redirect and reload the page
      Auth.login(token);
      return; // Stop further execution
    }
    
    // Check if user is already logged in
    if (Auth.loggedIn()) {
      // Get redirect URL from session storage or default to home
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      
      // Don't redirect to register page again
      if (redirectUrl !== '/register' && redirectUrl !== '/login') {
        navigate(redirectUrl);
      } else {
        // If redirect would go back to auth pages, go to home instead
        navigate('/');
      }
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent the username from exceeding 12 characters
    if (name === 'userName' && value.length > 12) {
      setError("Username cannot exceed 12 characters");
      return;
    }
    
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when typing (if the error was about username length)
    if (error === "Username cannot exceed 12 characters") {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (
      !registerForm.userName ||
      !registerForm.email ||
      !registerForm.password ||
      !registerForm.confirmPassword
    ) {
      setError("Please fill out all fields");
      return;
    }
    
    // Validate username length
    if (registerForm.userName.length > 12) {
      setError("Username cannot exceed 12 characters");
      return;
    }
    
    // Prevent password from being the same as username or email
    if (registerForm.password === registerForm.userName || 
        registerForm.password === registerForm.email) {
      setError("Password cannot be the same as your username or email");
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Use the ADD_USER mutation
      const { data, errors } = await addUser({
        variables: {
          userName: registerForm.userName,
          email: registerForm.email,
          password: registerForm.password,
        },
      });

      // Check if there are errors in the response
      if (errors && errors.length > 0) {
        setError(errors[0].message);
        return;
      }

      // Check if data and token are present
      if (!data || !data.addUser || !data.addUser.token) {
        setError("Registration failed. Please try again later.");
        return;
      }

      Auth.login(data.addUser.token);
    } catch (err) {
      // Handle GraphQL errors (most specific)
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        setError(err.graphQLErrors[0].message);
      }
      // Handle network errors with details
      else if (err.networkError) {
        if (err.networkError.result?.errors?.[0]?.message) {
          setError(err.networkError.result.errors[0].message);
        } else {
          setError('Network error. Please check your connection.');
        }
      }
      // Handle other errors with messages
      else if (err.message && !err.message.includes('null')) {
        setError(err.message);
      }
      // Fallback error
      else {
        setError("Registration failed. Please try again later.");
      }
    }
  };



  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121827]">
      <div className="w-full max-w-md p-8 mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-500 mb-2">RespawnRoom</h1>
          <p className="text-gray-400">Create a new account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-white px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                name="userName"
                value={registerForm.userName}
                onChange={handleChange}
                placeholder="Username (max 12 characters)"
                maxLength="12"
                className="bg-[#1b2435] text-white w-full pl-10 pr-4 py-3 rounded-md focus:outline-none"
                required
              />
            </div>
          </div>
          
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
                value={registerForm.email}
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
                value={registerForm.password}
                onChange={handleChange}
                placeholder="Password"
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
                name="confirmPassword"
                value={registerForm.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="bg-[#1b2435] text-white w-full pl-10 pr-4 py-3 rounded-md focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-md transition-colors mt-6"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        

        
        <div className="mt-8 text-center">
          <Link to="/login" className="text-white hover:text-green-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
}