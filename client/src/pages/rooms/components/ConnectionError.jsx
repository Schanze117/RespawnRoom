import React from 'react';

const ConnectionError = ({ connectionError, navigate }) => {
  if (!connectionError) return null;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-900 px-4">
      <div className="text-center p-6 bg-surface-800 rounded-lg shadow-lg max-w-md">
        <div className="text-red-500 text-3xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-primary-400 mb-2">Connection Error</h2>
        <p className="text-gray-300 mb-6">{connectionError}</p>
        <button
          onClick={() => navigate('/rooms')}
          className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-md"
        >
          Return to Rooms
        </button>
      </div>
    </div>
  );
};

export default ConnectionError; 