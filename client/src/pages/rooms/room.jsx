import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, LogOut, Copy, CheckCircle, Link as LinkIcon, Share2, X } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';

// Add a style block at the top of the component to define special CSS for videos
const videoContainerStyles = `
  .video-container {
    min-height: 160px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .video-container:hover {
    border-color: rgba(var(--color-primary-500), 0.7);
    transform: scale(1.01);
    z-index: 1;
  }

  @media (max-width: 640px) {
    .video-container {
      min-height: 120px;
    }
  }

  /* Improve Agora video rendering */
  .video-container video {
    object-fit: contain !important;
    width: 100% !important;
    height: 100% !important;
  }
`;

// Helper function to determine grid layout based on participant count
const getGridLayout = (count) => {
  // Discord-style layouts for different participant counts
  switch (count) {
    case 1:
      return { 
        columns: '1fr', 
        rows: '1fr',
        areas: '"a"' 
      };
    case 2:
      return { 
        columns: '1fr 1fr', 
        rows: '1fr',
        areas: '"a b"' 
      };
    case 3:
      return { 
        columns: '1fr 1fr', 
        rows: '1fr 1fr',
        areas: '"a a" "b c"' 
      };
    case 4:
      return { 
        columns: 'repeat(2, 1fr)', 
        rows: 'repeat(2, 1fr)',
        areas: '"a b" "c d"' 
      };
    case 5:
      return { 
        columns: 'repeat(2, 1fr) 1fr', 
        rows: 'repeat(2, 1fr)',
        areas: '"a b c" "d e c"' 
      };
    case 6:
      return { 
        columns: 'repeat(3, 1fr)', 
        rows: 'repeat(2, 1fr)',
        areas: '"a b c" "d e f"' 
      };
    case 7:
      return { 
        columns: 'repeat(3, 1fr)', 
        rows: 'repeat(3, 1fr)',
        areas: '"a b c" "d e f" "g g g"' 
      };
    case 8:
      return { 
        columns: 'repeat(3, 1fr)', 
        rows: 'repeat(3, 1fr)',
        areas: '"a b c" "d e f" "g h h"' 
      };
    case 9:
      return { 
        columns: 'repeat(3, 1fr)', 
        rows: 'repeat(3, 1fr)',
        areas: '"a b c" "d e f" "g h i"' 
      };
    default:
      // For more than 9 participants, use a responsive grid
      return { 
        columns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        rows: 'auto',
        areas: null
      };
  }
};

// Initialize Agora client
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export default function Room() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode') || 'voice'; // Default to voice only

  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(mode === 'voice');
  const [joining, setJoining] = useState(true);
  const [copied, setCopied] = useState(false);
  const [roomIdCopied, setRoomIdCopied] = useState(false);
  const [roomName] = useState('Respawn Room');
  const [connectionError, setConnectionError] = useState('');
  const [tokenDetails, setTokenDetails] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Use a more deterministic UID when using tokens
  const uid = useRef(Math.floor(Math.random() * 100000));

  // Fetch token from server
  const fetchToken = async (channelName) => {
    try {
      const response = await fetch(`/api/agora/token?channel=${channelName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token from server');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Token generation failed');
      }
      return data;
    } catch (error) {
      return null;
    }
  };

  // Join Agora channel
  useEffect(() => {
    // Set up event listeners for Agora
    const setupEventListeners = () => {
      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);
      client.on('user-left', handleUserLeft);
    };

    // Clean up resources
    const cleanup = () => {
      if (localTracks.length > 0) {
        localTracks.forEach(track => track.close());
      }
      client.removeAllListeners();
      client.leave().catch(err => console.error('Error leaving channel:', err));
    };

    const join = async () => {
      try {
        // Set up event listeners
        setupEventListeners();
        
        // Attempt token-based authentication first (recommended)
        const tokenData = await fetchToken(roomId);
        
        if (tokenData && tokenData.token) {
          setTokenDetails(tokenData);
          
          try {
            // Join with token
            await client.join(tokenData.appId, roomId, tokenData.token, tokenData.uid || uid.current);
            
            // Create and publish tracks based on mode
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            let tracks = [audioTrack];
            
            if (mode === 'video') {
              try {
                const videoTrack = await AgoraRTC.createCameraVideoTrack({
                  encoderConfig: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 360, ideal: 720, max: 1080 },
                    frameRate: 30,
                    bitrateMin: 400, 
                    bitrateMax: 1000
                  }
                });
                tracks.push(videoTrack);
                setIsVideoOff(false);
              } catch (err) {
                setConnectionError('Could not access camera. Using voice only mode.');
                setIsVideoOff(true);
              }
            }
            
            // Save tracks to local state
            setLocalTracks(tracks);
            
            // Publish tracks
            await client.publish(tracks);
            
            // Joining complete
            setJoining(false);
          } catch (err) {
            setConnectionError(`Failed to join room: ${err.message}`);
            cleanup();
          }
        } else {
          // Fallback to direct join if token fails
          try {
            // Direct join without token
            await client.join(import.meta.env.VITE_AGORA_APP_ID, roomId, null, uid.current);
            
            // Create and publish tracks
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            let tracks = [audioTrack];
            
            if (mode === 'video') {
              try {
                const videoTrack = await AgoraRTC.createCameraVideoTrack({
                  encoderConfig: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 360, ideal: 720, max: 1080 },
                    frameRate: 30
                  }
                });
                tracks.push(videoTrack);
                setIsVideoOff(false);
              } catch (err) {
                setConnectionError('Could not access camera. Using voice only mode.');
                setIsVideoOff(true);
              }
            }
            
            setLocalTracks(tracks);
            await client.publish(tracks);
            setJoining(false);
          } catch (err) {
            setConnectionError(`Failed to join room: ${err.message}`);
            cleanup();
          }
        }
      } catch (err) {
        setConnectionError(`Connection error: ${err.message}`);
        cleanup();
      }
    };

    join();

    // Cleanup on unmount
    return cleanup;
  }, [roomId, mode]);

  const handleUserPublished = async (user, mediaType) => {
    // Subscribe to the remote user
    await client.subscribe(user, mediaType);
    
    // Update state with the new user's stream
    setRemoteUsers(prev => {
      return {
        ...prev,
        [user.uid]: {
          ...prev[user.uid],
          [mediaType]: true,
          user
        }
      };
    });
    
    // Handle audio playback
    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }
    
    // Handle video container setup
    if (mediaType === 'video') {
      // Ensure we have a container for the video before playing
      const playerContainer = document.getElementById(`player-${user.uid}`);
      if (playerContainer) {
        user.videoTrack?.play(`player-${user.uid}`);
      } else {
        // If container doesn't exist, set a small delay and try again
        setTimeout(() => {
          const container = document.getElementById(`player-${user.uid}`);
          if (container) {
            user.videoTrack?.play(`player-${user.uid}`);
          }
        }, 200);
      }
    }
  };

  const handleUserUnpublished = (user, mediaType) => {
    // Update state to reflect the unpublished track
    setRemoteUsers(prev => {
      const updatedUser = { ...prev[user.uid] };
      if (updatedUser) {
        updatedUser[mediaType] = false;
      }
      return { ...prev, [user.uid]: updatedUser };
    });
  };

  const handleUserLeft = (user) => {
    setRemoteUsers(prev => {
      const updatedUsers = { ...prev };
      if (updatedUsers[user.uid]) {
        delete updatedUsers[user.uid];
      }
      return updatedUsers;
    });
  };

  const toggleMute = async () => {
    if (localTracks.length > 0) {
      const audioTrack = localTracks.find(track => track.trackMediaType === 'audio');
      if (audioTrack) {
        try {
          if (isMuted) {
            await audioTrack.setEnabled(true);
          } else {
            await audioTrack.setEnabled(false);
          }
          setIsMuted(!isMuted);
        } catch (error) {
          console.error('Error toggling mute:', error);
        }
      } else {
        console.warn('No audio track found');
      }
    } else {
      console.warn('No local tracks available');
    }
  };

  const toggleVideo = async () => {
    if (mode === 'video' && localTracks.length > 0) {
      const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
      
      if (videoTrack) {
        try {
          if (isVideoOff) {
            await videoTrack.setEnabled(true);
          } else {
            await videoTrack.setEnabled(false);
          }
          setIsVideoOff(!isVideoOff);
        } catch (error) {
          console.error('Error toggling video:', error);
        }
      } else {
        // Try to create a video track if one doesn't exist
        try {
          console.log('No video track found, creating one');
          const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 360, ideal: 720, max: 1080 },
              frameRate: 30
            }
          });
          
          // Set initial state
          newVideoTrack.setEnabled(true);
          setIsVideoOff(false);
          
          // Publish the new track
          await client.publish(newVideoTrack);
          
          // Add to local tracks
          setLocalTracks(prev => [...prev, newVideoTrack]);
        } catch (error) {
          console.error('Error creating video track:', error);
        }
      }
    } else if (mode !== 'video') {
      console.warn('Not in video mode');
    } else {
      console.warn('No local tracks available');
    }
  };

  const leaveRoom = async () => {
    localTracks.forEach(track => track.close());
    await client.leave();
    navigate('/rooms');
  };

  // Function to copy the room ID directly
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setRoomIdCopied(true);
    setTimeout(() => setRoomIdCopied(false), 2000);
  };

  // Function to copy the invitation link
  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/rooms/join?room=${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Function to toggle the share modal
  const toggleShareModal = () => {
    setShowShareModal(!showShareModal);
  };

  // Render local video view
  useEffect(() => {
    if (localTracks.length > 0 && mode === 'video') {
      const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
      if (videoTrack && !isVideoOff) {
        videoTrack.play('local-video', { fit: 'contain' });
      }
    }
  }, [localTracks, isVideoOff, mode]);

  // Render remote video views - Update for more robustness
  useEffect(() => {
    Object.values(remoteUsers).forEach(user => {
      if (user.videoTrack && user.hasVideo) {
        try {
          // Make sure container exists before trying to play
          const container = document.getElementById(`remote-video-${user.uid}`);
          if (container) {
            // Use fit mode to maintain aspect ratio while filling the space
            user.videoTrack.play(`remote-video-${user.uid}`, { fit: 'contain' });
          } else {
            console.warn(`Container for remote user ${user.uid} not found`);
          }
        } catch (error) {
          console.error(`Error playing video for user ${user.uid}:`, error);
        }
      }
    });
  }, [remoteUsers]);

  if (joining) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-900">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 mb-4 text-primary-500 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-primary-400">Joining Respawn Room...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-900 px-4">
        <div className="text-center p-6 bg-surface-800 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-3xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-primary-400 mb-2">Connection Error</h2>
          <p className="text-gray-300 mb-6">{connectionError}</p>
          <button
            onClick={() => navigate('/rooms')}
            className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-md"
          >
            Return to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-surface-900">
      {/* Inject our custom CSS */}
      <style>{videoContainerStyles}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-surface-800 border-b border-surface-700">
        <h1 className="text-xl font-semibold text-primary-500">{roomName}</h1>
        <div className="flex space-x-2">
          {/* Copy Room ID button */}
          <button 
            onClick={copyRoomId}
            className="flex items-center px-3 py-1.5 bg-surface-700 hover:bg-surface-600 rounded text-sm text-white transition-colors duration-200"
            title="Copy Room ID"
          >
            {roomIdCopied ? (
              <>
                <CheckCircle size={16} className="mr-1.5 text-green-500" />
                ID Copied!
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1.5" />
                Copy ID
              </>
            )}
          </button>

          {/* Copy Invite Link button */}
          <button 
            onClick={copyInviteLink}
            className="flex items-center px-3 py-1.5 bg-surface-700 hover:bg-surface-600 rounded text-sm text-white transition-colors duration-200"
            title="Copy Invite Link"
          >
            {copied ? (
              <>
                <CheckCircle size={16} className="mr-1.5 text-green-500" />
                Link Copied!
              </>
            ) : (
              <>
                <LinkIcon size={16} className="mr-1.5" />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-4 overflow-y-auto relative flex flex-col">
        <div className="flex-1 flex justify-center items-center w-full h-full min-h-[300px]">
          {/* Discord-style adaptive grid */}
          <div 
            className="grid w-full h-full gap-3"
            style={{
              gridTemplateColumns: getGridLayout(Object.keys(remoteUsers).length + 1).columns,
              gridTemplateRows: getGridLayout(Object.keys(remoteUsers).length + 1).rows,
              gridTemplateAreas: getGridLayout(Object.keys(remoteUsers).length + 1).areas,
              minHeight: '100%'
            }}
          >
            {/* Local user */}
            <div 
              className="bg-surface-800 rounded-lg overflow-hidden relative flex items-center justify-center transition-all duration-300 video-container"
              style={{ 
                gridArea: Object.keys(remoteUsers).length === 0 ? 'a' : 'a',
              }}
            >
              {mode === 'video' ? (
                isVideoOff ? (
                  <div className="flex items-center justify-center h-full w-full bg-surface-700">
                    <div className="w-20 h-20 rounded-full bg-surface-600 flex items-center justify-center text-xl font-bold text-white">
                      You
                    </div>
                  </div>
                ) : (
                  <div id="local-video" className="h-full w-full bg-surface-700 flex items-center justify-center object-cover">
                    {/* Video will be inserted here by Agora */}
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-surface-700">
                  <div className="w-20 h-20 rounded-full bg-surface-600 flex items-center justify-center text-xl font-bold text-white">
                    You
                  </div>
                </div>
              )}
              
              {/* Participant label */}
              <div className="absolute top-2 left-2 bg-surface-900 bg-opacity-75 px-2 py-1 rounded-full text-xs text-white font-medium">
                You (Host)
              </div>
              
              <div className="absolute bottom-2 left-2 flex items-center bg-surface-900 bg-opacity-75 px-2 py-1 rounded-full">
                {isMuted ? (
                  <MicOff size={16} className="text-red-500" />
                ) : (
                  <Mic size={16} className="text-green-500" />
                )}
              </div>

              {Object.keys(remoteUsers).length === 0 && (
                <div className="absolute bottom-2 right-2 bg-surface-900 bg-opacity-75 px-2 py-1 rounded-full text-xs text-gray-300">
                  Only you in this room
                </div>
              )}
            </div>
            
            {/* Remote users */}
            {Object.values(remoteUsers).map((user, index) => {
              // Assign grid areas based on index: b, c, d, etc.
              const gridArea = String.fromCharCode(98 + index); // 98 is ASCII for 'b'
              const hasActiveVideo = user.videoTrack && user.hasVideo;
              
              return (
                <div 
                  key={user.uid} 
                  className="bg-surface-800 rounded-lg overflow-hidden relative flex items-center justify-center transition-all duration-300 video-container"
                  style={{ gridArea }}
                >
                  {hasActiveVideo ? (
                    <div id={`remote-video-${user.uid}`} className="h-full w-full bg-surface-700 flex items-center justify-center object-cover">
                      {/* Video will be inserted here by Agora */}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-surface-700">
                      <div className="w-20 h-20 rounded-full bg-surface-600 flex items-center justify-center text-xl font-bold text-white">
                        User
                      </div>
                    </div>
                  )}
                  
                  {/* Participant label */}
                  <div className="absolute top-2 left-2 bg-surface-900 bg-opacity-75 px-2 py-1 rounded-full text-xs text-white font-medium">
                    Participant {index + 1}
                  </div>
                  
                  <div className="absolute bottom-2 left-2 flex items-center bg-surface-900 bg-opacity-75 px-2 py-1 rounded-full">
                    {!user.hasAudio || !user.audioTrack ? (
                      <MicOff size={16} className="text-red-500" />
                    ) : (
                      <Mic size={16} className="text-green-500" />
                    )}
                  </div>

                  {/* Video status indicator */}
                  <div className="absolute bottom-2 right-2 flex items-center bg-surface-900 bg-opacity-75 px-2 py-1 rounded-full">
                    {!hasActiveVideo ? (
                      <VideoOff size={16} className="text-red-500" />
                    ) : (
                      <Video size={16} className="text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex justify-center items-center gap-4 py-4 px-4 bg-surface-800 border-t border-surface-700">
        {/* Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-surface-700 hover:bg-surface-600'}`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? (
            <MicOff size={24} className="text-white" />
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </button>
        
        {/* Video Toggle Button - Available regardless of initial mode */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-surface-700 hover:bg-surface-600'}`}
          title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
        >
          {isVideoOff ? (
            <VideoOff size={24} className="text-white" />
          ) : (
            <Video size={24} className="text-white" />
          )}
        </button>
        
        {/* Share Room Button */}
        <button
          onClick={toggleShareModal}
          className="p-3 rounded-full bg-primary-600 hover:bg-primary-700"
          title="Share Room"
        >
          <Share2 size={24} className="text-white" />
        </button>
        
        {/* Leave Room Button */}
        <button
          onClick={leaveRoom}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700"
          title="Leave Room"
        >
          <LogOut size={24} className="text-white" />
        </button>
      </div>

      {/* Share Room Modal */}
      {showShareModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-surface-800 rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button 
              onClick={toggleShareModal} 
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-semibold text-primary-500 mb-4">Share Room</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room ID
              </label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={roomId}
                  className="flex-1 px-4 py-2 bg-surface-700 border border-surface-600 rounded-l-md focus:outline-none text-white"
                />
                <button
                  onClick={copyRoomId}
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-800 rounded-r-md"
                >
                  {roomIdCopied ? <CheckCircle size={20} /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">Share this ID with friends so they can join your room</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={copyRoomId}
                className="w-full py-3 bg-surface-700 hover:bg-surface-600 text-white rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <Copy size={18} className="mr-2" />
                {roomIdCopied ? 'Room ID Copied!' : 'Copy Room ID'}
              </button>
              
              <button
                onClick={copyInviteLink}
                className="w-full py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <LinkIcon size={18} className="mr-2" />
                {copied ? 'Invite Link Copied!' : 'Copy Invite Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 