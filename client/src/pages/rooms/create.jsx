import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Video, ArrowLeft } from 'lucide-react';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [isVoiceOnly, setIsVoiceOnly] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generate a random room ID if no name was provided
    const roomId = roomName.trim() || `room-${Math.random().toString(36).substring(2, 9)}`;
    
    // Navigate to the room with the mode query parameter
    navigate(`/rooms/${roomId}?mode=${isVoiceOnly ? 'voice' : 'video'}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-900 px-4">
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-surface-800 text-white">
        <button 
          onClick={() => navigate('/rooms')}
          className="flex items-center text-primary-400 hover:text-primary-500 mb-6"
        >
          <ArrowLeft size={18} className="mr-1" />
          Back
        </button>
        
        <h1 className="text-2xl font-bold mb-6 text-primary-500">Create a Room</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
              Room Name (optional)
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name or leave blank for random ID"
              className="w-full px-4 py-2 bg-surface-700 border border-surface-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex justify-between items-center p-4 bg-surface-700 rounded-md">
            <div className="flex items-center">
              {isVoiceOnly ? (
                <Mic size={24} className="text-primary-500 mr-3" />
              ) : (
                <Video size={24} className="text-primary-500 mr-3" />
              )}
              <span className="font-medium">
                {isVoiceOnly ? 'Voice Only' : 'Voice + Video'}
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsVoiceOnly(!isVoiceOnly)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 focus:outline-none ${
                isVoiceOnly ? 'bg-surface-600' : 'bg-primary-600'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform transition-transform duration-200 rounded-full bg-white ${
                  isVoiceOnly ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-md font-medium transition-colors duration-200"
          >
            Start Room
          </button>
        </form>
      </div>
    </div>
  );
} 