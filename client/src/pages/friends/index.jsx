import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { GET_FRIENDS, GET_FRIEND_REQUESTS, SEARCH_USERS, GET_UNREAD_MESSAGE_COUNT } from '../../utils/queries';
import { 
  ACCEPT_FRIEND_REQUEST, 
  DECLINE_FRIEND_REQUEST, 
  REMOVE_FRIEND,
  SEND_FRIEND_REQUEST 
} from '../../utils/mutations';

// Component imports
import UserAvatar from './components/UserUtils';
import FriendRequestDropdown from './components/FriendRequestDropdown';
import FriendsList from './components/FriendsList';
import SearchUsers from './components/SearchUsers';
import SearchTabs from './components/SearchTabs';

export default function Friends() {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('friends'); // 'friends' or 'findPlayers'
  const [requestSent, setRequestSent] = useState({});
  const [showRequests, setShowRequests] = useState(false);
  const requestsDropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const friendsPerPage = 8;
  const [pinnedFriends, setPinnedFriends] = useState(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('pinnedFriends');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = useRef({});

  // For chat and messages
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // Get unread message count for each friend
  const { data: unreadCountData, refetch: refetchUnreadCounts } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
    fetchPolicy: 'network-only'
  });
  
  // Fetch unread message counts periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchUnreadCounts();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [refetchUnreadCounts]);
  
  // Update unread counts when data changes
  useEffect(() => {
    if (unreadCountData?.getUnreadMessageCount) {
      setUnreadCounts(prev => ({
        ...prev,
        total: unreadCountData.getUnreadMessageCount
      }));
    }
  }, [unreadCountData]);
  
  // Mark messages as read when a user opens the chat with a friend
  const handleMessageClick = useCallback((friend) => {
    // Update unread counts immediately in UI
    setUnreadCounts(prev => ({
      ...prev,
      [friend._id]: 0
    }));
  }, []);

  // GraphQL queries
  const { loading: friendsLoading, data: friendsData, refetch: refetchFriends } = useQuery(GET_FRIENDS);
  const friends = friendsData?.getFriends || [];

  const { loading: requestsLoading, data: requestsData, refetch: refetchRequests } = useQuery(GET_FRIEND_REQUESTS);
  const friendRequests = requestsData?.getFriendRequests || [];

  // User search for finding players
  const [searchUsers, { loading: searchLoading, data: searchData }] = useLazyQuery(SEARCH_USERS, {
    onCompleted: (data) => {
    }
  });

  // Define mutations
  const [acceptFriendRequest] = useMutation(ACCEPT_FRIEND_REQUEST, {
    refetchQueries: [{ query: GET_FRIENDS }, { query: GET_FRIEND_REQUESTS }]
  });
  
  const [declineFriendRequest] = useMutation(DECLINE_FRIEND_REQUEST, {
    refetchQueries: [{ query: GET_FRIEND_REQUESTS }]
  });
  
  const [removeFriend] = useMutation(REMOVE_FRIEND, {
    refetchQueries: [{ query: GET_FRIENDS }],
    onError: (error) => {
      console.error("GraphQL error removing friend:", error.message);
    }
  });

  const [sendFriendRequest] = useMutation(SEND_FRIEND_REQUEST);

  // Utility functions
  // Check if a friend is pinned
  const isPinned = (friendId) => pinnedFriends.includes(friendId);

  // Save pinnedFriends to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pinnedFriends', JSON.stringify(pinnedFriends));
  }, [pinnedFriends]);

  // Close dropdowns and modals when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (requestsDropdownRef.current && !requestsDropdownRef.current.contains(event.target)) {
        setShowRequests(false);
      }
      
      // Close friend action dropdowns when clicking outside
      if (activeDropdown && dropdownRefs.current[activeDropdown] && 
          !dropdownRefs.current[activeDropdown].contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [requestsDropdownRef, activeDropdown]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Event handlers
  // Handle friend requests
  const handleAccept = async (id) => {
    try {
      // Show a confirmation before accepting
      if (window.confirm(`Accept friend request?`)) {
        await acceptFriendRequest({ 
          variables: { userId: id },
          onCompleted: (data) => {
            ("Friend request accepted successfully", data);
            // Refetch friends and requests to update UI
            refetchFriends();
            refetchRequests();
            // Close the dropdown after accepting
            setShowRequests(false);
          },
          onError: (err) => {
            console.error("Error accepting friend request:", err.message);
            alert("Failed to accept friend request. Please try again.");
          }
        });
      }
    } catch (err) {
      console.error("Error accepting friend request:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleDecline = async (id) => {
    try {
      // Show a confirmation before declining
      if (window.confirm(`Decline friend request?`)) {
        await declineFriendRequest({ 
          variables: { userId: id },
          onCompleted: (data) => {
            ("Friend request declined successfully", data);
            // Refetch requests to update UI
            refetchRequests();
            // If no more requests, close dropdown
            if (friendRequests.length <= 1) {
              setShowRequests(false);
            }
          },
          onError: (err) => {
            console.error("Error declining friend request:", err.message);
            alert("Failed to decline friend request. Please try again.");
          }
        });
      }
    } catch (err) {
      console.error("Error declining friend request:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleRemoveFriend = async (id) => {
    try {
      // Show confirmation before removing
      if (window.confirm("Are you sure you want to remove this friend?")) {
        await removeFriend({ 
          variables: { userId: id },
          onCompleted: () => {
            ("Friend removed successfully");
            // Remove from pinned friends if pinned
            if (isPinned(id)) {
              setPinnedFriends(prev => prev.filter(friendId => friendId !== id));
            }
            // Close dropdown after successful removal
            setActiveDropdown(null);
          },
          onError: (err) => {
            console.error("Error removing friend:", err.message);
            alert("Failed to remove friend. Please try again.");
          }
        });
      } else {
        // User canceled the removal
        setActiveDropdown(null);
      }
    } catch (err) {
      console.error("Error removing friend:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (searchMode === 'findPlayers') {
        // Clear previous results first
        setRequestSent({});
        // Execute the search query
        searchUsers({ 
          variables: { username: searchQuery.trim() },
          onError: (err) => {
            console.error("Search error:", err.message);
          }
        });
      }
    }
  };

  // Handle sending a friend request
  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest({ 
        variables: { userId },
        onCompleted: () => {
          // Add the user to the "request sent" state to update UI
          setRequestSent(prev => ({ ...prev, [userId]: true }));
        },
        onError: (err) => {
          console.error("Error sending friend request:", err.message);
          // If it's already sent, still update the UI
          if (err.message.includes('already sent')) {
            setRequestSent(prev => ({ ...prev, [userId]: true }));
          }
        }
      });
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  // Loading state
  if (friendsLoading) {
    return <div className="w-full mt-28 p-6 text-white">Loading friends...</div>;
  }

  // Filter friends by search query
  const filteredFriends = friends.length > 0 
    ? friends.filter(friend => friend.userName.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  
  // Separate pinned and unpinned friends
  const pinnedFilteredFriends = filteredFriends.filter(friend => isPinned(friend._id));
  const unpinnedFilteredFriends = filteredFriends.filter(friend => !isPinned(friend._id));
  
  // Calculate pagination for unpinned friends only
  const indexOfLastFriend = currentPage * friendsPerPage;
  const indexOfFirstFriend = indexOfLastFriend - friendsPerPage;
  const currentUnpinnedFriends = unpinnedFilteredFriends.slice(indexOfFirstFriend, indexOfLastFriend);
  const totalPages = Math.ceil(unpinnedFilteredFriends.length / friendsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Toggle search mode between friends and finding players
  const toggleSearchMode = (mode) => {
    setSearchMode(mode);
    setSearchQuery('');
  };

  // Toggle requests dropdown
  const toggleRequestsDropdown = () => {
    setShowRequests(!showRequests);
  };

  // Pin/unpin friend functionality
  const togglePinFriend = (friendId) => {
    setPinnedFriends(prev => {
      // If already pinned, remove from pinned list
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      }
      // If not pinned and pinned count < 4, add to pinned list
      else if (prev.length < 4) {
        return [...prev, friendId];
      }
      // If already have 4 pinned friends, replace the oldest one
      else {
        const newPinned = [...prev];
        newPinned.shift(); // Remove oldest pinned friend
        return [...newPinned, friendId];
      }
    });
    // Close dropdown after action
    setActiveDropdown(null);
  };

  // Toggle friend action dropdown
  const toggleFriendDropdown = (friendId) => {
    setActiveDropdown(prev => prev === friendId ? null : friendId);
  };

  // Register dropdown refs
  const registerDropdownRef = (friendId, el) => {
    dropdownRefs.current[friendId] = el;
  };

  // For search results in find players mode
  const searchResults = searchData?.searchUsers || [];
  const displaySearchResults = searchResults.length > 0 ? searchResults : [];
  const displayRequests = friendRequests.length > 0 ? friendRequests : [];

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="flex">
        {/* Main content */}
        <div className="flex-1 md:ml-64">
          <div className="pt-20 px-4">
            {/* Header with Friend Requests */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white">Friends</h1>
              
              {/* Friend Requests Icon with Badge */}
              <div className="relative" ref={requestsDropdownRef}>
                <button 
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${showRequests ? 'bg-primary-600 text-white' : 'bg-transparent text-gray-400 hover:bg-surface-800'}`}
                  onClick={toggleRequestsDropdown}
                  title="Friend Requests"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  {displayRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold border-2 border-surface-950">
                      {displayRequests.length}
                    </span>
                  )}
                </button>
                
                {/* Friend Requests Dropdown */}
                <FriendRequestDropdown
                  isOpen={showRequests}
                  loading={requestsLoading}
                  requests={displayRequests}
                  handleAccept={handleAccept}
                  handleDecline={handleDecline}
                />
              </div>
            </div>
            
            {/* Toggle and Search */}
            <SearchTabs
              searchMode={searchMode}
              toggleSearchMode={toggleSearchMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
            />
            
            {/* Content */}
            <div className="flex-1">
              {/* My Friends */}
              {searchMode === 'friends' && (
                <FriendsList
                  pinnedFriends={pinnedFriends}
                  unpinnedFriends={currentUnpinnedFriends}
                  searchQuery={searchQuery}
                  toggleSearchMode={toggleSearchMode}
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  togglePinFriend={togglePinFriend}
                  handleRemoveFriend={handleRemoveFriend}
                  dropdownRefs={dropdownRefs}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  handlePageChange={setCurrentPage}
                  handlePrevPage={prevPage}
                  handleNextPage={nextPage}
                  unreadCounts={unreadCounts}
                  onMessageClick={handleMessageClick}
                />
              )}

              {/* Find Players */}
              {searchMode === 'findPlayers' && (
                <SearchUsers
                  searchLoading={searchLoading}
                  searchQuery={searchQuery}
                  searchResults={displaySearchResults}
                  requestSent={requestSent}
                  handleSendRequest={handleSendRequest}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 