import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Create a context
const RoomContext = createContext();

// Custom hook to use the room context
export const useRoomContext = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
  // Active room state
  const [activeRoom, setActiveRoom] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [position, setPosition] = useState({ x: null, y: null });
  const [size, setSize] = useState({ width: 300, height: 250 });
  const [showFloatingWindow, setShowFloatingWindow] = useState(false);
  const [joiningStatus, setJoiningStatus] = useState({ 
    isJoining: false, 
    roomId: null, 
    error: null 
  });

  // Enter a room and update room data
  const enterRoom = useCallback((roomData) => {
    setActiveRoom(roomData);
    setShowFloatingWindow(false); // Initially hidden until user navigates away
    setIsMinimized(false);
    setJoiningStatus({ isJoining: false, roomId: null, error: null });
  }, []);

  // Exit a room and hide the floating window
  const exitRoom = useCallback(() => {
    setActiveRoom(null);
    setShowFloatingWindow(false);
    setParticipantCount(0);
    setJoiningStatus({ isJoining: false, roomId: null, error: null });
  }, []);

  // Start the joining process
  const startJoining = useCallback((roomId) => {
    setJoiningStatus({ isJoining: true, roomId, error: null });
  }, []);

  // Complete the joining process
  const completeJoining = useCallback((success, error = null) => {
    if (success) {
      setJoiningStatus({ isJoining: false, roomId: null, error: null });
    } else {
      setJoiningStatus({ isJoining: false, roomId: null, error });
    }
  }, []);

  // Toggle minimized state
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // Update participant count
  const updateParticipantCount = useCallback((count) => {
    setParticipantCount(count);
  }, []);

  // Update position
  const updatePosition = useCallback((newPosition) => {
    setPosition(newPosition);
  }, []);

  // Update size
  const updateSize = useCallback((newSize) => {
    setSize(newSize);
  }, []);

  // Reset position to default (top right)
  const resetPosition = useCallback(() => {
    setPosition({ x: null, y: null });
  }, []);

  // Check pathname and show/hide floating window
  const checkPathAndToggleWindow = useCallback((pathname) => {
    if (!activeRoom) return;
    
    // Check if we're currently on a room page
    const isRoomPage = pathname.startsWith('/rooms/') && 
                       pathname !== '/rooms' && 
                       pathname !== '/rooms/create' && 
                       pathname !== '/rooms/join';
    
    // If we're not on a room page and have an active room, show floating window
    const shouldShow = !isRoomPage;
    
    setShowFloatingWindow(shouldShow);
  }, [activeRoom]);

  // Update participants list
  const updateParticipants = useCallback((newParticipants) => {
    setParticipants(newParticipants);
    // Update participant count as well
    setParticipantCount(newParticipants.length);
    // Update activeRoom with new participants if room exists
    setActiveRoom(prev => prev ? { ...prev, participants: newParticipants } : null);
  }, []);

  // Context value with memoized callbacks
  const contextValue = {
    activeRoom,
    isMinimized,
    participantCount,
    participants,
    position,
    size,
    showFloatingWindow,
    joiningStatus,
    enterRoom,
    exitRoom,
    toggleMinimize,
    updateParticipantCount,
    updateParticipants,
    updatePosition,
    updateSize,
    resetPosition,
    checkPathAndToggleWindow,
    startJoining,
    completeJoining
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
};

export default RoomContext; 