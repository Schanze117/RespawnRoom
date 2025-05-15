import PubNub from 'pubnub';
import { showNotification } from './helpers';

// Initialize PubNub
let pubnubConnection = null;
let reconnectTimer = null;
let connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected'

// Add a tracking flag to prevent multiple history fetches
let historyFetchedForChannels = new Set();

// Add tracking for active chat channels to prevent notifications
let activeChannels = new Set();

// Track whether chat is currently visible/focused
let isChatFocused = true;

// Export functions to track active channels
export const markChannelActive = (channel) => {
  if (channel) {
    activeChannels.add(channel);
    return true;
  }
  return false;
};

export const markChannelInactive = (channel) => {
  if (channel) {
    activeChannels.delete(channel);
    return true;
  }
  return false;
};

export const isChannelActive = (channel) => {
  return activeChannels.has(channel);
};

// Add window focus tracking
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    isChatFocused = true;
  });
  
  window.addEventListener('blur', () => {
    isChatFocused = false;
  });
}

// Set up PubNub client
export const getPubNub = async () => {
  if (pubnubConnection) {
    return pubnubConnection;
  }

  try {
    // Get Publish and Subscribe keys from environment variables
    let publishKey = import.meta.env.VITE_PUBNUB_PUBLISH_KEY;
    let subscribeKey = import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY;
    
    // If keys are missing, we can't initialize PubNub
    if (!publishKey || !subscribeKey) {
      console.error('PubNub keys are missing from environment variables');
      return null;
    }
    
    // Create PubNub connection
    connectionState = 'connecting';
    
    pubnubConnection = new PubNub({
      publishKey,
      subscribeKey,
      uuid: 'anonymous', // This will be updated when user connects
      logVerbosity: false, // Disable verbose logging in production
      keepAlive: true, // Keep connection alive
      heartbeatInterval: 30, // Send a heartbeat every 30 seconds
      presenceTimeout: 150, // Presence timeout after 2.5 minutes
      ssl: true
    });
    
    // Set up a global listener for connection issues
    pubnubConnection.addListener({
      status: function(status) {
        
        if (status.category === 'PNConnectedCategory') {
          connectionState = 'connected';
          
          // Clear any pending reconnect timers
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }
        } 
        else if (status.category === 'PNNetworkIssuesCategory' || 
                 status.category === 'PNNetworkDownCategory' ||
                 status.category === 'PNReconnectedCategory') {
          
          
          // Set up a reconnection timer if not already running
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              // Try to reconnect by requesting network info
              pubnubConnection.reconnect();
              reconnectTimer = null;
            }, 5000);
          }
        }
      }
    });
    
    return pubnubConnection;
  } catch (error) {
    connectionState = 'disconnected';
    pubnubConnection = null;
    throw error;
  }
};

// Connect to PubNub with user credentials
export const connectPubNub = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to connect to PubNub');
    }
    
    const pubnub = await getPubNub();
    
    if (!pubnub) {
      throw new Error('Failed to initialize PubNub connection');
    }
    
    // Set the UUID for this PubNub instance
    pubnub.setUUID(userId);
    
    // If we're already connected with this user ID, return the connection
    if (pubnub.getUUID() === userId) {
      return pubnub;
    }
    
    return pubnub;
  } catch (error) {
    throw error;
  }
};

// Close PubNub connection (for cleanup)
export const closePubNub = async () => {
  if (pubnubConnection) {
    try {
      // Clear any reconnection timers
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      
      // Clear history tracking
      historyFetchedForChannels.clear();
      
      // Clear active channels tracking
      activeChannels.clear();
      
      // Unsubscribe from all channels
      pubnubConnection.unsubscribeAll();
      connectionState = 'disconnected';
      pubnubConnection = null;
      return true;
    } catch (error) {
      connectionState = 'disconnected';
      pubnubConnection = null;
    }
  }
  return false;
};

// Generate a channel name for private chats between two users
export const getPrivateChannel = (userId1, userId2) => {
  // Sort IDs to ensure the same channel regardless of the order of users
  const sortedIds = [userId1, userId2].sort();
  return `private-chat-${sortedIds[0]}-${sortedIds[1]}`;
};

// Keep track of active listeners to avoid duplicates
const activeListeners = new Map();

// Subscribe to a channel and set up message listener
export const setupChatChannel = (channel, callback) => {
  if (!pubnubConnection) {
    return null;
  }

  // Mark this channel as active
  markChannelActive(channel);
  
  // Check if we already fetched history for this channel in this session
  const shouldFetchHistory = !historyFetchedForChannels.has(channel);

  // First, get the channel history to ensure no messages were missed
  if (shouldFetchHistory) {
    pubnubConnection.fetchMessages(
      {
        channels: [channel],
        count: 100, // Get last 100 messages
      },
      (status, response) => {
        if (status.error) {
          return;
        }
        
        if (response && response.channels && response.channels[channel]) {
          // Mark this channel as having had history fetched
          historyFetchedForChannels.add(channel);
          
          // Process history messages in chronological order (only once per channel per session)
          response.channels[channel]
            .sort((a, b) => a.timetoken - b.timetoken)
            .forEach(msg => {
              callback(msg.message);
            });
        }
      }
    );
  }

  // Subscribe to the channel for real-time updates
  pubnubConnection.subscribe({
    channels: [channel],
    withPresence: true, // Enable presence detection
  });

  // Set up the listener for new messages and presence events
  const messageHandler = (messageEvent) => {
    if (messageEvent.channel === channel) {
      // First check if we should generate a notification for this message
      const message = messageEvent.message;
      const currentUserId = localStorage.getItem('user_id');

      // Only show notification if:
      // 1. The message is not from the current user
      // 2. The channel is not active OR the window is not focused
      if (message && message.senderId !== currentUserId) {
        if (!isChannelActive(channel) || !isChatFocused) {
          // Get friend details if possible
          let senderName = message.sender || "New message";
          
          // Check if we have user info stored
          try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
            const friends = userInfo.friends || [];
            
            // Find the sender in friends list
            const friend = friends.find(f => f._id === message.senderId);
            if (friend) {
              senderName = friend.userName || senderName;
            }
          } catch (e) {
            // Silently fail and use default name
          }
          
          // Show notification
          showNotification(senderName, message.text || message.content || "Sent you a message");
        }
      }
      
      callback(message);
    }
  };

  // Add listener only if not already active for this channel
  if (!activeListeners.has(channel)) {
    const listener = {
      message: messageHandler
    };
    
    pubnubConnection.addListener(listener);
    activeListeners.set(channel, listener);
  }

  // Return the subscription details and a cleanup function
  return {
    channel,
    cleanup: () => {
      // Remove the listener
      const listener = activeListeners.get(channel);
      if (listener) {
        pubnubConnection.removeListener(listener);
        activeListeners.delete(channel);
      }
      
      // Mark channel as inactive
      markChannelInactive(channel);
      
      // Unsubscribe from the channel
      pubnubConnection.unsubscribe({
        channels: [channel]
      });
    }
  };
};

// Send a message to a channel
export const sendChatMessage = async (channel, text, metadata = {}) => {
  if (!pubnubConnection) {
    throw new Error('PubNub not initialized');
  }

  if (!channel) {
    throw new Error('Channel is required');
  }

  try {
    // Publish message to the channel
    const result = await pubnubConnection.publish({
      channel,
      message: {
        text,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
    
    return result;
  } catch (error) {
    throw error;
  }
};

// Get the current PubNub connection state
export const getPubNubState = () => {
  return {
    isConnected: connectionState === 'connected',
    state: connectionState
  };
};

// Add a message listener to a channel
export const addMessageListener = (channel, callback) => {
  if (!pubnubConnection || !channel) return null;
  
  const listener = {
    message: (messageEvent) => {
      if (messageEvent.channel === channel) {
        callback(messageEvent.message);
      }
    }
  };
  
  pubnubConnection.addListener(listener);
  return listener;
};

// Remove a specific message listener
export const removeMessageListener = (listener) => {
  if (!pubnubConnection || !listener) return false;
  
  pubnubConnection.removeListener(listener);
  return true;
};

// Check if a notification should be shown for a message
export const shouldShowNotification = (channel, message) => {
  // Don't show notifications for active channels if the window is focused
  if (isChannelActive(channel) && isChatFocused) {
    return false;
  }
  
  // Don't show notifications for messages from the current user
  const currentUserId = localStorage.getItem('user_id');
  if (message && message.senderId === currentUserId) {
    return false;
  }
  
  return true;
};

export default {
  getPubNub,
  connectPubNub,
  closePubNub,
  getPrivateChannel,
  setupChatChannel,
  addMessageListener,
  removeMessageListener,
  sendChatMessage,
  getPubNubState,
  markChannelActive,
  markChannelInactive,
  isChannelActive,
  shouldShowNotification
}; 