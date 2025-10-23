import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Store the refetch function globally but within this module
let refetchUnreadCountsFunction = null;

// Create a context for message-related state and functions
const MessageContext = createContext();

export function MessageProvider({ children }) {
  // State for tracking unread message counts
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // Function to refetch/update unread message counts, to be called from any component
  const refetchUnreadCounts = useCallback(() => {
    // Here you would typically fetch fresh unread counts from your API
    // For now we're just exposing the function so components can call it
    
    // This would be replaced with an actual API call in a real implementation
    // Example: queryClient.invalidateQueries(['unreadMessages']);
    
    // You can emit an event here if needed to notify other components
    const messageUpdateEvent = new CustomEvent('message-counts-update');
    document.dispatchEvent(messageUpdateEvent);
  }, []);

  // Store the refetch function in the module-level variable
  useEffect(() => {
    refetchUnreadCountsFunction = refetchUnreadCounts;
    return () => {
      refetchUnreadCountsFunction = null;
    };
  }, [refetchUnreadCounts]);
  
  // Function to update unread count for a specific user
  const updateUnreadCount = useCallback((userId, count) => {
    setUnreadCounts(prev => ({
      ...prev,
      [userId]: count
    }));
  }, []);
  
  // Function to mark messages from a user as read
  const markMessagesAsRead = useCallback((userId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [userId]: 0
    }));
  }, []);
  
  // Create the context value
  const contextValue = {
    unreadCounts,
    refetchUnreadCounts,
    updateUnreadCount,
    markMessagesAsRead
  };
  
  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
}

// Custom hook to use the message context
export function useMessageContext() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
}

// Add a function to refresh unread counts that components can call
export const refreshAllUnreadCounts = () => {
  if (refetchUnreadCountsFunction) {
    refetchUnreadCountsFunction();
  }
};

export { MessageContext }; 