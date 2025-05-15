import { useCallback } from 'react';

// Helper function to create a safe-to-log version of user
const createLogSafeUser = (user) => {
  if (!user) return null;
  return {
    uid: user.uid,
    hasAudio: !!user.audioTrack,
    hasAudioPublished: !!user.hasAudio,
  };
};

const useRoomHandlers = (setRemoteUsers) => {
  // Handle user publishing
  const handleUserPublished = useCallback(async (user, mediaType, clientRef) => {
    console.log(`[useRoomHandlers] User ${user.uid} published ${mediaType} track.`);
    
    try {
      // Only process audio tracks in voice-only mode
      if (mediaType === 'audio') {
        await clientRef.current.subscribe(user, mediaType);
        console.log(`[useRoomHandlers] Successfully subscribed to ${user.uid}'s audio track`);
        
        setRemoteUsers(prevUsers => {
          const newUser = { ...prevUsers[user.uid] || {}, uid: user.uid };
          
          if (mediaType === 'audio') {
            newUser.audioTrack = user.audioTrack;
            newUser.hasAudio = true;
          }
          
          // Get username property if available from user metadata
          if (user.username || user.userProperties?.username) {
            newUser.username = user.username || user.userProperties?.username;
          }
          
          // Create a new state object to trigger re-render
          return { ...prevUsers, [user.uid]: newUser };
        });
        
        console.log('[useRoomHandlers] Added user to remoteUsers state:', user.uid);
      }
    } catch (subscribeError) {
      console.error(`[useRoomHandlers] Failed to subscribe to ${user.uid}'s ${mediaType} track:`, subscribeError);
    }
  }, [setRemoteUsers]);

  // Handle user unpublishing
  const handleUserUnpublished = useCallback((user, mediaType) => {
    console.log(`[useRoomHandlers] User ${user.uid} unpublished ${mediaType} track.`);
    
    // Only process audio tracks in voice-only mode
    if (mediaType === 'audio') {
      setRemoteUsers(prevUsers => {
        // If this user exists in our state
        if (prevUsers[user.uid]) {
          const newUser = { ...prevUsers[user.uid] };
          
          if (mediaType === 'audio') {
            newUser.audioTrack = null;
            newUser.hasAudio = false;
          }
          
          return { ...prevUsers, [user.uid]: newUser };
        }
        
        return prevUsers;
      });
    }
  }, [setRemoteUsers]);

  // Handle user left
  const handleUserLeft = useCallback((user) => {
    console.log(`[useRoomHandlers] User ${user.uid} left.`);
    setRemoteUsers(prevUsers => {
      const newUsers = { ...prevUsers };
      delete newUsers[user.uid];
      return newUsers;
    });
  }, [setRemoteUsers]);

  // Handle user join
  const handleUserJoined = useCallback((user) => {
    console.log(`[useRoomHandlers] User ${user.uid} joined.`);
    // Initialize placeholder for new user with UID only
    setRemoteUsers(prevUsers => {
      if (!prevUsers[user.uid]) {
        return { ...prevUsers, [user.uid]: { uid: user.uid } };
      }
      return prevUsers;
    });
  }, [setRemoteUsers]);

  return {
    handleUserPublished,
    handleUserUnpublished,
    handleUserLeft,
    handleUserJoined
  };
};

export default useRoomHandlers; 