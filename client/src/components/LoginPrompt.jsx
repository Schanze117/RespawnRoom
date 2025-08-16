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