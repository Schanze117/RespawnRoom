import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, LogOut, Copy, CheckCircle } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';

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
  const [roomName, setRoomName] = useState(roomId.startsWith('room-') ? 'Respawn Room' : roomId);
  const [connectionError, setConnectionError] = useState('');
  const [tokenDetails, setTokenDetails] = useState(null);
  
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
      console.error('Error fetching token:', error);
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

    // Create and publish local tracks
    const createAndPublishTracks = async () => {
      console.log(`Creating local ${mode === 'video' ? 'audio and video' : 'audio only'} tracks`);
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      let tracks = [audioTrack];
      
      if (mode === 'video') {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        tracks.push(videoTrack);
      }
      
      // Publish local tracks
      await client.publish(tracks);
      console.log('Local tracks published successfully');
      return tracks;
    };

    const join = async () => {
      try {
        console.log(`Joining channel ${roomId} with UID ${uid.current}`);
        
        // Set up event listeners
        setupEventListeners();
        
        // Attempt token-based authentication first (recommended)
        console.log('Attempting to fetch token from server...');
        const tokenData = await fetchToken(roomId);
        
        if (tokenData && tokenData.token) {
          console.log('Token received, using token-based authentication');
          setTokenDetails(tokenData);
          
          try {
            // Join with token
            await client.join(tokenData.appId, roomId, tokenData.token, tokenData.uid || uid.current);
            console.log('Successfully joined the channel with token');
            
            // Create and publish tracks
            const tracks = await createAndPublishTracks();
            setLocalTracks(tracks);
            setJoining(false);
            return; // Exit early if successful
          } catch (tokenError) {
            console.error('Error joining with token:', tokenError);
            throw new Error(`Token authentication failed: ${tokenError.message}`);
          }
        } else {
          console.warn('No token available from server, voice chat may be limited');
          throw new Error('Could not retrieve token from server');
        }
      } catch (error) {
        console.error('Error joining channel:', error);
        let errorMessage = `Failed to join room: ${error.message}`;
        
        if (error.message.includes('PERMISSION_DENIED')) {
          errorMessage = 'Microphone or camera access denied. Please grant permissions in your browser settings.';
        } else if (error.message.includes('DEVICE_NOT_FOUND')) {
          errorMessage = 'No microphone or camera detected. Please connect one and try again.';
        } else if (error.message.includes('invalid vendor key') || error.message.includes('CAN_NOT_GET_GATEWAY_SERVER')) {
          errorMessage = 'Voice chat is temporarily unavailable. Please try again later.';
        }
        
        setConnectionError(errorMessage);
        setJoining(false);
      }
    };

    join();

    // Cleanup on unmount
    return cleanup;
  }, [roomId, mode]);

  const handleUserPublished = async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    
    setRemoteUsers(prev => {
      const updatedUsers = { ...prev };
      
      if (!updatedUsers[user.uid]) {
        updatedUsers[user.uid] = { uid: user.uid, audioTrack: null, videoTrack: null };
      }
      
      if (mediaType === 'audio') {
        updatedUsers[user.uid].audioTrack = user.audioTrack;
      } else if (mediaType === 'video') {
        updatedUsers[user.uid].videoTrack = user.videoTrack;
      }
      
      return updatedUsers;
    });
  };

  const handleUserUnpublished = (user, mediaType) => {
    setRemoteUsers(prev => {
      const updatedUsers = { ...prev };
      
      if (updatedUsers[user.uid]) {
        if (mediaType === 'audio') {
          updatedUsers[user.uid].audioTrack = null;
        } else if (mediaType === 'video') {
          updatedUsers[user.uid].videoTrack = null;
        }
        
        // Remove user if they have no tracks
        if (!updatedUsers[user.uid].audioTrack && !updatedUsers[user.uid].videoTrack) {
          delete updatedUsers[user.uid];
        }
      }
      
      return updatedUsers;
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
        if (isMuted) {
          await audioTrack.setEnabled(true);
        } else {
          await audioTrack.setEnabled(false);
        }
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = async () => {
    if (mode === 'video' && localTracks.length > 0) {
      const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
      if (videoTrack) {
        if (isVideoOff) {
          await videoTrack.setEnabled(true);
        } else {
          await videoTrack.setEnabled(false);
        }
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const leaveRoom = async () => {
    localTracks.forEach(track => track.close());
    await client.leave();
    navigate('/rooms');
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/rooms/join?room=${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render local video view
  useEffect(() => {
    if (localTracks.length > 0 && mode === 'video') {
      const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
      if (videoTrack && !isVideoOff) {
        videoTrack.play('local-video');
      }
    }
  }, [localTracks, isVideoOff]);

  // Render remote video views
  useEffect(() => {
    Object.values(remoteUsers).forEach(user => {
      if (user.videoTrack) {
        user.videoTrack.play(`remote-video-${user.uid}`);
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
          <p className="text-primary-400">Joining {roomName}...</p>
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
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-surface-800 border-b border-surface-700">
        <h1 className="text-xl font-semibold text-primary-500">{roomName}</h1>
        <button 
          onClick={copyInviteLink}
          className="flex items-center px-3 py-1.5 bg-surface-700 hover:bg-surface-600 rounded text-sm text-white transition-colors duration-200"
        >
          {copied ? (
            <>
              <CheckCircle size={16} className="mr-1.5 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={16} className="mr-1.5" />
              Copy Invite Link
            </>
          )}
        </button>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className={`grid ${mode === 'video' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'}`}>
          {/* Local user */}
          <div className={`bg-surface-800 rounded-lg overflow-hidden relative ${mode === 'video' ? 'aspect-video' : 'aspect-square'}`}>
            {mode === 'video' ? (
              isVideoOff ? (
                <div className="flex items-center justify-center h-full bg-surface-700">
                  <div className="w-20 h-20 rounded-full bg-surface-600 flex items-center justify-center text-xl font-bold text-white">
                    You
                  </div>
                </div>
              ) : (
                <div id="local-video" className="h-full w-full bg-surface-700"></div>
              )
            ) : (
              <div className="flex items-center justify-center h-full bg-surface-700">
                <div className="w-20 h-20 rounded-full bg-surface-600 flex items-center justify-center text-xl font-bold text-white">
                  You
                </div>
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 flex items-center bg-surface-900 bg-opacity-75 px-2 py-1 rounded-full">
              {isMuted ? (
                <MicOff size={16} className="text-red-500" />
              ) : (
                <Mic size={16} className="text-green-500" />
              )}
            </div>
          </div>
          
          {/* Remote users */}
          {Object.values(remoteUsers).map(user => (
            <div key={user.uid} className={`bg-surface-800 rounded-lg overflow-hidden relative ${mode === 'video' ? 'aspect-video' : 'aspect-square'}`}>
              {user.videoTrack ? (
                <div id={`remote-video-${user.uid}`} className="h-full w-full bg-surface-700"></div>
              ) : (
                <div className="flex items-center justify-center h-full bg-surface-700">
                  <div className="w-20 h-20 rounded-full bg-surface-600 flex items-center justify-center text-xl font-bold text-white">
                    User
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-2 left-2 flex items-center bg-surface-900 bg-opacity-75 px-2 py-1 rounded-full">
                {!user.audioTrack ? (
                  <MicOff size={16} className="text-red-500" />
                ) : (
                  <Mic size={16} className="text-green-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex justify-center items-center gap-4 py-4 px-4 bg-surface-800 border-t border-surface-700">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-surface-700 hover:bg-surface-600'}`}
        >
          {isMuted ? (
            <MicOff size={24} className="text-white" />
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </button>
        
        {mode === 'video' && (
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-surface-700 hover:bg-surface-600'}`}
          >
            {isVideoOff ? (
              <VideoOff size={24} className="text-white" />
            ) : (
              <Video size={24} className="text-white" />
            )}
          </button>
        )}
        
        <button
          onClick={leaveRoom}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700"
        >
          <LogOut size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
} 