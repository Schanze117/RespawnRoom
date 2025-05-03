import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_MESSAGES } from '../../../utils/queries';
import { SEND_MESSAGE, MARK_MESSAGES_AS_READ } from '../../../utils/mutations';
import UserAvatar from './UserUtils';
import { format } from 'date-fns';
import { getAgoraChat, addMessageListener, removeMessageListener, sendChatMessage } from '../../../utils/agoraChat';

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

  // Query for initial messages
  const { loading, data, refetch } = useQuery(GET_MESSAGES, {
    variables: { friendId: friend._id, limit: 50 },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getMessages) {
        setMessages(data.getMessages);
        // Mark messages as read when we load them
        markAsRead({ variables: { senderId: friend._id } });
      }
    },
    onError: (error) => {
      setChatError('Failed to load messages. Please try again later.');
    }
  });

  // Message listener function
  const handleNewMessage = (message) => {
    // Check if message is from the current chat partner
    if (message.from === friend._id) {
      setMessages(prev => [...prev, {
        _id: message.id || `temp-${Date.now()}`,
        senderId: message.from,
        receiverId: message.to,
        content: message.msg,
        timestamp: new Date().toISOString(),
        read: false,
        sender: { _id: message.from, userName: friend.userName }
      }]);
      
      // Mark message as read immediately
      markAsRead({ variables: { senderId: friend._id } });
    }
  };

  // Setup Agora Chat for real-time messaging
  useEffect(() => {
    let cleanup = null;
    
    // Initialize Agora Chat
    const initAgoraChat = async () => {
      try {
        // Get the chat instance
        await getAgoraChat();
        
        // Add message listener
        const listenerAdded = addMessageListener(handleNewMessage);
        
        if (listenerAdded) {
          chatInitialized.current = true;
        }
        
        // Clean up on unmount
        cleanup = () => {
          removeMessageListener(handleNewMessage);
        };
      } catch (error) {
        setChatError('Chat initialization failed. Messages will still work, but may not appear in real-time.');
        // We'll still allow messages to be sent through GraphQL
      }
    };
    
    initAgoraChat();
    
    // Set up message polling as fallback if real-time chat fails
    const pollInterval = setInterval(() => {
      if (!chatInitialized.current) {
        refetch();
      }
    }, 5000); // Poll every 5 seconds if real-time chat isn't working
    
    return () => {
      if (cleanup) cleanup();
      clearInterval(pollInterval);
    };
  }, [friend._id, friend.userName, markAsRead, refetch]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // Create a temporary message
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        senderId: 'me', // Will be replaced with actual ID from response
        receiverId: friend._id,
        content: message.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        sender: { _id: 'me', userName: 'You' },
        pending: true
      };
      
      // Add temporary message to UI immediately
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear input
      const messageContent = message.trim();
      setMessage('');
      
      // Send message through GraphQL mutation
      const { data } = await sendMessage({
        variables: {
          receiverId: friend._id,
          content: messageContent
        }
      });

      // If successful, replace temp message with real one
      if (data?.sendMessage) {
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? data.sendMessage : msg
        ));
      }
      
      // Also try to send through Agora real-time messaging
      if (chatInitialized.current) {
        try {
          await sendChatMessage(friend._id, messageContent);
        } catch (error) {
          // No need to notify user since the message was already saved via GraphQL
        }
      }
    } catch (error) {
      setChatError('Failed to send message. Please try again.');
      
      // Remove pending message
      setMessages(prev => prev.filter(msg => !msg.pending));
      
      // Restore message in input field
      setMessage(message);
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
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Send a message to start chatting</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.senderId !== friend._id;
            return (
              <div
                key={msg._id}
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
                    {format(new Date(msg.timestamp), 'h:mm a')}
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