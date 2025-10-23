import React from 'react';
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { logError } from '../utils/errorLogger';

const ErrorPage = () => {
  const navigate = useNavigate();
  const error = useRouteError();
  
  // Log the error to our error reporting service
  React.useEffect(() => {
    if (error) {
      logError(error, 'RouterErrorBoundary', {
        path: window.location.pathname,
      });
    }
  }, [error]);

  // Extract error information based on error type
  let errorMessage = 'An unexpected error occurred';
  let errorDetails = '';
  let statusCode = '';

  if (isRouteErrorResponse(error)) {
    // This is a React Router error response
    statusCode = error.status;
    errorMessage = error.statusText || 'Page not found';
    errorDetails = error.data?.message || '';
  } else if (error instanceof Error) {
    // This is a JavaScript Error object
    errorMessage = error.message || 'Application Error';
    errorDetails = error.stack?.split('\n')[0] || '';
  } else if (typeof error === 'string') {
    // Simple string error
    errorMessage = error;
  }

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-900 text-white p-4">
      <div className="w-full max-w-xl bg-surface-800 rounded-xl shadow-2xl overflow-hidden border-2 border-red-900/30">
        <div className="bg-gradient-to-r from-red-900/40 to-surface-800 p-6 border-b border-red-900/30">
          <div className="flex items-center">
            <div className="h-14 w-14 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold tracking-tight">
                {statusCode ? `Error ${statusCode}` : 'Application Error'}
              </h1>
              <p className="text-red-300/70 mt-1 font-medium text-lg">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {errorDetails && (
            <div className="mb-6 p-3 bg-red-900/10 border border-red-900/20 rounded-md">
              <p className="text-red-300 font-mono text-sm whitespace-pre-wrap break-words">
                {errorDetails}
              </p>
            </div>
          )}
          
          <div>
            <p className="text-gray-300 mb-6">
              Something went wrong while trying to load this page. We've logged this error and our team is looking into it.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={handleGoHome}
                className="px-4 py-2 bg-primary-700 hover:bg-primary-600 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Go Home
              </button>
              
              <button 
                onClick={handleGoBack}
                className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Go Back
              </button>
              
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"></path>
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center max-w-md text-gray-400 text-sm">
        <p>If this problem persists, please contact support or try again later.</p>
        <p className="mt-2">You can also try clearing your browser cache and cookies.</p>
      </div>
    </div>
  );
};

export default ErrorPage; 