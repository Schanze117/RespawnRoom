import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useRoomContext } from '../../../utils/RoomContext';

// Import components
import RoomHeader from './RoomHeader';
import { VideoGrid } from './VideoContainers';
import ControlPanel from './ControlPanel';
import ShareModal from './ShareModal';
import JoiningOverlay from './JoiningOverlay';
import ConnectionError from './ConnectionError';
import useRoomHandlers from './useRoomHandlers';
import { videoContainerStyles, getGridLayout, MAX_PARTICIPANTS } from './styles';

const RoomContainer = () => {
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
    completeJoining,
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
  const isExplicitlyLeavingRef = useRef(false);

  // Create client ref inside the component to avoid issues with hooks
  const clientRef = useRef(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;

  // Add a new state to track instance ID to prevent duplicate joins
  const [instanceId] = useState(() => {
    // Generate a unique instance ID for this room instance
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });

  // Import event handlers
  const { 
    handleUserPublished: handleUserPublishedBase, 
    handleUserUnpublished, 
    handleUserLeft, 
    handleUserJoined
  } = useRoomHandlers(setRemoteUsers);

  // Wrap handleUserPublished to include the clientRef
  const handleUserPublished = async (user, mediaType) => {
    await handleUserPublishedBase(user, mediaType, clientRef);
  };

  // Clean up resources
  const cleanup = async () => {
    isExplicitlyLeavingRef.current = true; // Signal that this is an explicit leave action
    console.log("Performing cleanup (explicit leave)");
    
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
      // Don't call cleanup here as it might interfere with navigation to floating window
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
    
    // Clean up on unmount or when dependencies change significantly
    return () => {
      // Only call exitRoom from context if this is an explicit leave.
      // If navigating away for floating window, activeRoom should persist.
      if (isExplicitlyLeavingRef.current) {
        exitRoom();
      }
    };
  }, [remoteUsers, isMuted, isVideoOff, roomId, roomName, enterRoom, exitRoom, updateParticipantCount]);

  // Update the local user rendering to handle duplicate display issues
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

  // Main join/cleanup effect
  useEffect(() => {
    if (joining) {
      join();
    }
    
    const performCleanupOnUnmount = async () => {
      // Only perform full Agora cleanup if this unmount is due to an explicit leave action.
      // Otherwise, the room should persist for the floating window.
      if (isExplicitlyLeavingRef.current) {
        await cleanup(); // Call the main cleanup function
      } else {
        console.log('Room component unmounting (navigation), floating window should persist if room is active.');
        // When navigating away, and not explicitly leaving, we don't run the full Agora cleanup.
        // The RoomContext's `checkPathAndToggleWindow` will handle showing the floating window
        // as long as `activeRoom` is still set in the context (which it should be,
        // because the other useEffect's call to `exitRoom()` is now also conditional).
      }
    };

    return () => {
      performCleanupOnUnmount();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, mode]); // Only re-run if roomId or mode changes

  // Filter remoteUsers to ensure no duplicates with the local user
  const uniqueRemoteUsers = Object.values(remoteUsers).filter(user => user.uid !== uid.current);
  const totalUniqueParticipants = uniqueRemoteUsers.length + 1; // +1 for local user

  // If connection error, show error screen
  if (connectionError) {
    return <ConnectionError connectionError={connectionError} navigate={navigate} />;
  }

  return (
    <div className="page-container flex-1 pt-20 md:pl-64">
      <div className="mx-auto px-2 sm:px-4 h-[calc(100vh-80px)]">
        <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden h-full flex flex-col">
          {/* Inject our custom CSS */}
          <style>{videoContainerStyles}</style>
          
          {/* Room Header */}
          <RoomHeader 
            roomName={roomName}
            mode={mode}
            totalUniqueParticipants={totalUniqueParticipants}
            MAX_PARTICIPANTS={MAX_PARTICIPANTS}
            roomId={roomId}
            roomIdCopied={roomIdCopied}
            setRoomIdCopied={setRoomIdCopied}
            setShowShareModal={setShowShareModal}
          />
          
          {/* Main content with videos */}
          <div className="flex-grow flex overflow-hidden">
            <div className="flex-grow p-2 sm:p-4 overflow-auto w-full">
              <VideoGrid 
                mode={mode}
                isVideoOff={isVideoOff}
                isMuted={isMuted}
                uniqueRemoteUsers={uniqueRemoteUsers}
                totalUniqueParticipants={totalUniqueParticipants}
                getGridLayout={getGridLayout}
              />
            </div>
          </div>
        
          {/* Controls Panel */}
          <ControlPanel 
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            isVideoOff={isVideoOff}
            setIsVideoOff={setIsVideoOff}
            localTracks={localTracks}
            setLocalTracks={setLocalTracks}
            mode={mode}
            setShowShareModal={setShowShareModal}
            cleanup={cleanup}
            clientRef={clientRef}
          />
        </div>
      </div>
      
      {/* Share Room Modal */}
      <ShareModal 
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        roomId={roomId}
        roomIdCopied={roomIdCopied}
        setRoomIdCopied={setRoomIdCopied}
        mode={mode}
        totalUniqueParticipants={totalUniqueParticipants}
        MAX_PARTICIPANTS={MAX_PARTICIPANTS}
        roomCreationTime={roomCreationTime}
      />
      
      {/* Loading overlay while joining */}
      <JoiningOverlay 
        joining={joining}
        cleanup={cleanup}
        navigate={navigate}
      />
    </div>
  );
};

export default RoomContainer; 