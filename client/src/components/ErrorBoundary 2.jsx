import React, { Component } from 'react';
import { logError } from '../utils/errorLogger';

/**
 * Error Boundary component that catches errors in its child component tree,
 * logs them, and displays a fallback UI.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our reporting service
    logError(error, 'ErrorBoundary', { 
      componentStack: errorInfo.componentStack,
      component: this.props.componentName || 'Unknown'
    });
    
    this.setState({
      errorInfo: errorInfo
    });
  }

  render() {
    const { hasError } = this.state;
    const { 
      children, 
      fallback,
      resetErrorBoundary 
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided, otherwise use default error UI
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback({ resetErrorBoundary: this.resetErrorBoundary })
          : fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-surface-800 rounded-lg border border-surface-700 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">We're sorry, but this section is having issues.</p>
          {resetErrorBoundary && (
            <button 
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    // When there's no error, render children normally
    return children;
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, errorInfo: null });
    if (this.props.resetErrorBoundary) {
      this.props.resetErrorBoundary();
    }
  }
}

export default ErrorBoundary; 