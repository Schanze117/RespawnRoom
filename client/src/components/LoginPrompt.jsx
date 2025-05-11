import React from 'react';
import { Link } from 'react-router-dom';

const LoginPrompt = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900 bg-opacity-95">
      <div className="w-full max-w-md p-6 bg-surface-800 rounded-lg shadow-xl border border-primary-600">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-primary-500 mb-2">Welcome to RespawnRoom</h2>
          <p className="text-light">Please log in to continue</p>
        </div>
        
        <div className="space-y-6">
          <Link 
            to="/login" 
            className="w-full block text-center text-white bg-primary-600 hover:bg-primary-700 py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Log In
          </Link>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-800 text-gray-400">Or</span>
            </div>
          </div>
          
          <a 
            href="http://localhost:3001/auth/google" 
            className="w-full block text-center text-white bg-red-600 hover:bg-red-700 py-3 px-4 rounded-lg font-medium transition-colors items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
              <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z" clipRule="evenodd"/>
            </svg>
            Continue with Google
          </a>
          
          <div className="text-center mt-4">
            <span className="text-light">Don't have an account? </span>
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPrompt; 