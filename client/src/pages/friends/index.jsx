import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useLazyQuery, useApolloClient } from '@apollo/client';
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
  console.log('[Friends] Component render start');
  // Get Apollo client instance
  const client = useApolloClient();
  console.log('[Friends] Apollo client:', client);

  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('friends'); // 'friends' or 'findPlayers'
  const [requestSent, setRequestSent] = useState({});
  const [showRequests, setShowRequests] = useState(false);
  const requestsDropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const friendsPerPage = 8;
  const [pinnedFriends, setPinnedFriends] = useState(() => {
    try {
      const saved = localStorage.getItem('pinnedFriends');
      const parsedData = saved ? JSON.parse(saved) : [];
      console.log('[Friends] Loaded pinnedFriends from localStorage:', parsedData);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('[Friends] Error parsing pinnedFriends from localStorage:', error);
      return [];
    }
  });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const [unreadCounts, setUnreadCounts] = useState({});

  // Get unread message count for each friend
  const { data: unreadCountData, refetch: refetchUnreadCounts } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
    fetchPolicy: 'network-only'
  });
  useEffect(() => {
    console.log('[Friends] unreadCountData:', unreadCountData);
  }, [unreadCountData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('[Friends] Refetching unread counts...');
      refetchUnreadCounts();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [refetchUnreadCounts]);

  useEffect(() => {
    if (unreadCountData?.getUnreadMessageCount) {
      setUnreadCounts(prev => ({
        ...prev,
        total: unreadCountData.getUnreadMessageCount
      }));
      console.log('[Friends] Set unreadCounts:', unreadCountData.getUnreadMessageCount);
    }
  }, [unreadCountData]);

  const handleMessageClick = useCallback((friend) => {
    console.log('[Friends] handleMessageClick for:', friend);
    setUnreadCounts(prev => ({
      ...prev,
      [friend._id]: 0
    }));
  }, []);

  // GraphQL queries
  const { loading: friendsLoading, data: friendsData, error: friendsError, refetch: refetchFriends } = useQuery(GET_FRIENDS, {
    onError: (error) => {
      console.error('[Friends] Error fetching friends:', error);
    },
    onCompleted: (data) => {
      console.log('[Friends] Successfully fetched friends:', data);
    }
  });
  const friends = friendsData?.getFriends || [];
  useEffect(() => {
    if (friendsError) {
      console.error('[Friends] Friends query error:', friendsError);
    }
    if (friendsData) {
      console.log('[Friends] Friends data received:', friendsData);
    }
  }, [friendsData, friendsError]);

  const { loading: requestsLoading, data: requestsData, error: requestsError, refetch: refetchRequests } = useQuery(GET_FRIEND_REQUESTS, {
    onError: (error) => {
      console.error('[Friends] Error fetching friend requests:', error);
    }
  });
  const friendRequests = requestsData?.getFriendRequests || [];
  useEffect(() => {
    if (requestsError) {
      console.error('[Friends] Friend requests query error:', requestsError);
    }
    if (requestsData) {
      console.log('[Friends] Friend requests data received:', requestsData);
    }
  }, [requestsData, requestsError]);

  const [searchUsers, { loading: searchLoading, data: searchData }] = useLazyQuery(SEARCH_USERS, {
    onCompleted: (data) => {
      console.log('[Friends] Search users completed:', data);
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
      console.log('[Friends] Remove friend mutation completed successfully:', data);
      setTimeout(() => {
        refetchFriends()
          .then(() => console.log('[Friends] Friends list refetched successfully after mutation'))
          .catch(err => console.error('[Friends] Error refetching friends after mutation:', err));
      }, 500);
    },
    onError: (error) => {
      console.error('[Friends] GraphQL error in removeFriend mutation:', error);
    },
    update: (cache, { data }) => {
      try {
        if (!data || !data.removeFriend) {
          console.log('[Friends] No data returned from removeFriend mutation');
          return;
        }
        console.log('[Friends] Update function called with data:', data.removeFriend);
        const existingData = cache.readQuery({ query: GET_FRIENDS });
        if (!existingData || !existingData.getFriends) {
          console.log('[Friends] No existing friends data in cache to update');
          return;
        }
        console.log('[Friends] Current friends in cache:', existingData.getFriends);
        const removedFriendId = data.removeFriend._id;
        const updatedFriends = existingData.getFriends.filter(friend => friend._id !== removedFriendId);
        console.log('[Friends] Updated friends list:', updatedFriends);
        cache.writeQuery({
          query: GET_FRIENDS,
          data: { getFriends: updatedFriends },
        });
        console.log('[Friends] Cache updated successfully');
      } catch (err) {
        console.error('[Friends] Error updating cache after friend removal:', err);
      }
    }
  });
  const [sendFriendRequest] = useMutation(SEND_FRIEND_REQUEST);

  // Utility functions
  const isPinned = (friendId) => {
    const result = Array.isArray(pinnedFriends) && pinnedFriends.includes(friendId);
    console.log('[Friends] isPinned check:', friendId, result);
    return result;
  };

  useEffect(() => {
    console.log('[Friends] Saving pinnedFriends to localStorage:', pinnedFriends);
    localStorage.setItem('pinnedFriends', JSON.stringify(pinnedFriends));
  }, [pinnedFriends]);

  useEffect(() => {
    function handleClickOutside(event) {
      // Add safeguard to ensure event has a target
      if (!event || !event.target) return;
    
      // For requests dropdown
      if (requestsDropdownRef.current && !requestsDropdownRef.current.contains(event.target)) {
        setShowRequests(false);
        console.log('[Friends] Clicked outside requests dropdown');
      }
      
      // Friend action dropdown - ensure we're not closing during a click on a button
      if (activeDropdown && dropdownRefs.current[activeDropdown]) {
        const dropdownEl = dropdownRefs.current[activeDropdown];
        
        // Check if the click was on a button or other interactive element inside the dropdown
        const isClickOnInteractiveElement = event.target.tagName === 'BUTTON' || 
          event.target.closest('button') || 
          event.target.tagName === 'A' ||
          event.target.tagName === 'INPUT';
        
        // Only close if the click is outside the dropdown AND not on an interactive element
        if (!dropdownEl.contains(event.target) && !isClickOnInteractiveElement) {
          console.log('[Friends] Clicked outside friend action dropdown, closing');
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
    console.log('[Friends] Search query changed, reset to page 1');
  }, [searchQuery]);

  // Event handlers
  const handleAccept = async (id) => {
    console.log('[Friends] handleAccept called for:', id);
    try {
      if (window.confirm('Accept friend request?')) {
        await acceptFriendRequest({ 
          variables: { userId: id },
          onCompleted: (data) => {
            console.log('[Friends] Friend request accepted successfully', data);
            refetchFriends();
            refetchRequests();
            setShowRequests(false);
          },
          onError: (err) => {
            console.error('[Friends] Error accepting friend request:', err.message);
            alert('Failed to accept friend request. Please try again.');
          }
        });
      }
    } catch (err) {
      console.error('[Friends] Error accepting friend request:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleDecline = async (id) => {
    console.log('[Friends] handleDecline called for:', id);
    try {
      if (window.confirm('Decline friend request?')) {
        await declineFriendRequest({ 
          variables: { userId: id },
          onCompleted: (data) => {
            console.log('[Friends] Friend request declined successfully', data);
            refetchRequests();
            if (friendRequests.length <= 1) {
              setShowRequests(false);
            }
          },
          onError: (err) => {
            console.error('[Friends] Error declining friend request:', err.message);
            alert('Failed to decline friend request. Please try again.');
          }
        });
      }
    } catch (err) {
      console.error('[Friends] Error declining friend request:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const togglePinFriend = (id) => {
    console.log('[Friends] togglePinFriend called for:', id);
    try {
      const isCurrentlyPinned = pinnedFriends.includes(id);
      console.log('[Friends] Friend is currently pinned:', isCurrentlyPinned);
      let updatedPinnedFriends;
      if (isCurrentlyPinned) {
        updatedPinnedFriends = pinnedFriends.filter(friendId => friendId !== id);
        console.log('[Friends] Unpinning friend');
      } else {
        updatedPinnedFriends = [...pinnedFriends, id];
        console.log('[Friends] Pinning friend');
      }
      setPinnedFriends(updatedPinnedFriends);
      console.log('[Friends] Updated pinnedFriends:', updatedPinnedFriends);
      try {
        localStorage.setItem('pinnedFriends', JSON.stringify(updatedPinnedFriends));
        console.log('[Friends] Saved pinnedFriends to localStorage');
      } catch (storageError) {
        console.error('[Friends] Error saving to localStorage:', storageError);
      }
      setActiveDropdown(null);
    } catch (error) {
      console.error('[Friends] Error in togglePinFriend:', error);
    }
  };

  const handleRemoveFriend = async (id) => {
    console.log('[Friends] handleRemoveFriend called for:', id);
    if (!id) {
      console.error('[Friends] Invalid friend ID provided to handleRemoveFriend');
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
            .filter(friend => friend._id !== id)
            .map(friend => ({
              __typename: 'User',
              _id: friend._id,
              userName: friend.userName,
              status: friend.status,
              lastSeen: friend.lastSeen
            })) || []
        }
      };
      console.log('[Friends] optimisticResponse:', optimisticResponse);
      const result = await removeFriend({ 
        variables: { userId: id },
        optimisticResponse,
        update: (cache, { data }) => {
          console.log('[Friends] update function called in handleRemoveFriend:', data);
          if (!data?.removeFriend) return;
          const existingFriendsData = cache.readQuery({ query: GET_FRIENDS });
          console.log('[Friends] existingFriendsData in update:', existingFriendsData);
          if (existingFriendsData) {
            const updatedFriends = existingFriendsData.getFriends.filter(
              friend => friend._id !== id
            );
            cache.writeQuery({
              query: GET_FRIENDS,
              data: { getFriends: updatedFriends }
            });
            console.log('[Friends] Wrote updated friends to cache:', updatedFriends);
          }
          if (isPinned(id)) {
            const updatedPinnedFriends = pinnedFriends.filter(friendId => friendId !== id);
            setPinnedFriends(updatedPinnedFriends);
            localStorage.setItem('pinnedFriends', JSON.stringify(updatedPinnedFriends));
            console.log('[Friends] Updated pinned friends after removal:', updatedPinnedFriends);
          }
        }
      });
      console.log('[Friends] removeFriend mutation result:', result);
      await refetchFriends();
      console.log('[Friends] Refetched friends after removal');
      return result;
    } catch (error) {
      console.error('[Friends] Error in handleRemoveFriend:', error);
      try {
        const fallbackResult = await directRemoveFriend(id);
        console.log('[Friends] Fallback directRemoveFriend result:', fallbackResult);
        return fallbackResult;
      } catch (directError) {
        console.error('[Friends] Both removal methods failed:', directError);
        await resetAndRefetch();
        console.log('[Friends] Forced cache reset and refetch after both removal methods failed');
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('[Friends] handleSearch called with query:', searchQuery, 'mode:', searchMode);
    if (searchQuery.trim()) {
      if (searchMode === 'findPlayers') {
        setRequestSent({});
        searchUsers({ 
          variables: { username: searchQuery.trim() },
          onError: (err) => {
            console.error('[Friends] Search error:', err.message);
          }
        });
      }
    }
  };

  const handleSendRequest = async (userId) => {
    console.log('[Friends] handleSendRequest called for:', userId);
    try {
      await sendFriendRequest({ 
        variables: { userId },
        onCompleted: () => {
          setRequestSent(prev => ({ ...prev, [userId]: true }));
          console.log('[Friends] Friend request sent and UI updated for:', userId);
        },
        onError: (err) => {
          console.error('[Friends] Error sending friend request:', err.message);
          if (err.message.includes('already sent')) {
            setRequestSent(prev => ({ ...prev, [userId]: true }));
          }
        }
      });
    } catch (err) {
      console.error('[Friends] Error sending friend request:', err);
    }
  };

  const resetAndRefetch = useCallback(async () => {
    console.log('[Friends] resetAndRefetch called');
    try {
      client.cache.evict({ fieldName: 'getFriends' });
      client.cache.evict({ fieldName: 'getFriendRequests' });
      client.cache.gc();
      await client.reFetchObservableQueries();
      const { data } = await refetchFriends();
      console.log('[Friends] Data after resetAndRefetch:', data);
      return data;
    } catch (error) {
      console.error('[Friends] Error resetting cache and refetching:', error);
      await client.resetStore();
    }
  }, [client, refetchFriends]);

  useEffect(() => {
    if (removeError) {
      console.error('[Friends] Remove friend mutation error:', removeError);
    }
  }, [removeError]);

  const directRemoveFriend = async (id) => {
    console.log('[Friends] directRemoveFriend called for:', id);
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
            userId: id
          }
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to make GraphQL request: ${response.statusText}`);
      }
      const result = await response.json();
      console.log('[Friends] directRemoveFriend fetch result:', result);
      if (result.errors) {
        throw new Error(result.errors[0].message || 'GraphQL error');
      }
      if (!result.data?.removeFriend) {
        throw new Error('No data returned from server');
      }
      if (isPinned(id)) {
        const updatedPinnedFriends = pinnedFriends.filter(friendId => friendId !== id);
        setPinnedFriends(updatedPinnedFriends);
        localStorage.setItem('pinnedFriends', JSON.stringify(updatedPinnedFriends));
        console.log('[Friends] Updated pinned friends after direct removal:', updatedPinnedFriends);
      }
      await refetchFriends();
      console.log('[Friends] Refetched friends after direct removal');
      return result;
    } catch (error) {
      console.error('[Friends] Error in directRemoveFriend:', error);
      await resetAndRefetch();
      console.log('[Friends] Forced cache reset and refetch after directRemoveFriend failed');
      throw error;
    }
  };

  if (friendsLoading) {
    console.log('[Friends] Loading friends...');
    return <div className="w-full mt-28 p-6 text-white">Loading friends...</div>;
  }

  const filteredFriends = Array.isArray(friends) && friends.length > 0 
    ? friends.filter(friend => friend && friend.userName && friend.userName.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  console.log('[Friends] filteredFriends:', filteredFriends);

  const pinnedFilteredFriends = filteredFriends.filter(friend => friend && friend._id && isPinned(friend._id));
  const unpinnedFilteredFriends = filteredFriends.filter(friend => friend && friend._id && !isPinned(friend._id));
  console.log('[Friends] pinnedFilteredFriends:', pinnedFilteredFriends);
  console.log('[Friends] unpinnedFilteredFriends:', unpinnedFilteredFriends);

  const indexOfLastFriend = currentPage * friendsPerPage;
  const indexOfFirstFriend = indexOfLastFriend - friendsPerPage;
  const currentUnpinnedFriends = unpinnedFilteredFriends.slice(indexOfFirstFriend, indexOfLastFriend);
  const totalPages = Math.ceil(unpinnedFilteredFriends.length / friendsPerPage);
  console.log('[Friends] Pagination:', { currentPage, totalPages, indexOfFirstFriend, indexOfLastFriend, currentUnpinnedFriends });

  const paginate = (pageNumber) => {
    console.log('[Friends] paginate called:', pageNumber);
    setCurrentPage(pageNumber);
  };
  const nextPage = () => {
    console.log('[Friends] nextPage called');
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  const prevPage = () => {
    console.log('[Friends] prevPage called');
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const toggleSearchMode = (mode) => {
    console.log('[Friends] toggleSearchMode called:', mode);
    setSearchMode(mode);
    setSearchQuery('');
  };

  const toggleRequestsDropdown = () => {
    setShowRequests(!showRequests);
    console.log('[Friends] toggleRequestsDropdown called, now:', !showRequests);
  };

  const toggleFriendDropdown = (friendId) => {
    setActiveDropdown(prev => prev === friendId ? null : friendId);
    console.log('[Friends] toggleFriendDropdown called for:', friendId);
  };

  const registerDropdownRef = (friendId, el) => {
    dropdownRefs.current[friendId] = el;
    console.log('[Friends] registerDropdownRef for:', friendId, el);
  };

  const searchResults = searchData?.searchUsers || [];
  const displaySearchResults = searchResults.length > 0 ? searchResults : [];
  const displayRequests = friendRequests.length > 0 ? friendRequests : [];

  console.log('[Friends] Render return', {
    pinnedFriends,
    currentUnpinnedFriends,
    searchQuery,
    searchMode,
    activeDropdown,
    unreadCounts,
    currentPage,
    totalPages,
    displaySearchResults,
    displayRequests
  });

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