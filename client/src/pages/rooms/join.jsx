import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function JoinRoom() {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState('');
  const [error, setError] = useState('');

  const extractRoomId = (input) => {
    // Check if it's a direct room ID
    if (input.trim().startsWith('room-') || !input.includes('/')) {
      return input.trim();
    }
    
    // Check if it's a URL
    try {
      const url = new URL(input);
      const pathParts = url.pathname.split('/');
      const roomId = pathParts[pathParts.length - 1];
      
      // Return the room ID if it exists in the URL
      if (roomId) return roomId;
    } catch (e) {
      // Not a valid URL, continue to error
    }
    
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!roomInput.trim()) {
      setError('Please enter a room ID or invite link');
      return;
    }
    
    const roomId = extractRoomId(roomInput);
    
    if (!roomId) {
      setError('Invalid room ID or invite link');
      return;
    }
    
    // Navigate to the room
    navigate(`/rooms/${roomId}`);
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
        
        <h1 className="text-2xl font-bold mb-6 text-primary-500">Join a Room</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="roomInput" className="block text-sm font-medium text-gray-300 mb-2">
              Room ID or Invite Link
            </label>
            <input
              type="text"
              id="roomInput"
              value={roomInput}
              onChange={(e) => {
                setRoomInput(e.target.value);
                setError(''); // Clear error when input changes
              }}
              placeholder="Enter room ID or paste invite link"
              className={`w-full px-4 py-2 bg-surface-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                error ? 'border-red-500' : 'border-surface-600'
              }`}
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-md font-medium transition-colors duration-200"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
} 