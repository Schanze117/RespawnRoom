import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Video, LogOut, Link as LinkIcon } from 'lucide-react';

export default function RoomsEntryScreen() {
  const navigate = useNavigate();
  
  // Nickname state
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isNicknameSet, setIsNicknameSet] = useState(false);

  // Load nickname from localStorage on mount
  useEffect(() => {
    const storedNickname = localStorage.getItem('nickname');
    if (storedNickname) {
      setNickname(storedNickname);
      setIsNicknameSet(true);
    }
  }, []);

  const handleNicknameChange = (e) => {
    const newNickname = e.target.value;
    if (newNickname.length > 12) {
      setNicknameError('Nickname cannot exceed 12 characters.');
    } else {
      setNicknameError('');
    }
    setNickname(newNickname);
    setIsNicknameSet(false); // Mark as not set until explicitly saved
  };

  const handleNicknameSave = () => {
    if (nickname.trim() === '') {
      setNicknameError('Nickname cannot be empty.');
      return;
    }
    if (nickname.length > 12) {
      setNicknameError('Nickname cannot exceed 12 characters.');
      return;
    }
    localStorage.setItem('nickname', nickname.trim());
    setIsNicknameSet(true);
    setNicknameError(''); // Clear error on successful save
  };

  const handleCreateRoom = () => {
    if (!isNicknameSet) {
      setNicknameError('Please set a nickname before creating a room.');
      return;
    }
    navigate('/rooms/create');
  };

  const handleJoinRoom = () => {
    if (!isNicknameSet) {
      setNicknameError('Please set a nickname before joining a room.');
      return;
    }
    navigate('/rooms/join');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-900 px-4">
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-surface-800 text-white">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary-500">Respawn</h1>
          <p className="text-lg text-gray-300">Drop in. Speak freely.</p>
        </div>
        
        {/* Nickname Input Section */}
        <div className="mb-6 pb-6 border-b border-surface-700">
          <h2 className="text-xl font-semibold text-white mb-3">Set Your Nickname</h2>
          {isNicknameSet && (
            <p className="text-sm text-green-400 mb-3">Current Nickname: {nickname}</p>
          )}
          {!isNicknameSet && (
            <p className="text-sm text-yellow-400 mb-3">Please set a nickname to join rooms.</p>
          )}
          <div className="flex flex-col space-y-3">
            <input
              type="text"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="Enter your nickname (max 12 chars)"
              className="w-full px-4 py-2 border border-surface-700 rounded-md bg-surface-700 text-white focus:ring-primary-500 focus:border-primary-500"
              maxLength="15" // Allow typing a bit more to show validation
            />
            <button
              onClick={handleNicknameSave}
              disabled={nickname.trim() === '' || nickname.length > 12 || !!nicknameError}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Nickname
            </button>
            {nicknameError && <p className="text-red-500 text-sm mt-2">{nicknameError}</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            className="w-full py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isNicknameSet}
          >
            Create a Room
          </button>
          
          <button
            onClick={handleJoinRoom}
            className="w-full py-3 bg-surface-700 hover:bg-surface-600 text-white rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isNicknameSet}
          >
            Join a Room
          </button>
        </div>
      </div>
    </div>
  );
}
