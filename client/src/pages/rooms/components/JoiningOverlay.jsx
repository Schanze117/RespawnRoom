import React from 'react';

const JoiningOverlay = ({ joining, cleanup, navigate }) => {
  if (!joining) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface-900/90 z-50">
      <div className="text-center pulse-animation">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-primary-400 mb-2">Joining Room</h2>
        <p className="text-gray-400 mb-8">Establishing secure connection...</p>
        
        <button
          onClick={() => {
            cleanup();
            navigate('/rooms');
          }}
          className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white rounded-md text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default JoiningOverlay; 