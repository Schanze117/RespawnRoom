import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Video, ArrowLeft } from 'lucide-react';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [isVoiceOnly, setIsVoiceOnly] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Always generate a random room ID
    const roomId = `room-${Math.random().toString(36).substring(2, 9)}`;
    
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
            Create Random Room
          </button>
        </form>
      </div>
    </div>
  );
} 