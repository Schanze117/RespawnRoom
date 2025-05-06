import PubNub from 'pubnub';

// Initialize PubNub
let pubnubConnection = null;

// Set up PubNub client
export const getPubNub = async () => {
  if (pubnubConnection) {
    return pubnubConnection;
  }

  try {
    console.log('Initializing PubNub SDK...');
    
    // Get Publish and Subscribe keys (try env vars first, then fallback to hardcoded)
 const publishKey = import.meta.env.VITE_PUBNUB_PUBLISH_KEY;
const subscribeKey = import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY;
if (!publishKey || !subscribeKey) {
  console.error('ERROR: PubNub keys are not defined in environment variables');
  return null;
}
    
    // Log masked keys for debugging
    const maskedPublishKey = publishKey.substring(0, 5) + '...' + publishKey.substring(publishKey.length - 5);
    const maskedSubscribeKey = subscribeKey.substring(0, 5) + '...' + subscribeKey.substring(subscribeKey.length - 5);
    console.log(`Using PubNub Keys - Publish: ${maskedPublishKey}, Subscribe: ${maskedSubscribeKey}`);
    
    // Create PubNub connection
    pubnubConnection = new PubNub({
      publishKey,
      subscribeKey,
      uuid: 'anonymous' // This will be updated when user connects
    });
    
    return pubnubConnection;
  } catch (error) {
    console.error('Error initializing PubNub:', error);
    pubnubConnection = null;
    throw error;
  }
};

// Connect to PubNub with user credentials
export const connectPubNub = async (userId) => {
  try {
    console.log('Connecting to PubNub with user ID:', userId);
    
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
      console.log('Already connected to PubNub as:', userId);
      return pubnub;
    }
    
    console.log('PubNub connected successfully as user:', userId);
    return pubnub;
  } catch (error) {
    console.error('Error connecting to PubNub:', error);
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
    } catch (error) {
      console.error('Error closing PubNub connection:', error);
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
    console.error('Cannot add message listener: No active connection');
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
        console.log('Received message:', messageEvent);
        callback(messageEvent.message);
      },
      presence: (presenceEvent) => {
        console.log('Presence event:', presenceEvent);
      },
      status: (statusEvent) => {
        if (statusEvent.category === 'PNConnectedCategory') {
          console.log('Connected to PubNub channel:', channel);
        } else if (statusEvent.category === 'PNNetworkDownCategory') {
          console.error('Network down for PubNub');
        } else if (statusEvent.category === 'PNNetworkUpCategory') {
          console.log('Network restored for PubNub');
        }
      }
    };
    
    pubnubConnection.addListener(listener);
    
    // Store the listener for cleanup
    pubnubConnection._customListener = listener;
    
    return true;
  } catch (error) {
    console.error('Error adding message listener:', error);
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
  } catch (error) {
    console.error('Error removing message listener:', error);
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
    
    console.log('PubNub message sent successfully', result);
    return result;
  } catch (error) {
    console.error('Error sending PubNub message:', error);
    throw error;
  }
};

// Test PubNub connection
export const testPubNubConnection = async () => {
  try {
    // Use a test user ID
    const testUserId = "testUser123";
    const testChannel = "test-channel";
    
    console.log("⚠️ RUNNING TEST CONNECTION with test user ID ⚠️");
    console.log(`Test User ID: ${testUserId}`);
    console.log(`Test Channel: ${testChannel}`);
    
    // Create a fresh connection
    pubnubConnection = null;
    const pubnub = await getPubNub();
    
    if (!pubnub) {
      console.error('Failed to initialize PubNub');
      return false;
    }
    
    // Set the user ID
    pubnub.setUUID(testUserId);
    
    // Check time endpoint to verify connectivity
    return new Promise((resolve) => {
      pubnub.time((status) => {
        if (!status.error) {
          console.log('✅ TEST CONNECTION: PubNub connection successful!');
          resolve(true);
        } else {
          console.error('❌ TEST CONNECTION: Failed!', status);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('TEST CONNECTION: Exception occurred', error);
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