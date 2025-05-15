import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_MESSAGES } from '../../../utils/queries';
import { SEND_MESSAGE, MARK_MESSAGES_AS_READ } from '../../../utils/mutations';
import UserAvatar from './UserUtils';
import { format } from 'date-fns';
import { 
  getPubNub, 
  connectPubNub, 
  addMessageListener, 
  removeMessageListener, 
  sendChatMessage, 
  getPrivateChannel, 
  setupChatChannel, 
  markChannelActive, 
  markChannelInactive 
} from '../../../utils/pubnubChat';
import Auth from '../../../utils/auth';
import { formatTimeAgo, isValidDate } from '../../../utils/helpers';
import { FaTimes, FaPaperPlane } from "react-icons/fa";
import LoadingSpinner from '../../../components/LoadingSpinner';
import Avatar from '../../../components/Avatar';

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
  const pubnubRef = useRef(null);
  const currentUser = Auth.getProfile();
  const channelRef = useRef(null);
  const messagesRef = useRef(messages);
  const chatCleanupRef = useRef(null);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());

  // Keep messagesRef in sync with the messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Add this useEffect near the top of the component to mark messages as read when chat opens
  useEffect(() => {
    // Mark messages as read when the chat popup opens
    if (friend && friend._id) {
      try {
        markAsRead({ 
          variables: { senderId: friend._id },
          onCompleted: () => {
            // Force refetch of unread message counts globally
            if (window.refetchAllUnreadCounts) {
              window.refetchAllUnreadCounts();
            }
          }
        }).catch(() => {
          // Handle error silently
        });
      } catch {
        // Handle error silently
      }
    }
  }, [friend, markAsRead]);

  // Query for initial messages with improved error handling
  const { loading, data, refetch } = useQuery(GET_MESSAGES, {
    variables: { friendId: friend._id, limit: 50 },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      try {
        if (!data || !data.getMessages) {
          setMessages([]);
          return;
        }
        
        // Ensure we have an array of messages
        const messageList = Array.isArray(data.getMessages) ? data.getMessages : [];
        setMessages(messageList);
        
        // Mark messages as read when we load them - only if there are any
        if (friend && friend._id && messageList.length > 0) {
          try {
            markAsRead({ 
              variables: { senderId: friend._id }
            }).catch(() => {
              // Handle error silently
            });
          } catch {
            // Handle error silently
          }
        }
      } catch {
        setMessages([]);
      }
    },
    onError: () => {
      // Handle the error gracefully and don't alarm the user unnecessarily
      setMessages([]);
    }
  });

  // Improve message listener function to better handle incoming real-time messages
  const handleNewMessage = (message) => {
    // Ignore system messages with non-matching sender ID
    if (message.senderId !== friend._id && message.senderId !== currentUser?._id) {
      return;
    }

    // Function to check if user is near bottom - for deciding whether to auto-scroll
    const isNearBottom = () => {
      if (!chatContainerRef.current) return true;
      const container = chatContainerRef.current;
      const atBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 50;
      return atBottom;
    };
    
    // Check if user was already at the bottom before adding the message
    const shouldScrollToBottom = isNearBottom();
    
    // Construct a proper message ID from either the message.messageId, message.id or a fallback
    const messageId = message.messageId || message.id || `pubnub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Check if we've already processed this message by ID (deduplication)
    if (processedMessageIds.has(messageId)) {
      return;
    }
    
    // Create a message object for our UI
    const newMessage = {
      _id: messageId,
      content: message.text || message.message || message.content || '',
      senderId: message.senderId,
      receiverId: message.senderId === currentUser?._id ? friend._id : currentUser?._id,
      timestamp: message.timestamp || new Date().toISOString(),
      sender: {
        _id: message.senderId,
        userName: message.senderId === currentUser?._id ? 'You' : friend.userName
      }
    };
    
    // Update the messages state
    if (newMessage.content && typeof newMessage.content === 'string') {
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        
        // Final check for duplicates before adding
        if (!updatedMessages.some(m => m._id === newMessage._id)) {
          updatedMessages.push(newMessage);
          
          // Add to processed IDs set
          setProcessedMessageIds(prev => new Set(prev).add(messageId));
          
          // Only scroll to bottom if user was already at the bottom
          if (shouldScrollToBottom) {
            setTimeout(() => {
              messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 10);
          }
        }
        
        return updatedMessages;
      });
      
      // Mark message as read immediately if it's from our friend
      if (message.senderId === friend._id) {
        try {
          markAsRead({ 
            variables: { senderId: friend._id }
          }).catch(() => {
            // Handle error silently
          });
        } catch {
          // Handle error silently
        }
      }
    }
  };

  // Initialize PubNub chat when the component mounts
  useEffect(() => {
    // Define a variable to track component mounted state
    let isMounted = true;
    
    // Ensure we have required data before continuing
    if (friend && friend._id && currentUser && currentUser._id && !chatInitialized.current) {
      
      // Create a unique channel for this conversation
      const chatChannel = getPrivateChannel(currentUser._id, friend._id);
      channelRef.current = chatChannel;
      
      // Mark the channel as active when the chat is opened
      markChannelActive(chatChannel);
      
      const initChat = async () => {
        try {
          // Get PubNub instance
          const pubnub = await getPubNub();
          pubnubRef.current = pubnub;
          
          if (!pubnub) {
            setChatError('Could not initialize chat. Please refresh the page.');
            return;
          }
          
          // Connect with user ID
          await connectPubNub(currentUser._id);
          
          // Setup chat channel with message listener
          const channelSetup = setupChatChannel(chatChannel, handleNewMessage);
          
          // Check if component still mounted before updating state
          if (isMounted) {
            if (channelSetup) {
              chatInitialized.current = true;
              setChatError(null);
              
              // Store cleanup function
              chatCleanupRef.current = channelSetup.cleanup;
            } else {
              setChatError('Could not initialize chat. Please refresh and try again.');
            }
          }
        } catch (error) {
          if (isMounted) {
            setChatError('Chat initialization failed. Please try again.');
            chatInitialized.current = false;
          }
        }
      };
      
      initChat();
    }
    
    return () => {
      // Update mounted flag
      isMounted = false;
      
      // Mark the channel as inactive when the component unmounts
      if (channelRef.current) {
        markChannelInactive(channelRef.current);
      }
      
      // Clean up the PubNub subscription when unmounting
      if (chatCleanupRef.current) {
        chatCleanupRef.current();
        chatCleanupRef.current = null;
      }
      chatInitialized.current = false;
    };
  }, [friend?._id, currentUser?._id]); // Simplified dependency array

  // Improve scroll handling useEffect to be more intelligent - don't auto-scroll when user has scrolled up
  useEffect(() => {
    // Add a flag to track if user has manually scrolled up
    let userHasScrolledUp = false;
    
    // Function to check if user is near bottom
    const isNearBottom = () => {
      if (!chatContainerRef.current) return true;
      
      const container = chatContainerRef.current;
      const atBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 50;
      return atBottom;
    };
    
    // Only scroll to bottom if user hasn't manually scrolled up or if they're already near bottom
    if (isNearBottom()) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Add scroll event listener to detect when user manually scrolls up
    const handleScroll = () => {
      userHasScrolledUp = !isNearBottom();
    };
    
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    // Create a mutation observer to watch for new messages but only scroll if user is already at bottom
    if (chatContainerRef.current) {
      const observer = new MutationObserver(() => {
        if (!userHasScrolledUp) {
          messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      });
      
      observer.observe(chatContainerRef.current, { 
        childList: true, 
        subtree: true,
        characterData: true,
        attributes: true
      });
      
      return () => {
        observer.disconnect();
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
      }
    }
  }, [messages]);

  // Improve the send message function to better handle optimistic updates
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    
    // Create a unique ID for the temporary message
    const tempId = `temp-${Date.now()}`;
    const messageContent = message.trim();
    
    // Clear input immediately for better UX
    setMessage('');
    
    // Function to check if user is near bottom - for deciding whether to auto-scroll
    const isNearBottom = () => {
      if (!chatContainerRef.current) return true;
      const container = chatContainerRef.current;
      const atBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 50;
      return atBottom;
    };
    
    // Check if user was already at the bottom before adding the message
    const shouldScrollToBottom = isNearBottom();
    
    try {
      // Create a temporary message for immediate UI feedback
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
      
      // Add to our processed set to prevent duplication
      setProcessedMessageIds(prev => new Set(prev).add(tempId));
      
      // Add temporary message to UI immediately
      setMessages(prev => {
        const updatedMessages = [...prev, tempMessage];
        // Only scroll to bottom if the user was already at the bottom
        if (shouldScrollToBottom) {
          setTimeout(() => {
            messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 10);
        }
        return updatedMessages;
      });
      
      // Flag to track if realtime was successful
      let realtimeSent = false;
      
      // Send message via PubNub first for real-time delivery
      if (chatInitialized.current && channelRef.current && pubnubRef.current) {
        try {
          await sendChatMessage(
            channelRef.current, 
            messageContent,
            {
              senderId: currentUser._id,
              id: tempId
            }
          );
          realtimeSent = true;
        } catch (error) {
          // Continue with GraphQL as fallback
        }
      }
      
      // Also send via GraphQL for storage
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
        
        // If realtime failed, manually trigger a PubNub-like message
        if (!realtimeSent && chatInitialized.current) {
          try {
            // First add this ID to our processed set
            setProcessedMessageIds(prev => new Set(prev).add(serverMessage._id));
            
            handleNewMessage({
              senderId: currentUser._id,
              id: serverMessage._id,
              text: serverMessage.content,
              timestamp: serverMessage.timestamp
            });
          } catch (error) {
          }
        }
        
        // Replace temporary message with server message (using a more robust method)
        setMessages(prev => {
          // Add server message ID to processed set to prevent duplication
          setProcessedMessageIds(set => new Set([...set, serverMessage._id]));
          
          // Find temp message and replace it with server message
          return prev.map(msg => 
            msg._id === tempId ? { 
              ...serverMessage, 
              _id: serverMessage._id || tempId,
              sender: serverMessage.sender || msg.sender
            } : msg
          );
        });

        // Mark messages as read since we're actively chatting
        try {
          markAsRead({ 
            variables: { senderId: friend._id }
          }).catch(() => {
            // Handle error silently
          });
        } catch {
          // Handle error silently
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      setChatError('Failed to send message. Please try again.');
      
      // Remove pending message
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      
      // Restore message in input field
      setMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  // Run this function when the user clicks "Reconnect" in the connection status bar
  const handleReconnect = async () => {
    setChatError("Reconnecting to real-time chat...");
    
    try {
      // Try to reinitialize chat
      const chatChannel = getPrivateChannel(currentUser._id, friend._id);
      channelRef.current = chatChannel;
      
      // Get PubNub instance
      const pubnub = await getPubNub();
      pubnubRef.current = pubnub;
      
      if (!pubnub) {
        setChatError("Failed to connect to chat service. Please try again.");
        return;
      }
      
      // Connect with user ID
      await connectPubNub(currentUser._id);
      
      // Setup chat channel
      const channelSetup = setupChatChannel(chatChannel, handleNewMessage);
      
      if (channelSetup) {
        // Clean up any existing subscription first
        if (chatCleanupRef.current) {
          chatCleanupRef.current();
        }
        chatCleanupRef.current = channelSetup.cleanup;
        chatInitialized.current = true;
        setChatError("Successfully reconnected to real-time chat!");
        setTimeout(() => setChatError(null), 3000);
      } else {
        setChatError("Failed to reconnect. Please try again.");
      }
    } catch (error) {
      setChatError("Failed to reconnect. Please refresh the page.");
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
      
      {/* Connection status indicator */}
      <div className={`px-3 py-1 text-xs flex items-center justify-between ${chatInitialized.current ? 'bg-green-900' : 'bg-orange-900'}`}>
        <span>
          {chatInitialized.current ? 'Real-time messaging active' : 'Standard messaging mode'}
        </span>
        {!chatInitialized.current && 
          <button 
            onClick={handleReconnect}
            className="text-xs underline"
          >
            Reconnect
          </button>
        }
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
                  <p className="text-xs opacity-70 mt-1 flex items-center justify-between">
                    <span>
                      {senderName && !isCurrentUser && <span className="mr-1">{senderName}</span>}
                      {msg.timestamp && isValidDate(msg.timestamp) ? format(new Date(msg.timestamp), 'h:mm a') : ''}
                    </span>
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