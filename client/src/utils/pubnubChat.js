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
    // Get Publish and Subscribe keys directly, matching your actual env variable names
    // First try VITE_* prefixed variables (for Vite-based projects)
    let publishKey = import.meta.env.VITE_PUBNUB_PUBLISH_KEY || 
                    import.meta.env.publishKey || 
                    import.meta.env.VITE_publishKey || 
                    'pub-c-9ae3b848-f4a6-465f-9977-ea965eb2c6f0';
                    
    let subscribeKey = import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY || 
                      import.meta.env.subscribeKey || 
                      import.meta.env.VITE_subscribeKey || 
                      'sub-c-c1e9f51e-1ebe-4d20-8ace-b862d2ac1903';
    
    // Create PubNub connection with more verbose logging
    connectionState = 'connecting';
    
    pubnubConnection = new PubNub({
      publishKey,
      subscribeKey,
      uuid: 'anonymous', // This will be updated when user connects
      logVerbosity: true,
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
            const friend = friends.find(f => f._id === message.senderId);
            
            if (friend && friend.userName) {
              senderName = friend.userName;
            }
          } catch (error) {
          }
          
          // Show browser notification
          showNotification(senderName, {
            body: message.text,
            icon: '/logo192.png', // Default app icon
            tag: `chat-${channel}`, // Group notifications by channel
            data: {
              channel: channel,
              messageId: message.id,
              senderId: message.senderId
            }
          }).catch(error => {
          });
        }
      }
      
      // Process the message immediately 
      callback(messageEvent.message);
    }
  };

  // Set up the listener
  const listener = {
    message: messageHandler,
    presence: (presenceEvent) => {
      if (presenceEvent.channel === channel) {
      }
      // Handle presence events (join, leave, etc.) if needed
    },
    status: (statusEvent) => {
      if (statusEvent.category === "PNConnectedCategory") {
      } else if (statusEvent.category === "PNReconnectedCategory") {
        
        // Fetch missed messages on reconnection, but only if needed
        pubnubConnection.fetchMessages(
          {
            channels: [channel],
            count: 20, // Smaller count for reconnections to reduce load
          },
          (status, response) => {
            if (!status.error && response && response.channels && response.channels[channel]) {
              // Process missed messages
              response.channels[channel]
                .sort((a, b) => a.timetoken - b.timetoken)
                .forEach(msg => {
                  callback(msg.message);
                });
            }
          }
        );
      }
    }
  };

  // Add the listener
  pubnubConnection.addListener(listener);

  return {
    // Function to unsubscribe and clean up
    cleanup: () => {
      pubnubConnection.removeListener(listener);
      pubnubConnection.unsubscribe({
        channels: [channel],
      });
      // Mark channel as inactive when cleaning up
      markChannelInactive(channel);
    }
  };
};

// Enhanced message sending with better error handling and deduplication
export const sendChatMessage = async (channel, text, metadata = {}) => {
  if (!pubnubConnection) {
    return Promise.reject(new Error('PubNub connection not initialized'));
  }

  if (!channel || !text) {
    return Promise.reject(new Error('Missing channel or message text'));
  }

  // Ensure message has a unique ID
  const messageId = metadata.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const messagePayload = {
    text: text,
    timestamp: new Date().toISOString(),
    id: messageId,
    ...metadata,
  };

  return new Promise((resolve, reject) => {
    pubnubConnection.publish(
      {
        channel,
        message: messagePayload,
      },
      (status, response) => {
        if (status.error) {
          reject(status);
        } else {
          resolve(response);
        }
      }
    );
  });
};

// Test PubNub connection
export const testPubNubConnection = async () => {
  try {
    // Use a test user ID
    const testUserId = `test-${Date.now()}`;
    const testChannel = `test-channel-${Date.now()}`;
    
    // Get PubNub connection
    connectionState = 'connecting';
    const pubnub = await getPubNub();
    
    if (!pubnub) {
      return false;
    }
    
    // Set the user ID
    pubnub.setUUID(testUserId);
    
    // Check time endpoint to verify connectivity
    return new Promise((resolve) => {
      pubnub.time((status) => {
        if (!status.error) {
          connectionState = 'connected';
          resolve(true);
        } else {
          connectionState = 'disconnected';
          resolve(false);
        }
      });
    });
  } catch (error) {
    connectionState = 'disconnected';
    return false;
  }
};

// Provides the current connection state
export const getPubNubState = () => {
  return connectionState;
};

// For backwards compatibility with existing code
export const addMessageListener = (channel, callback) => {
  const setup = setupChatChannel(channel, callback);
  if (setup) {
    // Store the cleanup function in a global registry
    activeListeners.set(channel, setup.cleanup);
    return true;
  }
  return false;
};

// For backwards compatibility with existing code
export const removeMessageListener = (channel) => {
  const cleanup = activeListeners.get(channel);
  if (cleanup) {
    cleanup();
    activeListeners.delete(channel);
    return true;
  }
  return false;
};

// Function to check if browser notifications should be shown
// Checks if the channel is active and if the window is focused
export const shouldShowNotification = (channel, message) => {
  // Don't show notifications for messages from the current user
  const currentUserId = localStorage.getItem('user_id');
  if (message && message.senderId === currentUserId) {
    return false;
  }
  
  // Don't show notifications if the chat is active and the window is focused
  if (isChannelActive(channel) && isChatFocused) {
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
  testPubNubConnection,
  getPubNubState,
  markChannelActive,
  markChannelInactive,
  isChannelActive,
  shouldShowNotification
}; 