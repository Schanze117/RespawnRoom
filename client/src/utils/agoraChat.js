import AgoraChat from 'agora-chat';

// Initialize Agora Chat
let chatInstance = null;

// Use singleton pattern to ensure we only have one chat instance
export const getAgoraChat = async () => {
  if (chatInstance) {
    return chatInstance;
  }

  try {
    // Create and initialize the chat instance
    const chat = new AgoraChat.create();
    
    // Get the App Key from environment variable or config
    const appKey = import.meta.env.VITE_AGORA_CHAT_APP_KEY || '41acb1a86218425cb2deed78540583bf';
    
    if (!appKey || appKey === 'your-app-key-here') {
      throw new Error('Agora Chat configuration is incomplete');
    }
    
    // Initialize the chat SDK
    await chat.init({
      appKey,
    });
    
    // Store the instance for reuse
    chatInstance = chat;
    
    return chat;
  } catch (error) {
    chatInstance = null;
    throw error;
  }
};

// Close and clean up the chat instance
export const closeAgoraChat = async () => {
  if (chatInstance) {
    try {
      await chatInstance.close();
      chatInstance = null;
    } catch (error) {
      // Silent fail for cleanup
    }
  }
};

// Add a message listener
export const addMessageListener = (callback) => {
  if (chatInstance) {
    chatInstance.on('message', callback);
    return true;
  }
  return false;
};

// Remove a message listener
export const removeMessageListener = (callback) => {
  if (chatInstance) {
    chatInstance.off('message', callback);
    return true;
  }
  return false;
};

// Send a chat message
export const sendChatMessage = async (to, message) => {
  if (!chatInstance) {
    throw new Error('Chat instance not initialized');
  }
  
  try {
    return await chatInstance.sendMessage({
      to,
      msg: message,
      type: 'txt',
    });
  } catch (error) {
    throw error;
  }
};

export default {
  getAgoraChat,
  closeAgoraChat,
  addMessageListener,
  removeMessageListener,
  sendChatMessage,
}; 