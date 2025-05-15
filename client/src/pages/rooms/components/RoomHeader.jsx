import React from 'react';
import { Copy, CheckCircle, Share2 } from 'lucide-react';

const RoomHeader = ({ 
  roomName, 
  mode, 
  totalUniqueParticipants, 
  MAX_PARTICIPANTS, 
  roomId, 
  roomIdCopied, 
  setRoomIdCopied, 
  setShowShareModal 
}) => {
  return (
    <div className="flex-none flex justify-between items-center px-4 py-3 bg-surface-800/90 backdrop-blur-md border-b border-surface-700">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-primary-500 mr-3">{roomName}</h1>
        <span className="bg-surface-700 text-xs px-2 py-1 rounded-full text-gray-300">
          {mode === 'video' ? 'Video & Voice' : 'Voice Only'}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Connection quality indicator */}
        <div className="hidden sm:flex items-center px-3 py-1.5 bg-surface-700/80 rounded text-sm text-gray-300 mr-1">
          <div className="flex space-x-1 mr-2">
            <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
            <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
            <div className="w-1.5 h-3 bg-green-500/60 rounded-sm"></div>
            <div className="w-1.5 h-3 bg-surface-600 rounded-sm"></div>
          </div>
          <span className="text-xs">Good</span>
        </div>
        
        {/* Participants count */}
        <div className="hidden sm:flex items-center px-3 py-1.5 bg-surface-700/80 rounded text-sm text-gray-300">
          <span className="mr-1">{totalUniqueParticipants}</span>
          <span className="text-xs">/ {MAX_PARTICIPANTS}</span>
        </div>
        
        {/* Copy Room ID button */}
        <button 
          onClick={() => {
            navigator.clipboard.writeText(roomId);
            setRoomIdCopied(true);
            setTimeout(() => setRoomIdCopied(false), 2000);
          }}
          className="flex items-center px-3 py-1.5 bg-surface-700/80 hover:bg-surface-600 rounded text-sm text-white transition-colors duration-200"
          title="Copy Room ID"
        >
          {roomIdCopied ? (
            <>
              <CheckCircle size={16} className="mr-1.5 text-green-500" />
              ID Copied!
            </>
          ) : (
            <>
              <Copy size={16} className="mr-1.5" />
              ID
            </>
          )}
        </button>
        
        {/* Share button */}
        <button 
          onClick={() => setShowShareModal(true)}
          className="flex items-center px-3 py-1.5 bg-primary-600/80 hover:bg-primary-700 rounded text-sm text-white transition-colors duration-200"
        >
          <Share2 size={16} className="mr-1.5" />
          Share
        </button>
      </div>
    </div>
  );
};

export default RoomHeader; 