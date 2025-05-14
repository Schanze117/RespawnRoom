import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, LogOut, Copy, CheckCircle, Link as LinkIcon, Share2, X } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useRoomContext } from '../../utils/RoomContext';

// Update the videoContainerStyles with more modern styling
const videoContainerStyles = `
  .video-container {
    min-height: 180px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    border-radius: 12px;
    position: relative;
  }

  .video-container:hover {
    border-color: rgba(var(--color-primary-500), 0.7);
    transform: scale(1.01);
    z-index: 5;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }

  .user-label {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .media-indicator {
    position: absolute;
    bottom: 10px;
    display: flex;
    gap: 8px;
    background: rgba(0, 0, 0, 0.6);
    padding: 4px 12px;
    border-radius: 20px;
    z-index: 10;
  }

  .media-indicator-left {
    left: 10px;
  }

  .media-indicator-right {
    right: 10px;
  }

  .avatar-placeholder {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2a2a3a 0%, #141420 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
  }

  /* Control panel styling */
  .control-panel {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(30, 30, 40, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    margin: 0 auto;
    width: fit-content;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  .control-button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-button:hover {
    transform: scale(1.1);
  }

  .control-button.danger {
    background: #e74c3c;
  }

  .control-button.danger:hover {
    background: #c0392b;
  }

  .control-button.success {
    background: #2ecc71;
  }

  .control-button.success:hover {
    background: #27ae60;
  }
  
  /* Glassmorphism for modals */
  .glass-modal {
    background: rgba(30, 30, 40, 0.85);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  /* Animation for joining/connecting */
  @keyframes pulse {
    0% { opacity: 0.6; transform: scale(0.98); }
    50% { opacity: 1; transform: scale(1.02); }
    100% { opacity: 0.6; transform: scale(0.98); }
  }
  
  .pulse-animation {
    animation: pulse 1.5s infinite ease-in-out;
  }

  @media (max-width: 640px) {
    .video-container {
      min-height: 150px;
    }
    
    .avatar-placeholder {
      width: 60px;
      height: 60px;
      font-size: 24px;
    }
    
    .control-button {
      width: 45px;
      height: 45px;
    }
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
  console.log("Room component initialized");
  
  const { id: roomId } = useParams();
  console.log("Room ID:", roomId);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode') || 'voice'; // Default to voice only
  console.log("Room mode:", mode);

  // Room context for floating window
  const { 
    enterRoom, 
    exitRoom, 
    updateParticipantCount,
    startJoining,
    completeJoining
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
  const [roomCreationTime, setRoomCreationTime] = useState(null);
  
  // Use a more deterministic UID when using tokens
  const uid = useRef(Math.floor(Math.random() * 100000));

  // Create client ref inside the component to avoid issues with hooks
  const clientRef = useRef(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;

  // Add a new state to track instance ID to prevent duplicate joins
  const [instanceId] = useState(() => {
    // Generate a unique instance ID for this room instance
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });

  // Define the handler functions that were missing
  const handleUserPublished = async (user, mediaType) => {
    console.log(`User ${user.uid} published ${mediaType} track`);
    
    // Subscribe to the remote user
    await clientRef.current.subscribe(user, mediaType);
    console.log(`Subscribed to ${user.uid}'s ${mediaType} track`);
    
    // Attempt to get username if available in user attributes
    let username = null;
    
    // Check userProperties first
    if (user.userProperties && user.userProperties.username) {
      username = user.userProperties.username;
      console.log(`Username from userProperties in published event: ${username}`);
    }
    
    // If not found, check our sessionStorage
    if (!username) {
      const storedUsername = window.sessionStorage.getItem(`rtc_user_${user.uid}`);
      if (storedUsername) {
        username = storedUsername;
        console.log(`Username from session storage in published event: ${username}`);
      }
    }
    
    // Update remoteUsers state with new user or updated track info
    setRemoteUsers(prev => {
      const existingUser = prev[user.uid] || {};
      // Prioritize username already in state (from user-joined), then from current event, then undefined
      const finalUsername = existingUser.username || username;

      return {
        ...prev,
        [user.uid]: {
          ...existingUser, // Spread existing user data (like username from user-joined)
          uid: user.uid,    // Ensure uid is present
          [mediaType]: true,
          ...(mediaType === 'video' ? { videoTrack: user.videoTrack } : {}),
          ...(mediaType === 'audio' ? { audioTrack: user.audioTrack } : {}),
          ...(finalUsername && { username: finalUsername }) // Set username if available
        }
      };
    });
  };

  const handleUserUnpublished = (user, mediaType) => {
    console.log(`User ${user.uid} unpublished ${mediaType} track`);
    
    // Update remoteUsers state
    setRemoteUsers(prev => {
      // If user doesn't exist in our state, do nothing
      if (!prev[user.uid]) return prev;
      
      // Update the user's media type status
      return {
        ...prev,
        [user.uid]: {
          ...prev[user.uid],
          [mediaType]: false,
          ...(mediaType === 'video' ? { videoTrack: undefined } : {}),
          ...(mediaType === 'audio' ? { audioTrack: undefined } : {})
        }
      };
    });
  };

  const handleUserLeft = (user) => {
    console.log(`User ${user.uid} left the channel`);
    
    // Remove user from remoteUsers state
    setRemoteUsers(prev => {
      const newRemoteUsers = { ...prev };
      delete newRemoteUsers[user.uid];
      return newRemoteUsers;
    });
  };

  const handleUserJoined = (user) => {
    console.log(`Remote user ${user.uid} joined the channel`);
    
    // Multiple strategies to get username
    let username = null;
    
    // Strategy 1: Check userProperties (standard way)
    if (user.userProperties && user.userProperties.username) {
      username = user.userProperties.username;
      console.log(`Username from userProperties: ${username}`);
    }
    
    // Strategy 2: Check any channel attributes we might have set
    if (!username) {
      const storedUsername = window.sessionStorage.getItem(`rtc_user_${user.uid}`);
      if (storedUsername) {
        username = storedUsername;
        console.log(`Username from session storage: ${username}`);
      }
    }
    
    // Strategy
    if (!username) {
      // If all else fails, we'll use the UID for now
      console.log(`No username found for user ${user.uid}`);
    }
    
    // Update with the most reliable info we have
    setRemoteUsers(prev => ({
      ...prev,
      [user.uid]: {
        uid: user.uid,
        username: username, // Store the username we found
        // Initialize media tracks as null or undefined, to be populated by user-published
        audio: false,
        video: false,
        audioTrack: undefined,
        videoTrack: undefined,
        ...prev[user.uid], // Spread existing user data if any (e.g., if published fired first)
      }
    }));
    
    // Attempt to get username from RTM or other sources if needed
    if (!username) {
      // Try to query user attributes if available
      if (clientRef.current && clientRef.current.getUserAttributes) {
        clientRef.current.getUserAttributes(user.uid)
          .then(attrs => {
            if (attrs && attrs.username) {
              console.log(`Got username from attributes: ${attrs.username}`);
              
              // Update remote users with the username we found
              setRemoteUsers(prev => ({
                ...prev,
                [user.uid]: {
                  ...prev[user.uid],
                  username: attrs.username
                }
              }));
            }
          })
          .catch(e => console.warn('Failed to get user attributes:', e));
      }
    }
  };

  // Ensure the Agora client is initialized correctly
  useEffect(() => {
    let initAttempts = 0;
    const maxInitAttempts = 3;
    
    const initializeClient = () => {
      if (!clientRef.current && initAttempts < maxInitAttempts) {
        try {
          console.log('Initializing Agora client...');
          // Configure client with better parameters for challenging networks
          clientRef.current = AgoraRTC.createClient({ 
            mode: 'rtc', 
            codec: 'vp8',
            // Add parameters to help with network issues
            clientRoleType: 1, // 1 for host, 2 for audience
            enableCloudProxy: false // Enable if network conditions are difficult
          });
          console.log('Agora client initialized successfully');
          
          // Set up connection state change listener
          clientRef.current.on('connection-state-change', (curState, prevState) => {
            console.log(`Connection state changed from ${prevState} to ${curState}`);
            
            if (prevState === 'DISCONNECTED' && curState === 'CONNECTING') {
              console.log('Reconnecting to channel...');
            } else if (curState === 'CONNECTED') {
              console.log('Successfully connected to Agora channel');
            } else if (curState === 'DISCONNECTED') {
              console.log('Disconnected from Agora channel');
            } else if (curState === 'FAILED') {
              console.error('Connection to Agora channel failed');
              setConnectionError('Connection failed. Please check your internet connection and try again.');
              setJoining(false);
            }
          });
          
          // Set up token expiration handlers
          clientRef.current.on('token-privilege-will-expire', async function() {
            console.log('Token privilege will expire soon, renewing...');
            try {
              const newTokenData = await fetchToken(roomId);
              if (newTokenData && newTokenData.token) {
                await clientRef.current.renewToken(newTokenData.token);
                console.log('Token renewed successfully');
              }
            } catch (e) {
              console.error('Failed to renew token:', e);
              setConnectionError('Your session is about to expire. Please rejoin the room.');
            }
          });
          
          clientRef.current.on('token-privilege-did-expire', async function() {
            console.log('Token privilege expired, renewing...');
            try {
              const newTokenData = await fetchToken(roomId);
              if (newTokenData && newTokenData.token) {
                await clientRef.current.renewToken(newTokenData.token);
                console.log('Token renewed successfully');
              } else {
                setConnectionError('Your session has expired. Please rejoin the room.');
                setJoining(false);
              }
            } catch (e) {
              console.error('Failed to renew token:', e);
              setConnectionError('Session expired. Please rejoin the room.');
              setJoining(false);
            }
          });
          
          // Set up exception handler
          clientRef.current.on('exception', (event) => {
            console.error('Agora exception:', event);
          });
          
        } catch (err) {
          console.error('Failed to initialize Agora client:', err);
          setConnectionError('Failed to initialize video call system. Please try again later.');
          
          // Retry initialization after delay
          initAttempts++;
          if (initAttempts < maxInitAttempts) {
            console.log(`Retry attempt ${initAttempts} in ${initAttempts} seconds`);
            setTimeout(initializeClient, initAttempts * 1000);
          }
        }
      }
    };
    
    // Initialize the client
    initializeClient();
    
    // Cleanup function
    return () => {
      cleanup();
    };
  }, []);

  // Update the context when remote users change
  useEffect(() => {
    // Process room count changes
    const totalParticipants = Object.keys(remoteUsers).length + 1; // +1 for local user
    updateParticipantCount(totalParticipants);
    
    // Update room info in context
    const participants = Object.values(remoteUsers).map((user) => ({
      uid: user.uid,
      name: user.username || localStorage.getItem('username') || `User ${user.uid?.toString()?.slice(-4)}`,
      hasAudio: user.audio && !user.audioTrack?.muted,
      hasVideo: user.video && user.videoTrack
    }));
    
    // Add local user
    const localUsername = localStorage.getItem('username') || 'You';
    participants.unshift({
      uid: uid.current,
      name: localUsername,
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
  }, [remoteUsers, isMuted, isVideoOff, roomId, roomName, enterRoom, exitRoom, updateParticipantCount]);

  // Initialize joining status
  useEffect(() => {
    startJoining(roomId);
    setRoomCreationTime(new Date().toLocaleTimeString()); // Set creation time once when component mounts for the room
    
    // Add a retry system instead of just a timeout
    let retryCount = 0;
    const maxRetries = 3;
    
    const retryJoin = async () => {
      if (joining && retryCount < maxRetries) {
        retryCount++;
        console.log(`Join attempt timeout. Retry ${retryCount}/${maxRetries}...`);
        
        // Perform cleanup before retry
        try {
          if (clientRef.current) {
            // Leave any existing channel
            await clientRef.current.leave();
            console.log("Left existing channel before retry");
          }
      } catch (e) {
          console.log("No channel to leave before retry:", e);
        }
        
        // Wait before retry (increasing delay)
        setTimeout(() => {
          join();
        }, retryCount * 1000);
      } else if (joining) {
        // Max retries reached, give up
        console.warn('Join process failed after maximum retries');
        setJoining(false);
        setConnectionError('Failed to join after multiple attempts. Please try again.');
      }
    };
    
    const timeoutId = setTimeout(retryJoin, 8000);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Only depend on roomId

  // Update joining status when joining state changes
  useEffect(() => {
    if (!joining && !connectionError) {
      completeJoining(true);
    } else if (!joining && connectionError) {
      completeJoining(false, connectionError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joining, connectionError]); // Removed completeJoining from dependencies

    // Clean up resources
    const cleanup = async () => {
    console.log("Performing cleanup");
    
      // Clear any token renewal timeouts
      if (tokenDetails && tokenDetails.renewalTimeoutId) {
        clearTimeout(tokenDetails.renewalTimeoutId);
      }
      
      // Close local tracks properly
      if (localTracks.length > 0) {
        for (const track of localTracks) {
          try {
            // Stop playing the track
            track.stop();
            // Close the track to release resources
            track.close();
          console.log(`Closed ${track.trackMediaType} track`);
          } catch (e) {
          console.error(`Error closing track:`, e);
          }
        }
        
        // Clear local tracks array
        setLocalTracks([]);
      }
      
      // Check if client exists before cleanup
      if (clientRef.current) {
        // Remove all event listeners
        clientRef.current.removeAllListeners();
        
        // Leave the channel
        try {
          await clientRef.current.leave();
        console.log("Successfully left channel");
        } catch (err) {
        console.log("No channel to leave:", err);
        }
      }
      
      // Clear the user's session in this room
      try {
        const userId = localStorage.getItem('user_id');
        if (userId && roomId) {
          // Only clear if this is the active instance
          const currentInstance = sessionStorage.getItem(`room_${roomId}_instance`);
          if (currentInstance === instanceId) {
            localStorage.removeItem(`user_${userId}_in_room_${roomId}`);
            sessionStorage.removeItem(`room_${roomId}_instance`);
          }
        }
      } catch (e) {
        console.error('Error clearing session data:', e);
      }
      
      // Log out user activity for audit purposes
      try {
        const token = localStorage.getItem('auth_token');
        if (token && roomId) {
          const baseUrl = import.meta.env.VITE_API_BASE_URL;
          if (baseUrl) {
            fetch(`${baseUrl}/api/user/activity/log`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                action: 'leave_room',
                roomId,
                timestamp: Date.now()
              })
            }).catch(e => console.error('Failed to log activity:', e));
          }
        }
      } catch (e) {
        console.error('Error during activity logging:', e);
      }
      
      // Notify context that we're exiting the room
      exitRoom();
      
      // Navigate away for a clean exit
      navigate('/rooms');
    };

  // Fetch token from server with better error handling
  const fetchToken = async (channelName) => {
    try {
      // Ensure we have a valid base URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        console.error('VITE_API_BASE_URL is not configured');
        throw new Error('API base URL not configured');
      }

      // Input validation - sanitize channel name
      const sanitizedChannel = channelName.replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedChannel !== channelName) {
        console.error('Channel name contains invalid characters');
        throw new Error('Invalid channel name format');
      }

      // Add timestamp to prevent replay attacks
      const timestamp = Date.now();
      
      // Log the URL we're fetching from for debugging
      const tokenUrl = `${baseUrl}/api/agora/token?channel=${sanitizedChannel}&uid=${uid.current}&timestamp=${timestamp}`;
      console.log(`Fetching token from: ${tokenUrl}`);
      
      // Make fetch request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      // Add authorization header if user is logged in
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        tokenUrl,
        { 
          method: 'GET',
          headers,
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Try to get the error message from the response
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Server returned ${response.status}: ${response.statusText}`;
        } catch (e) {
          errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        }
        
        console.error('Token fetch failed:', errorMessage);
        throw new Error(`Failed to get token: ${errorMessage}`);
      }
      
      const data = await response.json();
      
      // Log token details (but not the token itself for security)
      console.log('Token received successfully:', {
        hasToken: !!data.token,
        appId: data.appId ? 'present' : 'missing',
        channel: data.channel,
        uid: data.uid,
        expiresIn: data.expiresIn || 'unknown'
      });
      
      if (!data || !data.token) {
        console.error('Invalid token response from server:', data);
        throw new Error('Invalid token response from server');
      }
      
      // Store the expiration time to handle renewal
      if (data.expiresIn) {
        const expiryTime = Date.now() + (data.expiresIn * 1000) - 30000; // 30s buffer
        setTokenDetails({
          token: data.token,
          expiryTime,
          channel: data.channel
        });
        
        // Set up token renewal process
        const renewalTime = data.expiresIn * 1000 - 60000; // 1 minute before expiry
        if (renewalTime > 0) {
          const renewalTimeout = setTimeout(() => {
            if (clientRef.current) {
              fetchToken(channelName)
                .then(newTokenData => {
                  if (newTokenData && newTokenData.token) {
                    clientRef.current.renewToken(newTokenData.token);
                    console.log('Token renewed automatically');
                  }
                })
                .catch(err => console.error('Failed to renew token automatically:', err));
            }
          }, renewalTime);
          
          // Store the timeout ID for cleanup
          return { ...data, renewalTimeoutId: renewalTimeout };
        }
      }
      
      return data;
    } catch (error) {
      // Check for specific error types
      if (error.name === 'AbortError') {
        console.error('Token request timed out');
        throw new Error('Token request timed out');
      } else if (error.message.includes('Failed to fetch')) {
        console.error('Network error: Could not connect to token server');
        throw new Error('Network error: Could not connect to token server');
      }
      
      console.error('Token fetch error:', error);
      throw error;
    }
  };

  // Modified join function with preflight check and better error handling
    const join = async () => {
    console.log('Starting join process for room:', roomId);
      try {
        // Check network connectivity first
        const isOnline = navigator.onLine;
        if (!isOnline) {
        console.error('Network appears to be offline');
          setConnectionError('You appear to be offline. Please check your internet connection and try again.');
        setJoining(false);
          return;
        }
        
        // Check if client is initialized before proceeding
        if (!clientRef.current) {
        console.error('Client not initialized');
          setConnectionError('Failed to initialize video call system. Please refresh and try again.');
        setJoining(false);
          return;
        }
        
      // Check if this user is already in this room in another tab/window
      try {
        const username = localStorage.getItem('username');
        const userId = localStorage.getItem('user_id');
        
        if (username && userId) {
          // First, store this instance in session storage to mark this tab as the active one
          sessionStorage.setItem(`room_${roomId}_instance`, instanceId);
          
          // Then check if this user already has an active session in this room
          // Using localStorage for cross-tab communication
          const existingSession = localStorage.getItem(`user_${userId}_in_room_${roomId}`);
          
          if (existingSession && existingSession !== instanceId) {
            // Get timestamp to check if the session is still recent (within 2 minutes)
            const sessionData = JSON.parse(existingSession);
            const timeElapsed = Date.now() - sessionData.timestamp;
            
            // If the session is recent, prevent joining
            if (timeElapsed < 120000) { // 2 minutes
              console.error('User already in this room in another tab/window');
              setConnectionError('You are already in this room in another tab or window. Please close that session first.');
              setJoining(false);
              return;
            }
          }
          
          // Store this user's session in localStorage with timestamp
          localStorage.setItem(`user_${userId}_in_room_${roomId}`, JSON.stringify({
            instanceId,
            timestamp: Date.now()
          }));
          
          // Add event listener to clean up the session when tab/window is closed
          window.addEventListener('beforeunload', () => {
            // Only clear if this is the active instance
            const currentInstance = sessionStorage.getItem(`room_${roomId}_instance`);
            if (currentInstance === instanceId) {
              localStorage.removeItem(`user_${userId}_in_room_${roomId}`);
            }
          });
        }
      } catch (e) {
        // If there's an error checking sessions, log it but proceed with joining
        console.error('Error checking for duplicate sessions:', e);
      }
      
      // IMPORTANT: Always ensure we leave any existing channel first
      try {
        await clientRef.current.leave();
        console.log("Successfully left previous channel before joining new one");
      } catch (err) {
        // This is expected if we weren't in a channel
        console.log("No previous channel to leave");
      }
      
      // Remove all existing listeners to prevent duplicates
      clientRef.current.removeAllListeners();
      
      // Set up event listeners
      clientRef.current.on('user-published', handleUserPublished);
      clientRef.current.on('user-unpublished', handleUserUnpublished);
      clientRef.current.on('user-left', handleUserLeft);
      clientRef.current.on('user-joined', handleUserJoined);
      
      // Set up connection state change listener
      clientRef.current.on('connection-state-change', (curState, prevState) => {
        console.log(`Connection state changed from ${prevState} to ${curState}`);
        
        if (curState === 'CONNECTED') {
          console.log('Successfully connected to Agora channel');
        } else if (curState === 'DISCONNECTED') {
          console.log('Disconnected from Agora channel');
        } else if (curState === 'FAILED') {
          console.error('Connection to Agora channel failed');
          setConnectionError('Connection failed. Please check your internet connection and try again.');
          setJoining(false);
        }
      });
        
        // Check if we have a valid App ID
        const appId = import.meta.env.VITE_AGORA_APP_ID;
        if (!appId) {
        console.error('Agora App ID not configured');
          setConnectionError('Agora App ID not configured properly. Please check your environment variables.');
        setJoining(false);
          return;
        }
        
      console.log('Getting token for channel:', roomId);
      // Get token for the channel
      const tokenData = await fetchToken(roomId);
      console.log('Token received, proceeding to join channel');
      
      // Preflight check for media permissions
      try {
        // Request permissions first to catch any issues
        const permissionsStream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          // Only request video in video mode
          video: mode === 'video' 
        });
        
        // We got permissions, clean this up right away (we'll create proper tracks later)
        permissionsStream.getTracks().forEach(track => track.stop());
        console.log('Media permissions granted');
      } catch (permError) {
        console.error('Media permissions denied:', permError);
        setConnectionError('Unable to access your camera or microphone. Please check your browser permissions.');
        setJoining(false);
              return;
      }
      
      // Get username from localStorage for identifying the user
      const username = localStorage.getItem('username') || 'User';
      console.log('Joining as:', username);
      
      // Set up channel attributes to share username with others
      try {
        // Try to set a channel attribute with our username before joining
        if (username) {
          console.log('Setting channel attribute for username');
          // We'll use a custom attribute format to avoid conflicts
          const userAttr = {
            key: `user_${tokenData.uid || uid.current}`,
            value: username
          };
          
          // Store our UID-username mapping for later retrieval
          window.sessionStorage.setItem(`rtc_user_${tokenData.uid || uid.current}`, username);
        }
      } catch (attrError) {
        console.error('Error setting channel attribute:', attrError);
        // Continue anyway - this is not critical
      }
      
      // Join the channel
      console.log('Joining channel with appId and token:', {
        appId: appId ? 'present' : 'missing',
        token: tokenData.token ? 'present' : 'missing',
        channel: roomId,
        uid: tokenData.uid || uid.current
      });
      
      // Set user properties before joining
      try {
        // Store user info in client options
        const clientOptions = {
          // User properties to identify the user
          userProperties: {
            username: username
          }
        };
        
        await clientRef.current.join(
          tokenData.appId || appId,
          roomId,
          tokenData.token,
          tokenData.uid || uid.current,
          clientOptions // Pass the options with username
        );
        
        console.log('Successfully joined channel as', username);
        
        // After successful join, update the client with our metadata
        if (clientRef.current && clientRef.current.setLocalUserAttributes) {
          try {
            await clientRef.current.setLocalUserAttributes([{ key: 'username', value: username }]);
            console.log('Set local user attribute for username');
          } catch (e) {
            console.warn('Failed to set local user attributes:', e);
          }
        }
      } catch (joinError) {
        console.error('Error joining channel with options:', joinError);
        // Fallback to join without options if there's an error
        await clientRef.current.join(
          tokenData.appId || appId,
          roomId,
          tokenData.token,
          tokenData.uid || uid.current
        );
      }
      
      console.log('Successfully joined channel, creating media tracks');
      
      // Create tracks
      let audioTrack, videoTrack;
      
      try {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        console.log('Audio track created successfully');
          } catch (audioError) {
            console.error('Failed to create audio track:', audioError);
          }
          
      // Only create video track in video mode
      if (mode === 'video') {
            try {
          videoTrack = await AgoraRTC.createCameraVideoTrack({
                encoderConfig: {
                  width: { min: 640, ideal: 1280, max: 1920 },
                  height: { min: 360, ideal: 720, max: 1080 },
              frameRate: 24
                }
              });
          console.log('Video track created successfully');
              setIsVideoOff(false);
            } catch (videoError) {
              console.error('Failed to create video track:', videoError);
              setIsVideoOff(true);
            }
      } else {
        // In voice-only mode, ensure video is off
        setIsVideoOff(true);
        console.log('Voice-only mode, skipping video track creation');
          }
      
      // Only add tracks that were successfully created
      const tracks = [];
      if (audioTrack) tracks.push(audioTrack);
      if (videoTrack) tracks.push(videoTrack);
          
          if (tracks.length === 0) {
        console.error('No tracks were created');
            throw new Error('Could not create any media tracks');
          }
          
      // Save tracks to state
          setLocalTracks(tracks);
          
          // Publish tracks
      console.log('Publishing tracks to channel:', tracks.length);
          for (const track of tracks) {
        console.log(`Publishing ${track.trackMediaType} track`);
            await clientRef.current.publish(track);
          }
          
      console.log('All tracks published, joining complete');
      // Set joining to false to show the video interface
          setJoining(false);
      
    } catch (error) {
      console.error('Error joining room:', error);
      setConnectionError(`Failed to join room: ${error.message}`);
      setJoining(false);
        cleanup();
      }
    };

  // Clear event listeners from effect
  useEffect(() => {
    if (joining) {
    join();
    }
    
    return () => {
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, mode]); // Only re-run if roomId or mode changes

  // Update the local user rendering to handle duplicate display issues
  // First, make sure we only get one instance of the local video

  // Update the useEffect that renders local video to prevent duplicate displays
  useEffect(() => {
    if (!joining && localTracks.length > 0 && mode === 'video') {
      const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
      if (videoTrack && !isVideoOff) {
        // Get the container element
        const localContainer = document.getElementById('local-video');
        
        if (localContainer) {
          // First, clear the container to prevent duplicates
          localContainer.innerHTML = '';
          
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
          // Try again after a delay
          setTimeout(() => {
            const retryContainer = document.getElementById('local-video');
            if (retryContainer) {
              // Clear the container first
              retryContainer.innerHTML = '';
              
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
    
    Object.values(remoteUsers).forEach(user => {
      if (user.videoTrack && user.video) {
        // Get the container element
        const containerId = `remote-video-${user.uid}`;
        const container = document.getElementById(containerId);
        
        if (container) {
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
            // Ignore errors
          }
        }
      }
    });
  }, [remoteUsers, joining]);

  // Debug logs
  useEffect(() => {
    return () => {
      // Cleanup on unmount
    };
  }, [roomId, mode, joining, isMuted, isVideoOff, roomFull, remoteUsers]);

  // In the rendering part of the component, add this logic to calculate unique participants
  // Filter remoteUsers to ensure no duplicates with the local user
  const uniqueRemoteUsers = Object.values(remoteUsers).filter(user => user.uid !== uid.current);
  const totalUniqueParticipants = uniqueRemoteUsers.length + 1; // +1 for local user

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
    <div className="page-container flex-1 pt-20 md:pl-64">
      <div className="mx-auto px-2 sm:px-4 h-[calc(100vh-80px)]">
        <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden h-full flex flex-col">
          {/* Inject our custom CSS */}
          <style>{videoContainerStyles}</style>
          
          {/* Header - Updated with more information */}
          <div className="flex-none flex justify-between items-center px-4 py-3 bg-surface-800/90 backdrop-blur-md border-b border-surface-700">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-primary-500 mr-3">{roomName}</h1>
              <span className="bg-surface-700 text-xs px-2 py-1 rounded-full text-gray-300">
                {mode === 'video' ? 'Video & Voice' : 'Voice Only'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Connection quality indicator */}
              <div className="hidden sm:flex items-center px-3 py-1.5 bg-surface-700/80 rounded text-sm text-gray-300 mr-1">
                <div className="flex space-x-1 mr-2">
                  <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
                  <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
                  <div className="w-1.5 h-3 bg-green-500/60 rounded-sm"></div>
                  <div className="w-1.5 h-3 bg-surface-600 rounded-sm"></div>
                </div>
                <span className="text-xs">Good</span>
              </div>
              
              {/* Participants count */}
              <div className="hidden sm:flex items-center px-3 py-1.5 bg-surface-700/80 rounded text-sm text-gray-300">
                <span className="mr-1">{totalUniqueParticipants}</span>
                <span className="text-xs">/ {MAX_PARTICIPANTS}</span>
              </div>
              
              {/* Copy Room ID button */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  setRoomIdCopied(true);
                  setTimeout(() => setRoomIdCopied(false), 2000);
                }}
                className="flex items-center px-3 py-1.5 bg-surface-700/80 hover:bg-surface-600 rounded text-sm text-white transition-colors duration-200"
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
                    ID
                  </>
                )}
              </button>
              
              {/* Share button - This will now only show Room ID in the modal */}
              <button 
                onClick={() => setShowShareModal(true)}
                className="flex items-center px-3 py-1.5 bg-primary-600/80 hover:bg-primary-700 rounded text-sm text-white transition-colors duration-200"
              >
                <Share2 size={16} className="mr-1.5" />
                Share
              </button>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-grow flex overflow-hidden">
            <div className="flex-grow p-2 sm:p-4 overflow-auto w-full">
              {/* Discord-style adaptive grid */}
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
                
                {/* Remote users */}
                {uniqueRemoteUsers.map((user, index) => {
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
                })}
              </div>
            </div>
          </div>
        
          {/* Controls */}
          <div className="flex-none py-4 px-4 bg-surface-800/60 backdrop-blur-md border-t border-surface-700">
            <div className="control-panel">
              {/* Mute/Unmute Button */}
              <button
                onClick={() => {
                  if (localTracks.length > 0) {
                    const audioTrack = localTracks.find(track => track.trackMediaType === 'audio');
                    if (audioTrack) {
                      audioTrack.setEnabled(!isMuted);
                      setIsMuted(!isMuted);
                    }
                  }
                }}
                className={`control-button ${isMuted ? 'bg-red-600/80 hover:bg-red-700' : 'bg-surface-700/80 hover:bg-surface-600'}`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? (
                  <MicOff size={20} className="text-white" />
                ) : (
                  <Mic size={20} className="text-white" />
                )}
              </button>
              
              {/* Video Toggle Button - only show in video mode */}
              {mode === 'video' && (
                <button
                  onClick={() => {
                    if (localTracks.length > 0) {
                      const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
                      
                      if (videoTrack) {
                        videoTrack.setEnabled(!isVideoOff);
                        setIsVideoOff(!isVideoOff);
                      } else if (mode === 'video') {
                        // Create and publish a new video track
                        AgoraRTC.createCameraVideoTrack({
                          encoderConfig: {
                            width: { min: 640, ideal: 1280, max: 1920 },
                            height: { min: 360, ideal: 720, max: 1080 },
                            frameRate: 30
                          }
                        }).then(newVideoTrack => {
                          newVideoTrack.setEnabled(true);
                          setIsVideoOff(false);
                          
                          if (clientRef.current) {
                            clientRef.current.publish(newVideoTrack);
                          }
                          
                          setLocalTracks(prev => [...prev, newVideoTrack]);
                        }).catch(error => {
                          console.error('Failed to create video track:', error);
                        });
                      }
                    }
                  }}
                  className={`control-button ${isVideoOff ? 'bg-red-600/80 hover:bg-red-700' : 'bg-surface-700/80 hover:bg-surface-600'}`}
                  title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                >
                  {isVideoOff ? (
                    <VideoOff size={20} className="text-white" />
                  ) : (
                    <Video size={20} className="text-white" />
                  )}
                </button>
              )}
              
              {/* Share Room Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="control-button bg-primary-600/80 hover:bg-primary-700"
                title="Share Room"
              >
                <Share2 size={20} className="text-white" />
              </button>
              
              {/* Leave Room Button */}
              <button
                onClick={cleanup}
                className="control-button danger"
                title="Leave Room"
              >
                <LogOut size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Share Room Modal */}
      {showShareModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="glass-modal p-6 max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setShowShareModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-semibold text-primary-400 mb-4 flex items-center">
              <Share2 size={20} className="mr-2" />
              Share Room
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room ID
              </label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={roomId}
                  className="flex-1 px-4 py-2 bg-surface-700/80 border border-surface-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(roomId);
                    setRoomIdCopied(true);
                    setTimeout(() => setRoomIdCopied(false), 2000);
                  }}
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-800 transition-colors rounded-r-md"
                >
                  {roomIdCopied ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">Share this ID with friends so they can join your room</p>
            </div>
            
            <div className="space-y-4">
              <div className="pt-4 border-t border-surface-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Room Information</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex justify-between">
                    <span>Mode:</span>
                    <span className="font-medium text-primary-400">
                      {mode === 'video' ? 'Video & Voice' : 'Voice Only'}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Participants:</span>
                    <span className="font-medium text-primary-400">{totalUniqueParticipants}/{MAX_PARTICIPANTS}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-medium text-primary-400">{roomCreationTime || 'N/A'}</span>
                  </li>
                </ul>
              </div>
              
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors duration-200 mt-4"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading overlay while joining */}
      {joining && (
        <div className="fixed inset-0 flex items-center justify-center bg-surface-900/90 z-50">
          <div className="text-center pulse-animation">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-primary-400 mb-2">Joining Room</h2>
            <p className="text-gray-400 mb-8">Establishing secure connection...</p>
            
            <button
              onClick={() => {
                cleanup();
                navigate('/rooms');
              }}
              className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 