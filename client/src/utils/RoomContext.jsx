import React, { createContext, useState, useContext, useEffect } from 'react';

// Create a context
const RoomContext = createContext();

// Custom hook to use the room context
export const useRoomContext = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
  // Active room state
  const [activeRoom, setActiveRoom] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [position, setPosition] = useState({ x: null, y: null });
  const [size, setSize] = useState({ width: 300, height: 250 });
  const [showFloatingWindow, setShowFloatingWindow] = useState(false);

  // Debug log the context state
  useEffect(() => {
    if (activeRoom) {
      console.log('RoomContext: active room updated', {
        id: activeRoom.id,
        participants: participantCount,
        showWindow: showFloatingWindow
      });
    }
  }, [activeRoom, participantCount, showFloatingWindow]);

  // Enter a room and update room data
  const enterRoom = (roomData) => {
    console.log('Entering room:', roomData.id);
    setActiveRoom(roomData);
    setShowFloatingWindow(false); // Initially hidden until user navigates away
    setIsMinimized(false);
  };

  // Exit a room and hide the floating window
  const exitRoom = () => {
    console.log('Exiting room');
    setActiveRoom(null);
    setShowFloatingWindow(false);
    setParticipantCount(0);
  };

  // Toggle minimized state
  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  // Update participant count
  const updateParticipantCount = (count) => {
    setParticipantCount(count);
  };

  // Update position
  const updatePosition = (newPosition) => {
    setPosition(newPosition);
  };

  // Update size
  const updateSize = (newSize) => {
    setSize(newSize);
  };

  // Reset position to default (top right)
  const resetPosition = () => {
    setPosition({ x: null, y: null });
  };

  // Check pathname and show/hide floating window
  const checkPathAndToggleWindow = (pathname) => {
    if (!activeRoom) return;
    
    console.log('Checking path for room window:', pathname);
    
    // Check if we're currently on a room page
    const isRoomPage = pathname.startsWith('/rooms/') && 
                       pathname !== '/rooms' && 
                       pathname !== '/rooms/create' && 
                       pathname !== '/rooms/join';
    
    // If we're not on a room page and have an active room, show floating window
    const shouldShow = !isRoomPage;
    
    console.log('Should show floating window:', shouldShow);
    setShowFloatingWindow(shouldShow);
  };

  // Context value
  const contextValue = {
    activeRoom,
    isMinimized,
    participantCount,
    position,
    size,
    showFloatingWindow,
    enterRoom,
    exitRoom,
    toggleMinimize,
    updateParticipantCount,
    updatePosition,
    updateSize,
    resetPosition,
    checkPathAndToggleWindow
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
};

export default RoomContext; 