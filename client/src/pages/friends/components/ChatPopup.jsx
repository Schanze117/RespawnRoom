import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_MESSAGES } from '../../../utils/queries';
import { SEND_MESSAGE, MARK_MESSAGES_AS_READ } from '../../../utils/mutations';
import UserAvatar from './UserUtils';
import { format } from 'date-fns';
import { getPubNub, connectPubNub, addMessageListener, removeMessageListener, sendChatMessage, testPubNubConnection, getPrivateChannel } from '../../../utils/pubnubChat';
import Auth from '../../../utils/auth'; // Import Auth to get current user details

// Helper function to validate dates before formatting
const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const ChatPopup = ({ friend, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sendMessage] = useMutation(SEND_MESSAGE);
  const [markAsRead] = useMutation(MARK_MESSAGES_AS_READ);
  const [chatError, setChatError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef(null);
  const messageEndRef = useRef(null);
  const chatInitialized = useRef(false);
  const currentUser = Auth.getProfile(); // Get current user info
  const [showDebug, setShowDebug] = useState(false);
  const channelRef = useRef(null);

  // Function to test PubNub connection
  const runPubNubTest = async () => {
    try {
      setChatError('Running PubNub connection test...');
      const success = await testPubNubConnection();
      if (success) {
        setChatError('PubNub test connection successful!');
        setTimeout(() => setChatError(null), 3000);
      } else {
        setChatError('PubNub test connection failed. Check console for details.');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setChatError(`PubNub test failed: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Toggle debug panel
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  // Query for initial messages with improved error handling
  const { loading, data, refetch } = useQuery(GET_MESSAGES, {
    variables: { friendId: friend._id, limit: 50 },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      try {
        if (!data || !data.getMessages) {
          console.log('No messages data returned from query');
          setMessages([]);
          return;
        }
        
        // Ensure we have an array of messages
        const messageList = Array.isArray(data.getMessages) ? data.getMessages : [];
        
        console.log('Messages loaded:', messageList.length);
        setMessages(messageList);
        
        // Mark messages as read when we load them - only if there are any
        if (friend && friend._id && messageList.length > 0) {
          try {
            markAsRead({ 
              variables: { senderId: friend._id }
            }).catch(error => {
              console.error("Error marking messages as read:", error);
            });
          } catch (error) {
            console.error("Error marking messages as read:", error);
          }
        }
      } catch (error) {
        console.error("Error processing messages:", error);
        setMessages([]);
      }
    },
    onError: (error) => {
      console.error("Error loading messages:", error);
      // Handle the error gracefully and don't alarm the user unnecessarily
      setMessages([]);
    }
  });

  // Message listener function to handle incoming real-time messages
  const handleNewMessage = (message) => {
    console.log("PubNub real-time message received:", message);
    
    // Check if message is from the current chat partner (using the senderId field)
    if (message.senderId === friend._id) {
      // Ensure we have a valid timestamp
      const timestamp = message.timestamp && isValidDate(message.timestamp) 
        ? message.timestamp 
        : new Date().toISOString();
      
      // Create a message object in our app's format
      const newMessage = {
        _id: message.id || `pubnub-${Date.now()}`,
        senderId: message.senderId,
        receiverId: currentUser._id,
        content: message.text,
        timestamp: timestamp,
        read: false,
        sender: { _id: message.senderId, userName: friend.userName }
      };
      
      // Add message to UI
      setMessages(prev => Array.isArray(prev) ? [...prev, newMessage] : [newMessage]);
      
      // Mark message as read immediately
      try {
        markAsRead({ 
          variables: { senderId: friend._id }
        }).catch(error => {
          console.error("Error marking messages as read:", error);
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
  };

  // Setup PubNub for real-time messaging
  useEffect(() => {
    let chatConnected = false;
    let pollInterval = null;
    
    // Initialize PubNub
    const initPubNub = async () => {
      try {
        // Make sure we have the current user information
        if (!currentUser || !currentUser._id) {
          console.error("Cannot initialize PubNub: Current user information not available");
          return false;
        }
        
        console.log(`Initializing PubNub for user ${currentUser._id}`);
        
        // Get PubNub connection
        const pubnub = await getPubNub();
        
        if (!pubnub) {
          console.error("Failed to get PubNub connection");
          return false;
        }
        
        // Connect with user ID
        await connectPubNub(currentUser._id);
        
        // Create a channel for this private chat
        channelRef.current = getPrivateChannel(currentUser._id, friend._id);
        console.log(`Using PubNub channel: ${channelRef.current}`);
        
        // Add message listener for this channel
        const listenerAdded = addMessageListener(channelRef.current, handleNewMessage);
        
        if (listenerAdded) {
          chatInitialized.current = true;
          chatConnected = true;
          console.log("PubNub chat initialized and connected successfully");
          return true;
        } else {
          console.error("Failed to add message listener");
          return false;
        }
      } catch (error) {
        console.error("PubNub chat initialization error:", error);
        chatInitialized.current = false;
        setChatError('Chat initialization failed. Messages will be sent via server only.');
        return false;
      }
    };
    
    // Try to initialize PubNub chat
    initPubNub().then(success => {
      if (!success) {
        console.log("Failed to initialize PubNub Chat, using GraphQL only");
        chatInitialized.current = false;
      }
    }).catch(error => {
      console.error("Exception during PubNub chat initialization:", error);
      chatInitialized.current = false;
    });
    
    // Always set up message polling as a fallback (or for message history)
    pollInterval = setInterval(() => {
      if (friend && friend._id) {
        // Use a try-catch block around refetch
        try {
          refetch()
            .then(result => {
              if (result?.data?.getMessages) {
                const freshMessages = result.data.getMessages;
                if (Array.isArray(freshMessages) && freshMessages.length > 0) {
                  setMessages(freshMessages);
                }
              }
            })
            .catch(error => {
              console.error("Error polling messages:", error);
              // No need to set error state here as polling is a background operation
            });
        } catch (error) {
          console.error("Exception during message polling:", error);
        }
      }
    }, 10000); // Poll every 10 seconds
    
    return () => {
      // Clean up - remove message listener and disconnect
      if (chatConnected && channelRef.current) {
        removeMessageListener(channelRef.current);
      }
      
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [friend._id, friend.userName, currentUser, refetch]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    
    // Create a unique ID for the temporary message
    const tempId = `temp-${Date.now()}`;
    const messageContent = message.trim();
    
    try {
      // Create a temporary message
      const tempMessage = {
        _id: tempId,
        senderId: currentUser._id,
        receiverId: friend._id,
        content: messageContent,
        timestamp: new Date().toISOString(),
        read: false,
        sender: { _id: currentUser._id, userName: 'You' },
        pending: true
      };
      
      // Add temporary message to UI immediately
      setMessages(prev => Array.isArray(prev) ? [...prev, tempMessage] : [tempMessage]);
      
      // Clear input
      setMessage('');
      
      // Always send via GraphQL first to ensure storage
      const response = await sendMessage({
        variables: {
          receiverId: friend._id,
          content: messageContent
        }
      });
      
      // Update UI with the stored message from server
      if (response?.data?.sendMessage) {
        const serverMessage = response.data.sendMessage;
        
        // Ensure the message has a sender property, using current user as fallback
        if (!serverMessage.sender) {
          serverMessage.sender = { _id: currentUser._id, userName: currentUser.userName || 'You' };
        }
        
        setMessages(prev => {
          if (!Array.isArray(prev)) return [serverMessage];
          return prev.map(msg => msg._id === tempId ? serverMessage : msg);
        });
        
        // If PubNub is initialized, send the message via real-time also
        if (chatInitialized.current && channelRef.current) {
          try {
            // Send via PubNub for real-time delivery
            await sendChatMessage(
              channelRef.current, 
              messageContent,
              {
                senderId: currentUser._id,
                id: serverMessage._id
              }
            );
            console.log("Message sent via PubNub real-time chat");
          } catch (error) {
            console.error("Error sending via PubNub:", error);
            // No need to notify user since message was already saved via GraphQL
          }
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setChatError('Failed to send message. Please try again.');
      
      // Remove pending message
      setMessages(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.filter(msg => msg._id !== tempId);
      });
      
      // Restore message in input field
      setMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-surface-800 rounded-lg shadow-lg border border-surface-700 z-50 flex flex-col max-h-[500px]">
      {/* Chat header */}
      <div className="p-3 border-b border-surface-700 flex justify-between items-center">
        <div className="flex items-center">
          <UserAvatar username={friend.userName} status={friend.status} size="sm" />
          <h3 className="ml-2 font-medium text-white">{friend.userName}</h3>
          
          {/* Hidden debug trigger (double click) */}
          <span 
            className="ml-2 text-xs cursor-default select-none" 
            onDoubleClick={toggleDebug}
          >
            {/* Invisible trigger */}
          </span>
        </div>
        <button
          className="w-8 h-8 rounded-full text-gray-400 hover:text-white hover:bg-surface-700 flex items-center justify-center"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      {/* Debug panel */}
      {showDebug && (
        <div className="p-2 bg-gray-900 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Debug Tools</span>
            <button 
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
              onClick={runPubNubTest}
            >
              Test PubNub Connection
            </button>
          </div>
        </div>
      )}
      
      {/* Error banner */}
      {chatError && (
        <div className="bg-red-500 text-white text-xs p-2 text-center">
          {chatError}
          <button 
            className="ml-2 underline"
            onClick={() => setChatError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Messages container */}
      <div 
        className="flex-1 overflow-y-auto p-3 space-y-3" 
        ref={chatContainerRef}
        style={{ height: '300px' }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : !Array.isArray(messages) || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Send a message to start chatting</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (!msg) return null;
            
            const isCurrentUser = msg.senderId !== friend._id;
            // Get sender name with fallback
            const senderName = isCurrentUser 
              ? (msg.sender?.userName || 'You') 
              : (friend.userName || 'Friend');
              
            return (
              <div
                key={msg._id || `fallback-${Math.random()}`}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isCurrentUser
                      ? msg.pending 
                        ? 'bg-primary-500 text-white opacity-70' 
                        : 'bg-primary-600 text-white'
                      : 'bg-surface-700 text-white'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1 flex items-center">
                    {senderName && !isCurrentUser && <span className="mr-1">{senderName}</span>}
                    {msg.timestamp && isValidDate(msg.timestamp) ? format(new Date(msg.timestamp), 'h:mm a') : ''}
                    {msg.pending && (
                      <span className="ml-2 inline-block">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>
      
      {/* Message input */}
      <form 
        className="p-3 border-t border-surface-700 flex gap-2"
        onSubmit={handleSendMessage}
      >
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 bg-surface-700 border border-surface-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          className={`w-10 h-10 rounded-md bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors ${
            isSending || !message.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSending || !message.trim()}
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatPopup; 