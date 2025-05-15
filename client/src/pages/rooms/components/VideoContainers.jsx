import React from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

const LocalVideoContainer = ({ 
  mode, 
  isVideoOff, 
  isMuted, 
  uniqueRemoteUsers
}) => {
  return (
    <div 
      className="bg-surface-800 rounded-lg overflow-hidden relative flex items-center justify-center transition-all duration-300 video-container"
      style={{ 
        gridArea: uniqueRemoteUsers.length === 0 ? 'a' : 'a',
      }}
    >
      {mode === 'video' ? (
        isVideoOff ? (
          <div className="flex items-center justify-center h-full w-full bg-surface-700/70">
            <div className="avatar-placeholder">
              {localStorage.getItem('username')?.charAt(0) || 'Y'}
            </div>
          </div>
        ) : (
          <div id="local-video" className="h-full w-full bg-surface-700/70 flex items-center justify-center object-cover">
            {/* Video will be inserted here by Agora */}
          </div>
        )
      ) : (
        <div className="flex items-center justify-center h-full w-full bg-surface-700/70">
          <div className="avatar-placeholder">
            {localStorage.getItem('username')?.charAt(0) || 'Y'}
          </div>
        </div>
      )}
      
      {/* Participant label */}
      <div className="user-label">
        <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
        {localStorage.getItem('username') || 'You'}
      </div>
      
      <div className="media-indicator media-indicator-left">
        {isMuted ? (
          <MicOff size={16} className="text-red-400" />
        ) : (
          <Mic size={16} className="text-green-400" />
        )}
      </div>

      {mode === 'video' && (
        <div className="media-indicator media-indicator-right">
          {isVideoOff ? (
            <VideoOff size={16} className="text-red-400" />
          ) : (
            <Video size={16} className="text-green-400" />
          )}
        </div>
      )}

      {uniqueRemoteUsers.length === 0 && (
        <div className="absolute bottom-3 py-1 px-3 bg-surface-900/80 rounded-full text-xs text-gray-300 left-1/2 transform -translate-x-1/2">
          You're the only one here
        </div>
      )}
    </div>
  );
};

const RemoteVideoContainer = ({ 
  user, 
  index, 
  mode 
}) => {
  // Assign grid areas based on index: b, c, d, etc.
  const gridArea = String.fromCharCode(98 + index); // 98 is ASCII for 'b'
  const hasActiveVideo = user.videoTrack && user.video;
  
  // Get display name - use username if available, fallback to uid or generic name
  const displayName = user.username || localStorage.getItem('username') || `User ${user.uid?.toString()?.slice(-4)}`;
  
  return (
    <div 
      key={user.uid} 
      className="bg-surface-800 rounded-lg overflow-hidden relative flex items-center justify-center transition-all duration-300 video-container"
      style={{ gridArea }}
    >
      {hasActiveVideo ? (
        <div id={`remote-video-${user.uid}`} className="h-full w-full bg-surface-700/70 flex items-center justify-center object-cover">
          {/* Video will be inserted here by Agora */}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full w-full bg-surface-700/70">
          <div className="avatar-placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      
      {/* Participant label */}
      <div className="user-label">
        <div className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
        {displayName}
      </div>
      
      <div className="media-indicator media-indicator-left">
        {!user.hasAudio || !user.audioTrack ? (
          <MicOff size={16} className="text-red-400" />
        ) : (
          <Mic size={16} className="text-green-400" />
        )}
      </div>

      {/* Video status indicator - only show in video mode */}
      {mode === 'video' && (
        <div className="media-indicator media-indicator-right">
          {!hasActiveVideo ? (
            <VideoOff size={16} className="text-red-400" />
          ) : (
            <Video size={16} className="text-green-400" />
          )}
        </div>
      )}
    </div>
  );
};

const VideoGrid = ({ 
  mode, 
  isVideoOff, 
  isMuted, 
  uniqueRemoteUsers, 
  totalUniqueParticipants, 
  getGridLayout 
}) => {
  return (
    <div 
      className="grid w-full h-full gap-3 mx-auto"
      style={{
        gridTemplateColumns: getGridLayout(totalUniqueParticipants).columns,
        gridTemplateRows: getGridLayout(totalUniqueParticipants).rows,
        gridTemplateAreas: getGridLayout(totalUniqueParticipants).areas,
        minHeight: totalUniqueParticipants <= 2 ? '80vh' : '40vh'
      }}
    >
      {/* Local user */}
      <LocalVideoContainer 
        mode={mode}
        isVideoOff={isVideoOff}
        isMuted={isMuted}
        uniqueRemoteUsers={uniqueRemoteUsers}
      />
      
      {/* Remote users */}
      {uniqueRemoteUsers.map((user, index) => (
        <RemoteVideoContainer 
          key={user.uid}
          user={user}
          index={index}
          mode={mode}
        />
      ))}
    </div>
  );
};

export { VideoGrid, LocalVideoContainer, RemoteVideoContainer }; 