import { gql } from '@apollo/client';

// This query retrieves the current user's information
export const GET_ME = gql`
  query Me {
    me {
      _id
      userName
      email
      savedGames {
        _id
        cover
        name
        genres
        playerPerspectives
        summary
        userId
      }
    }
  }
`;

// This query retrieves the current user's friends
export const GET_FRIENDS = gql`
  query GetFriends {
    getFriends {
      _id
      userName
      status
      lastSeen
      __typename
    }
  }
`;

// This query retrieves the current user's pending friend requests
export const GET_FRIEND_REQUESTS = gql`
  query GetFriendRequests {
    getFriendRequests {
      _id
      userName
      sentTime
    }
  }
`;

// This query searches for users by username
export const SEARCH_USERS = gql`
  query SearchUsers($username: String!) {
    searchUsers(username: $username) {
      _id
      userName
      status
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($friendId: ID!, $limit: Int) {
    getMessages(friendId: $friendId, limit: $limit) {
      _id
      senderId
      receiverId
      content
      timestamp
      read
      sender {
        _id
        userName
      }
    }
  }
`;

export const GET_UNREAD_MESSAGE_COUNT = gql`
  query GetUnreadMessageCount($friendId: ID) {
    getUnreadMessageCount(friendId: $friendId)
  }
`;