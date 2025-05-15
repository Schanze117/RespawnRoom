import React from 'react';
import { ArrowLeft } from 'lucide-react';

const RoomHeader = ({ 
  roomName, 
  mode, 
  totalUniqueParticipants, 
  MAX_PARTICIPANTS, 
  cleanup,
  setShowShareModal 
}) => {
  return (
    <div className="flex-none flex justify-between items-center px-4 py-3 bg-surface-800/90 backdrop-blur-md border-b border-surface-700">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-white mr-3">{roomName}</h1>
        <div className="bg-green-600 text-xs px-2 py-0.5 rounded-full text-white font-medium">
          LIVE
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Participants count */}
        <div className="text-sm text-gray-300">
          <span>Voice Only • {totalUniqueParticipants}/{MAX_PARTICIPANTS} Players</span>
        </div>
        
        {/* Leave Room button - REMOVED */}
      </div>
    </div>
  );
};

export default RoomHeader; 