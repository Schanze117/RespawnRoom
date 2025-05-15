import React from 'react';
import { Mic, MicOff, UserPlus } from 'lucide-react';

const ControlPanel = ({ 
  isMuted, 
  setIsMuted, 
  localTracks, 
  setShowShareModal,
  cleanup
}) => {
  return (
    <div className="flex-none py-6 px-4 bg-surface-800/60 backdrop-blur-md border-t border-surface-700">
      <div className="flex justify-center items-center gap-6">
        {/* Mute/Unmute Button - Large center button */}
        <button
          onClick={() => {
            if (localTracks.length > 0) {
              const audioTrack = localTracks.find(track => track.trackMediaType === 'audio');
              if (audioTrack) {
                audioTrack.setEnabled(isMuted);
                setIsMuted(!isMuted);
              }
            }
          }}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isMuted ? (
            <MicOff size={24} className="text-white" />
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </button>
        
        {/* Invite Friends Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center transition-colors duration-200"
        >
          <UserPlus size={18} className="mr-2" />
          Invite Friends
        </button>

        {/* Leave Room button */}
        <button 
          onClick={cleanup}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default ControlPanel; 