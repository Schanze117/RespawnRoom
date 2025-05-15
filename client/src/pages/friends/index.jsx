import { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';
import { useQuery, useMutation, useLazyQuery, useApolloClient } from '@apollo/client';
import { GET_FRIENDS, GET_FRIEND_REQUESTS, SEARCH_USERS, GET_UNREAD_MESSAGE_COUNT } from '../../utils/queries';
import { 
  ACCEPT_FRIEND_REQUEST, 
  DECLINE_FRIEND_REQUEST, 
  REMOVE_FRIEND,
  SEND_FRIEND_REQUEST 
} from '../../utils/mutations';
import { getPrivateChannel, markChannelActive } from '../../utils/pubnubChat';
import { refreshAllUnreadCounts } from '../../utils/MessageContext';

// Component imports
import UserAvatar from './components/UserUtils';
import FriendRequestDropdown from './components/FriendRequestDropdown';
import FriendsList from './components/FriendsList';
import SearchUsers from './components/SearchUsers';
import SearchTabs from './components/SearchTabs';
import FriendsPageSkeleton from './components/FriendSkeletonLoader';

// Lazy load ChatPopup component
const ChatPopup = lazy(() => import('./components/ChatPopup'));

export default function Friends() {
  // Get Apollo client instance
  const client = useApolloClient();

  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('friends'); // 'friends' or 'findPlayers'
  const [requestSent, setRequestSent] = useState({});
  const [showRequests, setShowRequests] = useState(false);
  const requestsDropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const friendsPerPage = 8;
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Get unread message count for each friend
  const { data: unreadCountData, refetch: refetchUnreadCounts } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
    fetchPolicy: 'network-only'
  });
  
  // Update the refreshAllUnreadCounts to use our function
  useEffect(() => {
    // Register the refetch function with our global handler
    const currentRefetchFunction = refetchUnreadCounts;
    
    // Set up interval to periodically refetch unread counts
    const intervalId = setInterval(() => {
      currentRefetchFunction();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [refetchUnreadCounts]);
  
  useEffect(() => {
    if (unreadCountData?.getUnreadMessageCount) {
      setUnreadCounts(prev => ({
        ...prev,
        total: unreadCountData.getUnreadMessageCount
      }));
    }
  }, [unreadCountData]);

  const handleMessageClick = useCallback((friend) => {
    // Mark unread count as 0 for this friend
    setUnreadCounts(prev => ({
      ...prev,
      [friend._id]: 0
    }));

    // Get the current user
    const currentUser = localStorage.getItem('user_id');
    
    // If we have both users, create and mark the channel as active
    if (currentUser && friend._id) {
      const chatChannel = getPrivateChannel(currentUser, friend._id);
      
      // Mark the channel as active
      if (chatChannel) {
        markChannelActive(chatChannel);
      }
    }
  }, []);

  // GraphQL queries
  const { loading: friendsLoading, data: friendsData, error: friendsError, refetch: refetchFriends } = useQuery(GET_FRIENDS, {
    onError: (error) => {
    },
    onCompleted: (data) => {
    }
  });
  const friends = friendsData?.getFriends || [];
  useEffect(() => {
    if (friendsError) {
    }
    if (friendsData) {
    }
  }, [friendsData, friendsError]);

  const { loading: requestsLoading, data: requestsData, error: requestsError, refetch: refetchRequests } = useQuery(GET_FRIEND_REQUESTS, {
    onError: (error) => {
    }
  });
  const friendRequests = requestsData?.getFriendRequests || [];
  useEffect(() => {
    if (requestsError) {
    }
    if (requestsData) {
    }
  }, [requestsData, requestsError]);

  const [searchUsers, { loading: searchLoading, data: searchData }] = useLazyQuery(SEARCH_USERS, {
    onCompleted: (data) => {
    }
  });

  const [acceptFriendRequest] = useMutation(ACCEPT_FRIEND_REQUEST, {
    refetchQueries: [{ query: GET_FRIENDS }, { query: GET_FRIEND_REQUESTS }]
  });
  const [declineFriendRequest] = useMutation(DECLINE_FRIEND_REQUEST, {
    refetchQueries: [{ query: GET_FRIEND_REQUESTS }]
  });
  const [removeFriend, { loading: removeLoading, error: removeError }] = useMutation(REMOVE_FRIEND, {
    refetchQueries: [{ query: GET_FRIENDS }],
    awaitRefetchQueries: true,
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
    onCompleted: (data) => {
      setTimeout(() => {
        refetchFriends()
          .then(() => {})
          .catch(err => {});
      }, 500);
    },
    onError: (error) => {
    },
    update: (cache, { data }) => {
      try {
        if (!data || !data.removeFriend) {
          return;
        }
        const existingData = cache.readQuery({ query: GET_FRIENDS });
        if (existingData) {
          const removedFriendId = data.removeFriend._id;
          const updatedFriends = existingData.getFriends.filter(
            friend => friend._id !== removedFriendId
          );
          cache.writeQuery({
            query: GET_FRIENDS,
            data: { getFriends: updatedFriends }
          });
        }
        if (isPinned(data.removeFriend._id)) {
          const updatedFriends = friends.filter(friendId => friendId !== data.removeFriend._id);
          cache.writeQuery({
            query: GET_FRIENDS,
            data: { getFriends: updatedFriends },
          });
        }
      } catch (err) {
      }
    }
  });
  const [sendFriendRequest] = useMutation(SEND_FRIEND_REQUEST);

  // Utility functions
  const isPinned = (friendId) => {
    const result = Array.isArray(friends) && friends.some(friend => friend._id === friendId);
    return result;
  };

  useEffect(() => {
    function handleClickOutside(event) {
      // Add safeguard to ensure event has a target
      if (!event || !event.target) return;
    
      // Check if click is on a button or inside a dropdown menu
      const isButtonClick = event.target.tagName === 'BUTTON' || 
        event.target.closest('button') || 
        event.target.tagName === 'svg' || 
        event.target.tagName === 'path' ||
        event.target.tagName === 'line' ||
        event.target.tagName === 'polyline' ||
        event.target.tagName === 'A' ||
        event.target.tagName === 'INPUT';
        
      // For requests dropdown - don't close if clicking on buttons inside the dropdown
      if (requestsDropdownRef.current && !requestsDropdownRef.current.contains(event.target) && !isButtonClick) {
        setShowRequests(false);
      }
      
      // Friend action dropdown - ensure we're not closing during a click on a button
      if (activeDropdown && dropdownRefs.current[activeDropdown]) {
        const dropdownEl = dropdownRefs.current[activeDropdown];
        
        // Only close if the click is outside the dropdown AND not on an interactive element
        if (!dropdownEl.contains(event.target) && !isButtonClick) {
          setActiveDropdown(null);
        }
      }
    }
    
    // Use standard bubbling phase (not capture phase) to let React's synthetic events run first
    document.addEventListener('mousedown', handleClickOutside, false);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, false);
    };
  }, [requestsDropdownRef, activeDropdown]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Event handlers
  const handleAccept = async (id) => {
    try {
      // Remove confirmation for better UX
      await acceptFriendRequest({ 
        variables: { userId: id },
        onCompleted: (data) => {
          refetchFriends();
          refetchRequests();
        },
        onError: (err) => {
          alert('Failed to accept friend request. Please try again.');
        }
      });
    } catch (err) {
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleDecline = async (id) => {
    try {
      // Remove confirmation for better UX
      await declineFriendRequest({ 
        variables: { userId: id },
        onCompleted: (data) => {
          refetchRequests();
        },
        onError: (err) => {
          alert('Failed to decline friend request. Please try again.');
        }
      });
    } catch (err) {
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!friendId) {
      return;
    }
    try {
      const optimisticResponse = {
        removeFriend: {
          __typename: 'User',
          _id: 'CURRENT_USER_ID', // Replace with actual user id if available
          userName: 'CURRENT_USER', // Replace with actual user name if available
          email: 'CURRENT_USER_EMAIL', // Replace with actual user email if available
          friends: friendsData?.getFriends
            .filter(friend => friend._id !== friendId)
            .map(friend => ({
              __typename: 'User',
              _id: friend._id,
              userName: friend.userName,
              status: friend.status,
              lastSeen: friend.lastSeen
            })) || []
        }
      };
      const result = await removeFriend({ 
        variables: { userId: friendId },
        optimisticResponse,
        update: (cache, { data }) => {
          if (!data?.removeFriend) return;
          const existingFriendsData = cache.readQuery({ query: GET_FRIENDS });
          if (existingFriendsData) {
            const updatedFriends = existingFriendsData.getFriends.filter(
              friend => friend._id !== friendId
            );
            cache.writeQuery({
              query: GET_FRIENDS,
              data: { getFriends: updatedFriends }
            });
          }
          if (isPinned(friendId)) {
            const updatedFriends = friends.filter(friend => friend._id !== friendId);
            cache.writeQuery({
              query: GET_FRIENDS,
              data: { getFriends: updatedFriends },
            });
          }
        }
      });
      await refetchFriends();
      return result;
    } catch (error) {
      try {
        const fallbackResult = await directRemoveFriend(friendId);
        return fallbackResult;
      } catch (directError) {
        await resetAndRefetch();
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (searchMode === 'findPlayers') {
        setRequestSent({});
        searchUsers({ 
          variables: { username: searchQuery.trim() },
          onError: (err) => {
          }
        });
      }
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest({ 
        variables: { userId },
        onCompleted: () => {
          setRequestSent(prev => ({ ...prev, [userId]: true }));
        },
        onError: (err) => {
          if (err.message.includes('already sent')) {
            setRequestSent(prev => ({ ...prev, [userId]: true }));
          }
        }
      });
    } catch (err) {
    }
  };

  const resetAndRefetch = useCallback(async () => {
    try {
      client.cache.evict({ fieldName: 'getFriends' });
      client.cache.evict({ fieldName: 'getFriendRequests' });
      client.cache.gc();
      await client.reFetchObservableQueries();
      const { data } = await refetchFriends();
      return data;
    } catch (error) {
      await client.resetStore();
    }
  }, [client, refetchFriends]);

  useEffect(() => {
    if (removeError) {
    }
  }, [removeError]);

  const directRemoveFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify({
          query: `
            mutation RemoveFriend($userId: ID!) {
              removeFriend(userId: $userId) {
                _id
                userName
                friends {
                  _id
                  userName
                  status
                  __typename
                }
                __typename
              }
            }
          `,
          variables: {
            userId: friendId
          }
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to make GraphQL request: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message || 'GraphQL error');
      }
      if (!result.data?.removeFriend) {
        throw new Error('No data returned from server');
      }
      await refetchFriends();
      return result;
    } catch (error) {
      throw error;
    }
  };

  if (friendsLoading) {
    return <FriendsPageSkeleton />;
  }

  const filteredFriends = Array.isArray(friends) && friends.length > 0 
    ? friends.filter(friend => friend && friend.userName && friend.userName.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const indexOfLastFriend = currentPage * friendsPerPage;
  const indexOfFirstFriend = indexOfLastFriend - friendsPerPage;
  const currentFriends = filteredFriends.slice(indexOfFirstFriend, indexOfLastFriend);
  const totalPages = Math.ceil(filteredFriends.length / friendsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const toggleSearchMode = (mode) => {
    setSearchMode(mode);
    setSearchQuery('');
  };

  const toggleRequestsDropdown = () => {
    setShowRequests(!showRequests);
  };

  const toggleFriendDropdown = (friendId) => {
    setActiveDropdown(prev => prev === friendId ? null : friendId);
  };

  const registerDropdownRef = (friendId, el) => {
    dropdownRefs.current[friendId] = el;
  };

  const searchResults = searchData?.searchUsers || [];
  const displaySearchResults = searchResults.length > 0 ? searchResults : [];
  const displayRequests = friendRequests.length > 0 ? friendRequests : [];

  return (
    <div className="page-container flex-1 pt-20 md:pl-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6">
          <h1 className="text-3xl font-bold text-light px-5 py-3 border-b border-tonal-800 z-10 relative">Your Friends</h1>
          <div className="p-4">
            {/* Friends Header with Requests Dropdown */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <span className="ml-2 bg-primary-700 text-primary-100 text-xs font-medium px-2.5 py-1 rounded-full">
                  {friends.length}
                </span>
              </div>
              <div className="relative">
                <button 
                  className="flex items-center gap-2 bg-surface-800 hover:bg-surface-700 transition-colors px-4 py-2 rounded-lg text-light relative"
                  onClick={toggleRequestsDropdown}
                  ref={requestsDropdownRef}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  Friend Requests
                  <span className="bg-primary-600 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                    {friendRequests.length}
                  </span>
                </button>
                
                {/* Friend Requests Dropdown */}
                <FriendRequestDropdown
                  isOpen={showRequests}
                  loading={requestsLoading}
                  requests={friendRequests}
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
            <div className="mt-4">
              {/* My Friends */}
              {searchMode === 'friends' && (
                <FriendsList
                  unpinnedFriends={currentFriends}
                  searchQuery={searchQuery}
                  toggleSearchMode={toggleSearchMode}
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  handleRemoveFriend={handleRemoveFriend}
                  dropdownRefs={registerDropdownRef}
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
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSearch={handleSearch}
                  onSendRequest={handleSendRequest}
                  searchResults={displaySearchResults}
                  loading={searchLoading}
                  requestSent={requestSent}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedFriend && (
        <Suspense fallback={<div className="fixed bottom-4 right-4 w-80 h-[500px] bg-surface-800 rounded-lg shadow-lg border border-surface-700 z-50 flex items-center justify-center">
          <div className="animate-pulse flex space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          </div>
        </div>}>
          <ChatPopup friend={selectedFriend} onClose={() => setSelectedFriend(null)} />
        </Suspense>
      )}
    </div>
  );
} 