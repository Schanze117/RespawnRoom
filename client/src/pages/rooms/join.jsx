import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Link as LinkIcon } from 'lucide-react';

export default function JoinRoom() {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState('');
  const [error, setError] = useState('');

  const extractRoomId = (input) => {
    const trimmedInput = input.trim();
    // Regex to match "room-" followed by any characters (alphanumeric typically)
    const roomFormat = /^room-[a-zA-Z0-9]+$/;
    
    if (roomFormat.test(trimmedInput)) {
      return trimmedInput;
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!roomInput.trim()) {
      setError('Please enter a Room ID');
      return;
    }
    
    const roomId = extractRoomId(roomInput);
    
    if (!roomId) {
      setError('Invalid Room ID format. It should be like \'room-abc123\'.');
      return;
    }
    
    // Navigate to the room. Mode will be fetched from server or default in room.jsx
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
              Room ID
            </label>
            <div className="mb-2 text-sm text-gray-400">
              <p className="flex items-center">
                <LinkIcon size={14} className="mr-1.5" />
                Enter the Room ID shared by your friend (e.g., room-abc123)
              </p>
            </div>
            <input
              type="text"
              id="roomInput"
              value={roomInput}
              onChange={(e) => {
                setRoomInput(e.target.value);
                setError(''); // Clear error when input changes
              }}
              placeholder="room-abc123"
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