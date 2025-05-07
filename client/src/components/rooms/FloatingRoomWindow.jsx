import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, Maximize, Minimize, X, Move } from 'lucide-react';
import { useRoomContext } from '../../utils/RoomContext';
import Draggable from 'react-draggable';
import './resizable.css';

export default function FloatingRoomWindow() {
  const { 
    activeRoom, 
    isMinimized, 
    participantCount, 
    position, 
    size,
    showFloatingWindow,
    exitRoom, 
    toggleMinimize, 
    updatePosition,
    updateSize
  } = useRoomContext();
  
  const nodeRef = useRef(null);
  const [resizing, setResizing] = useState(false);
  
  // If there's no active room, don't render anything
  if (!showFloatingWindow || !activeRoom) {
    return null;
  }
  
  // Handle dragging end
  const handleDragStop = (e, data) => {
    updatePosition({ x: data.x, y: data.y });
  };
  
  // Initial position - top right under header by default
  const defaultPosition = { x: window.innerWidth - size.width - 20, y: 70 };
  const currentPosition = position.x !== null ? position : defaultPosition;
  
  // Handle manual resizing with mouse
  const startResize = (e) => {
    e.preventDefault();
    setResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    
    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(250, Math.min(500, startWidth + moveEvent.clientX - startX));
      const newHeight = Math.max(180, Math.min(400, startHeight + moveEvent.clientY - startY));
      updateSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setResizing(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".handle"
      bounds="body"
      position={currentPosition}
      onStop={handleDragStop}
      disabled={resizing}
    >
      <div 
        ref={nodeRef}
        className="fixed rounded-lg overflow-hidden shadow-2xl bg-surface-800 border border-surface-700 z-50"
        style={{
          width: `${size.width}px`,
          height: isMinimized ? '40px' : `${size.height}px`
        }}
      >
        {/* Header with controls */}
        <div className="handle flex justify-between items-center bg-surface-900 p-2 cursor-move">
          <div className="flex items-center">
            <Move size={14} className="mr-2 text-gray-400" />
            <span className="text-primary-500 font-medium truncate">{activeRoom.name || 'Meeting Room'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs bg-surface-700 px-2 py-1 rounded-full text-white">
              {participantCount}/5
            </span>
            <button
              onClick={toggleMinimize}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              {isMinimized ? <Maximize size={14} /> : <Minimize size={14} />}
            </button>
            <Link
              to={`/rooms/${activeRoom.id}`}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <Maximize size={14} />
            </Link>
            <button
              onClick={exitRoom}
              className="p-1 text-red-500 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        
        {/* Content (hidden when minimized) */}
        {!isMinimized && (
          <div className="relative h-[calc(100%-32px)] overflow-hidden">
            <div className="p-2 h-full overflow-hidden">
              {/* Participants */}
              <div className="space-y-2 max-h-[calc(100%-10px)] overflow-y-auto">
                {/* Render participants or placeholder */}
                {activeRoom.participants && activeRoom.participants.length > 0 ? (
                  activeRoom.participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between bg-surface-700 p-2 rounded-md">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center text-xs text-white mr-2">
                          {participant.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm text-white truncate">{participant.name || `User ${index + 1}`}</span>
                      </div>
                      <div className="flex space-x-1">
                        {participant.hasAudio ? (
                          <Mic size={14} className="text-green-500" />
                        ) : (
                          <MicOff size={14} className="text-red-500" />
                        )}
                        {participant.hasVideo ? (
                          <Video size={14} className="text-green-500" />
                        ) : (
                          <VideoOff size={14} className="text-red-500" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    No participants to display
                  </div>
                )}
              </div>
            </div>
            
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
              onMouseDown={startResize}
              style={{
                background: 'transparent'
              }}
            >
              <div className="w-0 h-0 border-b-[6px] border-r-[6px] border-gray-400 absolute right-2 bottom-2"></div>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
} 