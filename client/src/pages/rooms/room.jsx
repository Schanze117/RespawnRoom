import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, LogOut, Copy, CheckCircle, Link as LinkIcon, Share2, X } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useRoomContext } from '../../utils/RoomContext';

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

// Maximum participants allowed in a room
const MAX_PARTICIPANTS = 5;

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
    default:
      // For more than 5 participants (shouldn't happen), use a responsive grid
      return { 
        columns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        rows: 'auto',
        areas: null
      };
  }
};

export default function Room() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode') || 'voice'; // Default to voice only

  // Room context for floating window
  const { 
    enterRoom, 
    exitRoom, 
    updateParticipantCount 
  } = useRoomContext();

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
  const [roomFull, setRoomFull] = useState(false);
  
  // Use a more deterministic UID when using tokens
  const uid = useRef(Math.floor(Math.random() * 100000));

  // Create client ref inside the component to avoid issues with hooks
  const clientRef = useRef(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;

  // Ensure the Agora client is initialized correctly
  useEffect(() => {
    if (!clientRef.current) {
      console.log('Creating new Agora RTC client');
      try {
        // Configure client with better parameters for challenging networks
        clientRef.current = AgoraRTC.createClient({ 
          mode: 'rtc', 
          codec: 'vp8',
          // Add parameters to help with network issues
          clientRoleType: 1, // 1 for host, 2 for audience
          enableCloudProxy: false, // Enable if network conditions are difficult
          proxyServer: null, // Set to URL if custom proxy is needed
          turnServer: {
            forceTurn: false, // Set to true if direct connection fails
            turnServerURL: null, // Custom TURN server URL
            username: null,
            password: null,
            udpport: null,
            tcpport: null,
            forcetcp: false
          },
          iceTransportPolicy: "all" // "all" (default) or "relay" for networks with strict firewalls
        });
        console.log('Agora RTC client created successfully');
      } catch (err) {
        console.error('Failed to create Agora client:', err);
        setConnectionError('Failed to initialize video call system. Please try again later.');
      }
    }
    
    // Cleanup function
    return () => {
      // We'll handle cleanup in the join effect
    };
  }, []);

  // Update the context when remote users change
  useEffect(() => {
    const totalParticipants = Object.keys(remoteUsers).length + 1; // +1 for local user
    updateParticipantCount(totalParticipants);
    
    // Update room info in context
    const participants = Object.values(remoteUsers).map((user, index) => ({
      uid: user.uid,
      name: `Participant ${index + 1}`,
      hasAudio: user.audio && !user.audioTrack?.muted,
      hasVideo: user.video && user.videoTrack
    }));
    
    // Add local user
    participants.unshift({
      uid: uid.current,
      name: 'You (Host)',
      hasAudio: !isMuted,
      hasVideo: !isVideoOff && mode === 'video'
    });
    
    // Set active room in context
    enterRoom({
      id: roomId,
      name: roomName,
      participants
    });
    
    // Clean up on unmount
    return () => {
      exitRoom();
    };
  }, [remoteUsers, isMuted, isVideoOff, roomId, roomName]);

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
      console.error('Token fetch error:', error);
      return null;
    }
  };

  // Join Agora channel
  useEffect(() => {
    // Set up event listeners for Agora
    const setupEventListeners = () => {
      clientRef.current.on('user-published', handleUserPublished);
      clientRef.current.on('user-unpublished', handleUserUnpublished);
      clientRef.current.on('user-left', handleUserLeft);
      
      // Add connection state change listener
      clientRef.current.on('connection-state-change', (curState, prevState) => {
        console.log(`Connection state changed from ${prevState} to ${curState}`);
        if (curState === 'DISCONNECTED') {
          setConnectionError('Connection to the room was lost. Please check your network connection.');
        } else if (curState === 'CONNECTING') {
          console.log('Attempting to connect to Agora service...');
        } else if (curState === 'CONNECTED') {
          console.log('Successfully connected to Agora service');
          setConnectionError('');
        } else if (curState === 'RECONNECTING') {
          console.log('Attempting to reconnect to Agora service...');
        } else if (curState === 'FAILED') {
          setConnectionError('Failed to connect to the room. Please try again later.');
        }
      });

      // Add specific error handling for token issues
      clientRef.current.on('token-privilege-did-expire', async function() {
        console.log('Token expired, attempting to refresh...');
        const newTokenData = await fetchToken(roomId);
        if (newTokenData && newTokenData.token) {
          await clientRef.current.renewToken(newTokenData.token);
          console.log('Token renewed successfully');
        } else {
          setConnectionError('Your session has expired. Please rejoin the room.');
        }
      });

      // Add error event listener
      clientRef.current.on('exception', (event) => {
        console.error('Agora exception:', event);
        if (event.code === 'CAN_NOT_JOIN_CHANNEL' || (event.message && event.message.includes('token access room forbidden'))) {
          setConnectionError('Cannot join room: Access denied. This may be due to an expired token or insufficient permissions.');
        }
      });
    };

    // Clean up resources
    const cleanup = async () => {
      console.log('Running cleanup process...');
      
      // Close local tracks properly
      if (localTracks.length > 0) {
        console.log(`Closing ${localTracks.length} local tracks`);
        
        for (const track of localTracks) {
          try {
            // Stop playing the track
            track.stop();
            // Close the track to release resources
            track.close();
            console.log(`Closed track: ${track.trackMediaType}`);
          } catch (e) {
            console.error(`Error closing track ${track.trackMediaType}:`, e);
          }
        }
        
        // Clear local tracks array
        setLocalTracks([]);
      }
      
      // Remove all event listeners
      console.log('Removing event listeners');
      clientRef.current.removeAllListeners();
      
      // Leave the channel
      try {
        console.log('Leaving Agora channel');
        await clientRef.current.leave();
        console.log('Successfully left channel');
      } catch (err) {
        console.error('Error leaving channel:', err);
      }
      
      // Notify context that we're exiting the room
      console.log('Notifying context of room exit');
      exitRoom();
    };

    const join = async () => {
      console.log('Starting room join process...');
      
      try {
        // Check network connectivity first
        const isOnline = navigator.onLine;
        if (!isOnline) {
          setConnectionError('You appear to be offline. Please check your internet connection and try again.');
          return;
        }
        
        // Set up event listeners first
        setupEventListeners();
        
        // Check if we have a valid App ID
        const appId = import.meta.env.VITE_AGORA_APP_ID;
        if (!appId) {
          console.error('Missing Agora App ID - check your environment variables');
          setConnectionError('Agora App ID not configured properly. Please check your environment variables.');
          return;
        }
        
        console.log('Attempting to join with AppID:', appId);
        
        // Clear any previous connections to avoid conflicts
        try {
          await clientRef.current.leave();
          console.log('Cleared previous connection if any');
        } catch (e) {
          // Ignore errors from leave since we might not be in a channel
          console.log('No previous connection to clear');
        }
        
        try {
          // First check if the room is full
          try {
            console.log('Checking room capacity...');
            const userCount = await clientRef.current.getChannelMemberCount([roomId]);
            if (userCount && userCount[roomId] && userCount[roomId] >= MAX_PARTICIPANTS) {
              setRoomFull(true);
              setConnectionError(`Room is full (maximum ${MAX_PARTICIPANTS} participants)`);
              return;
            }
            console.log('Room has space, proceeding with join');
          } catch (countError) {
            // Continue even if we can't check count
            console.warn('Could not check room count:', countError);
          }
          
          // Try to get token first
          console.log('Attempting to get token...');
          const tokenData = await fetchToken(roomId);
          
          try {
            if (tokenData && tokenData.token) {
              console.log('Got valid token, joining with token');
              setTokenDetails(tokenData);
              
              // Join with token - with retries for network issues
              let joinSuccess = false;
              let retryCount = 0;
              const maxRetries = 2;
              
              while (!joinSuccess && retryCount <= maxRetries) {
                try {
                  await clientRef.current.join(tokenData.appId, roomId, tokenData.token, tokenData.uid || uid.current);
                  console.log('Successfully joined with token');
                  joinSuccess = true;
                } catch (tokenJoinError) {
                  retryCount++;
                  console.error(`Join attempt ${retryCount} failed:`, tokenJoinError);
                  
                  // Check for token access error
                  if (tokenJoinError.message && (
                      tokenJoinError.message.includes('token access room forbidden') ||
                      tokenJoinError.message.includes('CAN_NOT_JOIN_CHANNEL')
                    )) {
                    throw new Error('Authentication failed: Invalid or expired token. Please try again.');
                  }
                  
                  if (retryCount > maxRetries) {
                    console.log('Max retries reached, attempting direct join');
                    // Fallback to direct join as last resort
                    await clientRef.current.join(appId, roomId, null, uid.current);
                    console.log('Successfully joined with direct join');
                    joinSuccess = true;
                  } else {
                    console.log(`Retrying connection in ${retryCount} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                  }
                }
              }
            } else {
              // Direct join without token
              console.log('No token available, using direct join');
              await clientRef.current.join(appId, roomId, null, uid.current);
              console.log('Successfully joined with direct join');
            }
          } catch (joinError) {
            console.error('Final join error:', joinError);
            if (joinError.message && (
                joinError.message.includes('token access room forbidden') ||
                joinError.message.includes('CAN_NOT_JOIN_CHANNEL')
              )) {
              setConnectionError('Cannot join room: Access denied. Please try again later.');
            } else {
              setConnectionError(`Failed to join room: ${joinError.message}`);
            }
            throw joinError;
          }
          
          // Create and publish tracks based on mode
          console.log('Creating local tracks for mode:', mode);
          let tracks = [];
          
          try {
            console.log('Creating audio track');
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            tracks.push(audioTrack);
          } catch (audioError) {
            console.error('Failed to create audio track:', audioError);
            setConnectionError('Could not access microphone. Please check permissions.');
          }
          
          if (mode === 'video' && tracks.length > 0) {
            try {
              console.log('Creating video track');
              const videoTrack = await AgoraRTC.createCameraVideoTrack({
                encoderConfig: {
                  width: { min: 640, ideal: 1280, max: 1920 },
                  height: { min: 360, ideal: 720, max: 1080 },
                  frameRate: 24,
                  bitrateMin: 400, 
                  bitrateMax: 1000
                }
              });
              tracks.push(videoTrack);
              setIsVideoOff(false);
            } catch (videoError) {
              console.error('Failed to create video track:', videoError);
              console.warn('Continuing without video');
              setIsVideoOff(true);
            }
          }
          
          if (tracks.length === 0) {
            throw new Error('Could not create any media tracks');
          }
          
          // Save tracks to local state
          setLocalTracks(tracks);
          
          // Publish tracks
          console.log('Publishing tracks:', tracks.length);
          for (const track of tracks) {
            await clientRef.current.publish(track);
            console.log('Published track type:', track.trackMediaType);
          }
          
          // Joining complete
          console.log('Join process complete!');
          setJoining(false);
        } catch (joinError) {
          console.error('Error during join process:', joinError);
          setConnectionError(`Failed to join room: ${joinError.message}`);
          cleanup();
        }
      } catch (outerError) {
        console.error('Unexpected error in join process:', outerError);
        setConnectionError(`Connection error: ${outerError.message}`);
        cleanup();
      }
    };

    join();

    // Cleanup on unmount
    return cleanup;
  }, [roomId, mode]);

  const handleUserPublished = async (user, mediaType) => {
    console.log(`Remote user ${user.uid} published ${mediaType} track`);
    
    // Check if adding this user would exceed MAX_PARTICIPANTS
    const currentCount = Object.keys(remoteUsers).length;
    if (currentCount >= MAX_PARTICIPANTS - 1) {
      console.warn(`Cannot add more participants. Maximum limit of ${MAX_PARTICIPANTS} reached.`);
      return;
    }
    
    try {
      // Subscribe to the remote user
      console.log(`Subscribing to ${user.uid}'s ${mediaType}`);
      await clientRef.current.subscribe(user, mediaType);
      console.log(`Subscribed to ${user.uid}'s ${mediaType} successfully`);
      
      // Update state with the new user's stream
      setRemoteUsers(prev => {
        // Create a new reference to trigger re-render
        const updated = { ...prev };
        if (!updated[user.uid]) {
          updated[user.uid] = { uid: user.uid };
        }
        
        updated[user.uid] = {
          ...updated[user.uid],
          [mediaType]: true,
          [`${mediaType}Track`]: user[`${mediaType}Track`],
          user
        };
        
        return updated;
      });
      
      // Handle audio playback
      if (mediaType === 'audio' && user.audioTrack) {
        console.log(`Playing ${user.uid}'s audio`);
        user.audioTrack.play();
      }
      
      // Handle video container setup
      if (mediaType === 'video' && user.videoTrack) {
        console.log(`Setting up ${user.uid}'s video display`);
        
        // Use a timeout to ensure the container is ready
        setTimeout(() => {
          const playerContainer = document.getElementById(`remote-video-${user.uid}`);
          if (playerContainer) {
            console.log(`Playing ${user.uid}'s video in container`);
            user.videoTrack.play(`remote-video-${user.uid}`);
          } else {
            console.warn(`Container for ${user.uid} not found, trying again...`);
            
            // Try again after a longer delay
            setTimeout(() => {
              const container = document.getElementById(`remote-video-${user.uid}`);
              if (container) {
                console.log(`Playing ${user.uid}'s video in container (second attempt)`);
                user.videoTrack.play(`remote-video-${user.uid}`);
              } else {
                console.error(`Container for ${user.uid} still not found`);
              }
            }, 500);
          }
        }, 200);
      }
    } catch (error) {
      console.error(`Error handling published track from ${user.uid}:`, error);
    }
  };

  const handleUserUnpublished = (user, mediaType) => {
    console.log(`Remote user ${user.uid} unpublished ${mediaType} track`);
    
    // Update state to reflect the unpublished track
    setRemoteUsers(prev => {
      const updated = { ...prev };
      
      if (updated[user.uid]) {
        updated[user.uid] = {
          ...updated[user.uid],
          [mediaType]: false
        };
        
        // If user has unpublished both audio and video, consider removing them
        if (!updated[user.uid].audio && !updated[user.uid].video) {
          console.log(`User ${user.uid} has no active tracks, considering removal`);
        }
      }
      
      return updated;
    });
  };

  const handleUserLeft = (user) => {
    console.log(`Remote user ${user.uid} left the channel`);
    
    // Remove the user from remoteUsers state
    setRemoteUsers(prev => {
      const updated = { ...prev };
      
      if (updated[user.uid]) {
        // Cleanup any tracks before removing
        if (updated[user.uid].audioTrack) {
          try {
            updated[user.uid].audioTrack.stop();
          } catch (e) {
            console.warn(`Error stopping audio track for user ${user.uid}:`, e);
          }
        }
        
        if (updated[user.uid].videoTrack) {
          try {
            updated[user.uid].videoTrack.stop();
          } catch (e) {
            console.warn(`Error stopping video track for user ${user.uid}:`, e);
          }
        }
        
        // Remove user from state
        delete updated[user.uid];
        console.log(`Removed user ${user.uid} from state`);
      }
      
      return updated;
    });
  };

  const toggleMute = async () => {
    if (localTracks.length > 0) {
      const audioTrack = localTracks.find(track => track.trackMediaType === 'audio');
      if (audioTrack) {
        await audioTrack.setEnabled(!isMuted);
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = async () => {
    if (localTracks.length > 0) {
      // Find the video track if it exists
      const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
      
      if (videoTrack) {
        // Toggle the existing video track
        await videoTrack.setEnabled(!isVideoOff);
        setIsVideoOff(!isVideoOff);
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
          await clientRef.current.publish(newVideoTrack);
          
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
    await clientRef.current.leave();
    exitRoom();
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

  // If the room is full, show an error message
  if (roomFull) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-900 px-4">
        <div className="text-center p-6 bg-surface-800 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-3xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-primary-400 mb-2">Room is Full</h2>
          <p className="text-gray-300 mb-2">This room has reached the maximum limit of {MAX_PARTICIPANTS} participants.</p>
          <p className="text-gray-400 mb-6">Please try joining another room or create your own.</p>
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

  // Render local video view
  useEffect(() => {
    if (!joining && localTracks.length > 0 && mode === 'video') {
      console.log('Setting up local video display');
      
      const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
      if (videoTrack && !isVideoOff) {
        // Get the container element
        const localContainer = document.getElementById('local-video');
        
        if (localContainer) {
          console.log('Playing local video in container');
          
          // Stop playing first in case it's already playing
          try {
            videoTrack.stop();
          } catch (e) {
            // Ignore errors from stopping
          }
          
          // Play the track in the container
          videoTrack.play('local-video', { 
            fit: 'contain',
            mirror: true
          });
        } else {
          console.warn('Local video container not found');
          
          // Try again after a delay
          setTimeout(() => {
            const retryContainer = document.getElementById('local-video');
            if (retryContainer) {
              console.log('Playing local video after delay');
              videoTrack.play('local-video', { 
                fit: 'contain',
                mirror: true
              });
            }
          }, 500);
        }
      }
    }
  }, [localTracks, isVideoOff, mode, joining]);

  // Render remote video views
  useEffect(() => {
    if (joining) return;
    
    console.log('Setting up remote videos for', Object.keys(remoteUsers).length, 'users');
    
    Object.values(remoteUsers).forEach(user => {
      if (user.videoTrack && user.video) {
        console.log(`Setting up remote video for user ${user.uid}`);
        
        // Get the container element
        const containerId = `remote-video-${user.uid}`;
        const container = document.getElementById(containerId);
        
        if (container) {
          console.log(`Playing video for user ${user.uid} in container`);
          
          // Stop first if already playing
          try {
            user.videoTrack.stop();
          } catch (e) {
            // Ignore errors from stopping
          }
          
          // Play with proper fit mode
          try {
            user.videoTrack.play(containerId, { 
              fit: 'contain',
              mirror: false
            });
          } catch (error) {
            console.error(`Error playing video for user ${user.uid}:`, error);
          }
        } else {
          console.warn(`Container for remote user ${user.uid} not found`);
        }
      }
    });
  }, [remoteUsers, joining]);

  // Debug logs
  useEffect(() => {
    console.log('Room component mounted');
    
    // Log state changes
    console.log('Current room state:', {
      roomId,
      mode,
      joining,
      isMuted,
      isVideoOff,
      roomFull,
      remoteUsersCount: Object.keys(remoteUsers).length
    });
    
    return () => {
      console.log('Room component unmounting', roomId);
    };
  }, [roomId, mode, joining, isMuted, isVideoOff, roomFull, remoteUsers]);

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