import React from 'react';
import { Share2, X, Copy, CheckCircle } from 'lucide-react';

const ShareModal = ({ 
  showShareModal, 
  setShowShareModal, 
  roomId, 
  roomIdCopied, 
  setRoomIdCopied, 
  mode, 
  totalUniqueParticipants, 
  MAX_PARTICIPANTS, 
  roomCreationTime 
}) => {
  if (!showShareModal) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
      <div className="glass-modal p-6 max-w-md w-full mx-4 relative">
        <button 
          onClick={() => setShowShareModal(false)} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-semibold text-primary-400 mb-4 flex items-center">
          <Share2 size={20} className="mr-2" />
          Share Room
        </h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Room ID
          </label>
          <div className="flex">
            <input
              type="text"
              readOnly
              value={roomId}
              className="flex-1 px-4 py-2 bg-surface-700/80 border border-surface-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(roomId);
                setRoomIdCopied(true);
                setTimeout(() => setRoomIdCopied(false), 2000);
              }}
              className="px-4 py-2 bg-primary-700 hover:bg-primary-800 transition-colors rounded-r-md"
            >
              {roomIdCopied ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} />}
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">Share this ID with friends so they can join your room</p>
        </div>
        
        <div className="space-y-4">
          <div className="pt-4 border-t border-surface-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Room Information</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex justify-between">
                <span>Mode:</span>
                <span className="font-medium text-primary-400">
                  {mode === 'video' ? 'Video & Voice' : 'Voice Only'}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Participants:</span>
                <span className="font-medium text-primary-400">{totalUniqueParticipants}/{MAX_PARTICIPANTS}</span>
              </li>
              <li className="flex justify-between">
                <span>Created:</span>
                <span className="font-medium text-primary-400">{roomCreationTime || 'N/A'}</span>
              </li>
            </ul>
          </div>
          
          <button
            onClick={() => setShowShareModal(false)}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors duration-200 mt-4"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 