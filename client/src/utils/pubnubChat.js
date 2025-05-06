import PubNub from 'pubnub';

// Initialize PubNub
let pubnubConnection = null;

// Set up PubNub client
export const getPubNub = async () => {
  if (pubnubConnection) {
    return pubnubConnection;
  }

  try {
    // Get Publish and Subscribe keys (try env vars first, then fallback to hardcoded)
    const publishKey = import.meta.env.VITE_PUBNUB_PUBLISH_KEY;
    const subscribeKey = import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY;
    if (!publishKey || !subscribeKey) {
      return null;
    }
    
    // Create PubNub connection
    pubnubConnection = new PubNub({
      publishKey,
      subscribeKey,
      uuid: 'anonymous' // This will be updated when user connects
    });
    
    return pubnubConnection;
  } catch (error) {
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
      // Unsubscribe from all channels
      pubnubConnection.unsubscribeAll();
      pubnubConnection = null;
      return true;
    } catch {
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

// Add message listener for a specific channel
export const addMessageListener = (channel, callback) => {
  if (!pubnubConnection) {
    return false;
  }
  
  try {
    // Subscribe to the channel
    pubnubConnection.subscribe({
      channels: [channel]
    });
    
    // Add listener for messages
    const listener = {
      message: (messageEvent) => {
        callback(messageEvent.message);
      },
      presence: () => {
        // Handle presence events silently
      },
      status: (statusEvent) => {
        // Handle status events silently
      }
    };
    
    pubnubConnection.addListener(listener);
    
    // Store the listener for cleanup
    pubnubConnection._customListener = listener;
    
    return true;
  } catch {
    return false;
  }
};

// Remove message listener
export const removeMessageListener = (channel) => {
  if (!pubnubConnection) {
    return false;
  }
  
  try {
    // Unsubscribe from the channel
    pubnubConnection.unsubscribe({
      channels: [channel]
    });
    
    // Remove the listener
    if (pubnubConnection._customListener) {
      pubnubConnection.removeListener(pubnubConnection._customListener);
      pubnubConnection._customListener = null;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Send a chat message
export const sendChatMessage = async (channel, message, metadata = {}) => {
  if (!pubnubConnection) {
    throw new Error('PubNub connection not initialized');
  }
  
  try {
    // Ensure we have a valid timestamp
    const timestamp = new Date().toISOString();
    
    // Publish the message to the channel
    const result = await pubnubConnection.publish({
      channel,
      message: {
        text: message,
        timestamp: timestamp,
        ...metadata
      }
    });
    
    return result;
  } catch (error) {
    throw error;
  }
};

// Test PubNub connection
export const testPubNubConnection = async () => {
  try {
    // Use a test user ID
    const testUserId = "testUser123";
    const testChannel = "test-channel";
    
    // Create a fresh connection
    pubnubConnection = null;
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
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  } catch {
    return false;
  }
};

export default {
  getPubNub,
  connectPubNub,
  closePubNub,
  getPrivateChannel,
  addMessageListener,
  removeMessageListener,
  sendChatMessage,
  testPubNubConnection
}; 