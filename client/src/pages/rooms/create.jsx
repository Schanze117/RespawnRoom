import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowLeft } from 'lucide-react';

export default function CreateRoom() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const roomId = `room-${Math.random().toString(36).substring(2, 9)}`;
    
    navigate(`/rooms/${roomId}?mode=voice`);
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
        
        <h1 className="text-2xl font-bold mb-6 text-primary-500">Create a Voice Room</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center items-center p-4 bg-surface-700 rounded-md">
            <div className="flex items-center">
              <Mic size={24} className="text-primary-500 mr-3" />
              <span className="font-medium">
                Voice Only Room
              </span>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-md font-medium transition-colors duration-200"
          >
            Create Random Voice Room
          </button>
        </form>
      </div>
    </div>
  );
} 