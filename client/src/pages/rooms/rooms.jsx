import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Video, LogOut, Link as LinkIcon } from 'lucide-react';

export default function RoomsEntryScreen() {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    navigate('/rooms/create');
  };

  const handleJoinRoom = () => {
    navigate('/rooms/join');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-900 px-4">
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-surface-800 text-white">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary-500">Respawn</h1>
          <p className="text-lg text-gray-300">Drop in. Speak freely.</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            className="w-full py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-md font-medium transition-colors duration-200"
          >
            Create a Room
          </button>
          
          <button
            onClick={handleJoinRoom}
            className="w-full py-3 bg-surface-700 hover:bg-surface-600 text-white rounded-md font-medium transition-colors duration-200"
          >
            Join a Room
          </button>
        </div>
      </div>
    </div>
  );
}
