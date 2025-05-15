import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';
import { useRoomContext } from '../../../utils/RoomContext';

// Import components
import RoomHeader from './RoomHeader';
import { AudioGrid } from './AudioContainers';
import ControlPanel from './ControlPanel';
import ShareModal from './ShareModal';
import JoiningOverlay from './JoiningOverlay';
import ConnectionError from './ConnectionError';
import useRoomHandlers from './useRoomHandlers';
import { audioContainerStyles, getGridLayout, MAX_PARTICIPANTS } from './styles';

const RoomContainer = () => {
  console.log("Room component initialized");
  
  const { id: roomId } = useParams();
  console.log("Room ID:", roomId);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  // Force voice mode only, ignoring URL params
  const mode = 'voice'; // Fixed to voice only
  console.log("Room mode:", mode);

  // Room context for floating window
  const { 
    enterRoom, 
    exitRoom, 
    updateParticipantCount,
    startJoining,
    completeJoining,
    updateParticipants
  } = useRoomContext();

  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [joining, setJoining] = useState(true);
  const [copied, setCopied] = useState(false);
  const [roomIdCopied, setRoomIdCopied] = useState(false);
  const [roomName] = useState('Respawn Room');
  const [connectionError, setConnectionError] = useState('');
  const [tokenDetails, setTokenDetails] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [roomFull, setRoomFull] = useState(false);
  const [roomCreationTime, setRoomCreationTime] = useState(null);
  const [userNickname, setUserNickname] = useState('');
  
  // Use a more deterministic UID when using tokens
  const uid = useRef(Math.floor(Math.random() * 100000));
  const isExplicitlyLeavingRef = useRef(false);

  // Create client ref inside the component to avoid issues with hooks
  const clientRef = useRef(null);
  const rtmClientRef = useRef(null); // Add RTM client reference
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

  // Define our custom implementation of handleUserPublishedBase
  const customHandleUserPublishedBase = async (user, mediaType, clientRef) => {
    console.log('Remote user published media type:', mediaType, 'User ID:', user.uid);
    
    // First ensure we're tracking this user
    setRemoteUsers(prev => {
      // Skip if we're already tracking, just update
      if (prev[user.uid]) {
        const updatedUser = {
          ...prev[user.uid]
        };
        
        // Update tracks based on mediaType
        if (mediaType === 'audio') {
          updatedUser.audioTrack = user.audioTrack;
          updatedUser.hasAudio = true;
        } else if (mediaType === 'video') {
          updatedUser.videoTrack = user.videoTrack;
          updatedUser.hasVideo = true;
        }
        
        return { ...prev, [user.uid]: updatedUser };
      }
      
      // New user we haven't seen before
      return {
        ...prev,
        [user.uid]: {
          uid: user.uid,
          audioTrack: mediaType === 'audio' ? user.audioTrack : null,
          videoTrack: mediaType === 'video' ? user.videoTrack : null,
          hasAudio: mediaType === 'audio',
          hasVideo: mediaType === 'video',
          // Try to get stored username from sessionStorage
          username: window.sessionStorage.getItem(`rtc_user_${user.uid}`) || null
        }
      };
    });
    
    // Subscribe to the track immediately
    if (clientRef.current) {
      await clientRef.current.subscribe(user, mediaType);
      console.log(`Subscribed to ${mediaType} track of user ${user.uid}`);
      
      // Immediately try to fetch user attributes if we have a new user
      setTimeout(() => fetchUserAttributes(user.uid), 300);
    }
  };

  // Wrap handleUserPublished to include the clientRef
  const handleUserPublished = async (user, mediaType) => {
    // Use our custom implementation instead of the original
    await customHandleUserPublishedBase(user, mediaType, clientRef);
    
    // After a user joins, try to get their attributes via RTM
    try {
      fetchRtmUserAttributes(user.uid.toString());
    } catch (error) {
      console.warn('Error getting published user attributes:', error);
    }
  };

  // Helper function to fetch user attributes
  const fetchUserAttributes = async (uid) => {
    if (!clientRef.current || !clientRef.current.getUserAttributes) {
      console.warn('getUserAttributes is not available');
      return;
    }
    
    try {
      const userAttributes = await clientRef.current.getUserAttributes(uid, ['username']);
      if (userAttributes && userAttributes.username) {
        console.log(`Got attributes for user ${uid}:`, userAttributes);
        
        // Update the remote user with the username
        setRemoteUsers(prevUsers => {
          if (prevUsers[uid]) {
            return { 
              ...prevUsers, 
              [uid]: {
                ...prevUsers[uid],
                username: userAttributes.username
              }
            };
          }
          return prevUsers;
        });
        
        // Store in session storage
        window.sessionStorage.setItem(`rtc_user_${uid}`, userAttributes.username);
        return userAttributes.username;
      }
    } catch (error) {
      console.warn(`Error getting attributes for user ${uid}:`, error);
    }
    return null;
  };

  // Rename this function to avoid conflict with the imported handleUserJoined
  const handleUserJoinedWithAttributes = async (user) => {
    console.log('User joined with attributes:', user.uid);
    // Attempt to get their attributes via RTM
    fetchRtmUserAttributes(user.uid.toString());
  };

  // Effect to load nickname from localStorage
  useEffect(() => {
    const storedNickname = localStorage.getItem('nickname');
    if (storedNickname) {
      setUserNickname(storedNickname);
    } else {
      // Fallback if no nickname is set, though homepage should enforce it
      setUserNickname('Guest'); 
    }
  }, []);

  // Clean up resources
  const cleanup = async () => {
    console.log('Cleaning up room...');
    
    // Set flag to prevent automatic rejoins
    isExplicitlyLeavingRef.current = true;
    
    try {
      // Clean up RTM client
      if (rtmClientRef.current) {
        try {
          console.log('Logging out of RTM...');
          await rtmClientRef.current.logout();
          console.log('RTM logout successful');
        } catch (rtmError) {
          console.error('Error during RTM logout:', rtmError);
        }
      }
      
      // Unpublish and close all local tracks
      if (localTracks.length > 0) {
        console.log('Unpublishing and closing local tracks...');
        for (const track of localTracks) {
          // Stop playing in case it's still playing
          try {
            if (track.trackMediaType === 'video') track.stop();
          } catch (e) {
            // Ignore errors from stopping
          }
          
          try {
            await clientRef.current?.unpublish(track);
          } catch (e) {
            console.error('Error unpublishing track:', e);
          }
          
          // Close the track
          try {
            await track.close();
          } catch (e) {
            console.error('Error closing track:', e);
          }
        }
        
        // Clear local tracks state
        setLocalTracks([]);
      }
      
      // Leave channel if we have an active client
      if (clientRef.current) {
        console.log('Leaving Agora channel...');
        
        try {
          await clientRef.current.leave();
          console.log('Successfully left Agora channel');
        } catch (err) {
          console.error('Error leaving Agora channel:', err);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      console.log('Cleanup completed');
    }
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

  // Modified join function with no video support
  const join = async () => {
    try {
      console.log('Starting join process for room:', roomId);
      
      // Check if nickname is set
      const storedNickname = localStorage.getItem('nickname');
      if (!storedNickname) {
        console.error('Nickname not set. Cannot join room.');
        setConnectionError('Please set your nickname before joining a room.');
        setJoining(false);
        return;
      }
      
      // Make sure we have the nickname set properly
      if (!userNickname) {
        setUserNickname(storedNickname);
      }
      
      // Prepare display name (preferred: nickname from localStorage, fallback: uid)
      const displayName = storedNickname || `user-${uid.current}`;

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
      
      // Check if we have a valid App ID
      const appId = import.meta.env.VITE_AGORA_APP_ID;
      if (!appId) {
        console.error('Agora App ID not configured');
        setConnectionError('Agora App ID not configured properly. Please check your environment variables.');
        setJoining(false);
        return;
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
      clientRef.current.on('user-joined', (user) => {
        // Call both handlers - first the original one, then our custom one for attributes
        handleUserJoined(user);
        handleUserJoinedWithAttributes(user);
      });
      
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
      
      // Get token for the channel
      console.log('Getting token for channel:', roomId);
      const tokenData = await fetchToken(roomId);
      console.log('Token received, proceeding to join channel');
      
      // STEP 1: First, set up and login to RTM
      if (rtmClientRef.current) {
        try {
          // Clean up any existing RTM connection
          try {
            await rtmClientRef.current.logout();
            console.log('Logged out of RTM successfully');
          } catch (err) {
            // This is expected if we weren't logged in
            console.log('No previous RTM session to log out from');
          }
          
          // Login to RTM with the same UID as RTC or user account
          const rtmLoginSuccess = await loginRtmUser(tokenData.uid || uid.current, tokenData.rtmToken);
          
          if (rtmLoginSuccess) {
            console.log('RTM login successful, joining RTM channel');
            // Join the RTM channel with the same name as the RTC channel
            const rtmChannel = await joinRtmChannel(roomId);
            
            if (rtmChannel) {
              console.log('RTM channel joined, setting user attributes');
              // Set the user's nickname as an attribute
              await setRtmUserAttributes([{ key: 'nickname', value: displayName }]);
              console.log('User attributes set in RTM');
            }
          }
        } catch (rtmError) {
          console.error('Error setting up RTM:', rtmError);
          // Continue anyway - this is not a critical error
        }
      }
      
      // Preflight check for microphone permissions only
      try {
        // Only request audio permissions for voice-only mode
        const permissionsStream = await navigator.mediaDevices.getUserMedia({ 
          audio: true,
          video: false // No video permissions needed
        });
        
        // We got permissions, clean this up right away (we'll create proper tracks later)
        permissionsStream.getTracks().forEach(track => track.stop());
        console.log('Audio permissions granted');
      } catch (permError) {
        console.error('Audio permissions denied:', permError);
        setConnectionError('Unable to access your microphone. Please check your browser permissions.');
        setJoining(false);
        return;
      }
      
      console.log('Joining as:', displayName);
      
      // Now join the RTC channel with userAccount (after RTM setup is complete)
      try {
        console.log('Joining channel with userAccount:', {
          appId: tokenData.appId || appId ? 'present' : 'missing',
          token: tokenData.token ? 'present' : 'missing',
          channel: roomId,
          userAccount: displayName
        });
        
        // First, try using joinChannelWithUserAccount
        try {
          // Join with userAccount
          await clientRef.current.joinChannelWithUserAccount(
            tokenData.token,
            roomId,
            displayName
          );
          
          console.log('Successfully joined channel with userAccount');
        } catch (userAccountError) {
          console.error('Failed to join with userAccount:', userAccountError);
          
          // Fallback to regular join method
          console.log('Falling back to regular join method with UID');
          await clientRef.current.join(
            tokenData.appId || appId,
            roomId,
            tokenData.token,
            tokenData.uid || uid.current
          );
        }
      } catch (joinError) {
        console.error('Error joining channel:', joinError);
        throw joinError;
      }
      
      console.log('Successfully joined channel, creating audio track');
      
      // Create only audio track, no video in voice-only mode
      let audioTrack;
      
      try {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        console.log('Audio track created successfully');
      } catch (audioError) {
        console.error('Failed to create audio track:', audioError);
        throw new Error('Could not create audio track');
      }
      
      // Only add audio track
      const tracks = [];
      if (audioTrack) tracks.push(audioTrack);
          
      if (tracks.length === 0) {
        console.error('No tracks were created');
        throw new Error('Could not create any media tracks');
      }
          
      // Save tracks to state
      setLocalTracks(tracks);
          
      // Publish tracks
      console.log('Publishing audio track to channel');
      for (const track of tracks) {
        console.log(`Publishing ${track.trackMediaType} track`);
        await clientRef.current.publish(track);
      }
          
      console.log('All tracks published, joining complete');
      // Set joining to false to show the interface
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
          
          // Initialize the RTM client
          try {
            console.log('Initializing Agora RTM client...');
            const appId = import.meta.env.VITE_AGORA_APP_ID;
            rtmClientRef.current = AgoraRTM.createInstance(appId);
            console.log('Agora RTM client initialized successfully');
            
            // Set up RTM client event listeners
            rtmClientRef.current.on('ConnectionStateChanged', (newState, reason) => {
              console.log(`RTM Connection state changed to ${newState} because of ${reason}`);
            });
            
            rtmClientRef.current.on('MessageFromPeer', ({ text }, peerId) => {
              console.log(`Message from peer ${peerId}: ${text}`);
            });
          } catch (rtmError) {
            console.error('Failed to initialize Agora RTM client:', rtmError);
          }
          
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
          
          // Add listener for user-info-updated events to get attributes from other users
          clientRef.current.on('user-info-updated', async (uid, msg) => {
            console.log(`User info updated for uid ${uid}:`, msg);
            // Use the helper function to fetch and update user attributes
            fetchUserAttributes(uid);
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
      // Try to get username from user object, then from session storage, then fallback to generic
      name: user.username || 
            window.sessionStorage.getItem(`rtc_user_${user.uid}`) || 
            `User ${user.uid?.toString()?.slice(-4)}`,
      hasAudio: user.audioTrack && !user.audioTrack?.muted // More robust check
    }));
    
    // Add local user
    const localDisplayName = userNickname || localStorage.getItem('nickname') || 'You'; // Use nickname from state or localStorage
    participants.unshift({
      uid: uid.current,
      name: localDisplayName,
      hasAudio: !isMuted && localTracks.some(track => track.trackMediaType === 'audio')
    });
    
    // Update the context with participant info
    updateParticipants(participants);
    
    console.log(`Updated participant list in context. Total: ${participants.length}`);
    console.log('Participants:', participants.map(p => `${p.name} (${p.uid})`).join(', '));
  }, [remoteUsers, isMuted, localTracks, updateParticipantCount, updateParticipants, userNickname]); // Added userNickname dependency

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
      console.log(`[RoomContainer] Checking remote user ${user.uid} for video rendering. Has video: ${!!user.videoTrack && user.video}`);
      if (user.videoTrack && user.video) {
        const containerId = `remote-video-${user.uid}`;
        const container = document.getElementById(containerId);
        console.log(`[RoomContainer] Remote user ${user.uid} has videoTrack and video=true. Container:`, container ? "found" : "not found");
        
        if (container) {
          try {
            user.videoTrack.stop();
          } catch (e) {
            // Ignore errors from stopping
          }
          
          try {
            console.log(`[RoomContainer] Attempting to play video for remote user ${user.uid} in container ${containerId}`);
            user.videoTrack.play(containerId, { 
              fit: 'contain',
              mirror: false
            });
            console.log(`[RoomContainer] Successfully called play for remote user ${user.uid}`);
          } catch (error) {
            console.error(`[RoomContainer] Error playing video for remote user ${user.uid}:`, error);
          }
        } else {
          console.warn(`[RoomContainer] Video container ${containerId} not found for user ${user.uid}. Video will not be played yet.`);
        }
      } else {
        console.log(`[RoomContainer] Remote user ${user.uid} either no videoTrack or video is false. Skipping video play.`);
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

  // Set active room in context when joining and cleanup on leave
  useEffect(() => {
    if (!joining && !connectionError) {
      // Set active room in context
      enterRoom({
        id: roomId,
        name: roomName,
        mode: 'voice'
      });
    }
    
    // Clean up on unmount
    return () => {
      // Only call exitRoom from context if this is an explicit leave.
      // If navigating away for floating window, activeRoom should persist.
      if (isExplicitlyLeavingRef.current) {
        exitRoom();
      }
    };
  }, [joining, connectionError, roomId, roomName, enterRoom, exitRoom]);

  // Add debugging before the return
  console.log("Rendering RoomContainer with state:", {
    connectionError: !!connectionError,
    joining,
    localTracks: localTracks.length,
    remoteUsers: Object.keys(remoteUsers).length,
    uniqueRemoteUsers: uniqueRemoteUsers?.length || 0,
    totalUniqueParticipants
  });

  // Add RTM helper methods
  const loginRtmUser = async (uid, token) => {
    if (!rtmClientRef.current) {
      console.error('RTM client not initialized');
      return false;
    }
    
    try {
      console.log(`Logging into RTM as user: ${uid}`);
      // Use token if available, or pass null for testing (not recommended for production)
      await rtmClientRef.current.login({ uid: uid.toString(), token: token || null });
      console.log('RTM login successful');
      return true;
    } catch (error) {
      console.error('Failed to login to RTM:', error);
      return false;
    }
  };
  
  const joinRtmChannel = async (channelName) => {
    if (!rtmClientRef.current) {
      console.error('RTM client not initialized');
      return null;
    }
    
    try {
      console.log(`Joining RTM channel: ${channelName}`);
      const channel = rtmClientRef.current.createChannel(channelName);
      
      // Set up channel event listeners
      channel.on('ChannelMessage', (message, memberId) => {
        console.log(`Channel message from ${memberId}:`, message);
      });
      
      channel.on('MemberJoined', (memberId) => {
        console.log(`Member ${memberId} joined the channel`);
        // Try to get member attributes after they join
        setTimeout(() => fetchRtmUserAttributes(memberId), 300);
      });
      
      channel.on('MemberLeft', (memberId) => {
        console.log(`Member ${memberId} left the channel`);
      });
      
      // Join the channel
      await channel.join();
      console.log('Successfully joined RTM channel');
      return channel;
    } catch (error) {
      console.error('Failed to join RTM channel:', error);
      return null;
    }
  };
  
  const setRtmUserAttributes = async (attributes) => {
    if (!rtmClientRef.current) {
      console.error('RTM client not initialized');
      return false;
    }
    
    try {
      console.log('Setting RTM user attributes:', attributes);
      await rtmClientRef.current.setLocalUserAttributes(attributes);
      console.log('RTM user attributes set successfully');
      return true;
    } catch (error) {
      console.error('Failed to set RTM user attributes:', error);
      return false;
    }
  };
  
  const fetchRtmUserAttributes = async (userId) => {
    if (!rtmClientRef.current) {
      console.error('RTM client not initialized');
      return null;
    }
    
    try {
      console.log(`Fetching RTM attributes for user: ${userId}`);
      const userAttributes = await rtmClientRef.current.getUserAttributes(userId);
      console.log(`Retrieved attributes for user ${userId}:`, userAttributes);
      
      if (userAttributes && userAttributes.nickname) {
        // Update the remote user in state with the nickname
        setRemoteUsers(prevUsers => {
          if (prevUsers[userId]) {
            return {
              ...prevUsers,
              [userId]: {
                ...prevUsers[userId],
                username: userAttributes.nickname
              }
            };
          }
          return prevUsers;
        });
        
        // Store in session storage for persistence
        window.sessionStorage.setItem(`rtc_user_${userId}`, userAttributes.nickname);
        return userAttributes.nickname;
      }
    } catch (error) {
      console.error(`Failed to get attributes for user ${userId}:`, error);
    }
    
    // If the first attempt fails, retry after a delay
    setTimeout(async () => {
      try {
        const retryAttributes = await rtmClientRef.current.getUserAttributes(userId);
        if (retryAttributes && retryAttributes.nickname) {
          setRemoteUsers(prevUsers => {
            if (prevUsers[userId]) {
              return {
                ...prevUsers,
                [userId]: {
                  ...prevUsers[userId],
                  username: retryAttributes.nickname
                }
              };
            }
            return prevUsers;
          });
          
          window.sessionStorage.setItem(`rtc_user_${userId}`, retryAttributes.nickname);
        }
      } catch (retryError) {
        console.error(`Retry failed for user ${userId} attributes:`, retryError);
      }
    }, 500);
    
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-surface-900 text-white">
      {connectionError ? (
        <ConnectionError error={connectionError} />
      ) : (
        <div className="flex flex-col h-full">
          {/* Inject our custom CSS */}
          <style>{audioContainerStyles}</style>
          
          {/* Room Header */}
          <RoomHeader 
            roomName={roomName}
            mode={mode}
            totalUniqueParticipants={totalUniqueParticipants}
            MAX_PARTICIPANTS={MAX_PARTICIPANTS}
            cleanup={cleanup}
            setShowShareModal={setShowShareModal}
          />
          
          {/* Audio Grid */}
          <div className="flex-grow flex overflow-hidden">
            <div className="flex-grow p-4 sm:p-6 overflow-auto w-full">
              <AudioGrid 
                isMuted={isMuted}
                uniqueRemoteUsers={uniqueRemoteUsers}
                totalUniqueParticipants={uniqueRemoteUsers.length + 1}
                getGridLayout={getGridLayout}
                userNickname={userNickname}
              />
              {showShareModal && <ShareModal setShowShareModal={setShowShareModal} roomId={roomId} />}
            </div>
          </div>
        
          {/* Control Panel */}
          {!joining && !connectionError && (
            <ControlPanel 
              isMuted={isMuted} 
              setIsMuted={setIsMuted} 
              localTracks={localTracks} 
              setShowShareModal={setShowShareModal}
              cleanup={cleanup}
            />
          )}
        </div>
      )}
      
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