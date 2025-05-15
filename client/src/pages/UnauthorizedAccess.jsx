import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedAccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 text-white p-4">
      <div className="max-w-lg w-full bg-surface-800 rounded-lg shadow-lg p-8 border border-red-600">
        <div className="flex items-center mb-6">
          <svg 
            className="w-10 h-10 text-red-500 mr-4" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
          <h1 className="text-2xl font-bold">Access Denied</h1>
        </div>
        
        <p className="mb-4">
          You don't have permission to access this resource. This attempt has been logged.
        </p>
        
        <p className="mb-6 text-sm text-gray-400">
          If you believe this is an error, please contact the administrator or try 
          logging in with the appropriate credentials.
        </p>
        
        <div className="flex space-x-4">
          <Link 
            to="/login" 
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md transition-colors text-white font-medium"
          >
            Log In
          </Link>
          <Link 
            to="/" 
            className="px-4 py-2 bg-surface-700 hover:bg-surface-600 rounded-md transition-colors text-white font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedAccess; 