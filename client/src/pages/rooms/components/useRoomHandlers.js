import { useCallback } from 'react';

const useRoomHandlers = (setRemoteUsers) => {
  // Handle user publishing
  const handleUserPublished = useCallback(async (user, mediaType, clientRef) => {
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
  }, [setRemoteUsers]);

  // Handle user unpublishing
  const handleUserUnpublished = useCallback((user, mediaType) => {
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
  }, [setRemoteUsers]);

  // Handle user left
  const handleUserLeft = useCallback((user) => {
    console.log(`User ${user.uid} left the channel`);
    
    // Remove user from remoteUsers state
    setRemoteUsers(prev => {
      const newRemoteUsers = { ...prev };
      delete newRemoteUsers[user.uid];
      return newRemoteUsers;
    });
  }, [setRemoteUsers]);

  // Handle user joined
  const handleUserJoined = useCallback((user) => {
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
    
    // Strategy 3: If no username found
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
    if (!username && user.client && user.client.getUserAttributes) {
      user.client.getUserAttributes(user.uid)
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
  }, [setRemoteUsers]);

  return {
    handleUserPublished,
    handleUserUnpublished,
    handleUserLeft,
    handleUserJoined
  };
};

export default useRoomHandlers; 