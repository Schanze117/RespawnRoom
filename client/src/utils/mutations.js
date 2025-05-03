import { gql } from '@apollo/client';

// This mutation is used to log in a user
export const LOGIN_USER = gql`
  mutation LoginUser($userName: String, $email: String, $password: String!) {
    login(userName: $userName, email: $email, password: $password) {
      token
      user {
        _id
        userName
        email
      }
    }
  }
`;

// This mutation is used to add a new user
export const ADD_USER = gql`
  mutation AddUser($userName: String!, $email: String, $password: String) {
    addUser(userName: $userName, email: $email, password: $password) {
      token
      user {
        _id
        userName
        email
      }
    }
  }
`;

// This mutation is used to save a game
export const SAVE_GAME = gql`
  mutation SaveGame($game: VideoGameInput!) {
    saveGame(game: $game) {
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

// This mutation is used to remove a game
export const REMOVE_GAME = gql`
  mutation RemoveGame($gameId: ID!) {
    removeGame(gameId: $gameId) {
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

// This mutation is used to send a friend request
export const SEND_FRIEND_REQUEST = gql`
  mutation SendFriendRequest($userId: ID!) {
    sendFriendRequest(userId: $userId) {
      _id
      userName
      friendRequests {
        _id
        userName
      }
    }
  }
`;

// This mutation is used to accept a friend request
export const ACCEPT_FRIEND_REQUEST = gql`
  mutation AcceptFriendRequest($userId: ID!) {
    acceptFriendRequest(userId: $userId) {
      _id
      userName
      friends {
        _id
        userName
      }
    }
  }
`;

// This mutation is used to decline a friend request
export const DECLINE_FRIEND_REQUEST = gql`
  mutation DeclineFriendRequest($userId: ID!) {
    declineFriendRequest(userId: $userId) {
      _id
      userName
      friendRequests {
        _id
        userName
      }
    }
  }
`;

// This mutation is used to remove a friend
export const REMOVE_FRIEND = gql`
  mutation RemoveFriend($userId: ID!) {
    removeFriend(userId: $userId) {
      _id
      userName
      friends {
        _id
        userName
      }
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($receiverId: ID!, $content: String!) {
    sendMessage(receiverId: $receiverId, content: $content) {
      _id
      senderId
      receiverId
      content
      timestamp
      read
    }
  }
`;

export const MARK_MESSAGES_AS_READ = gql`
  mutation MarkMessagesAsRead($senderId: ID!) {
    markMessagesAsRead(senderId: $senderId)
  }
`;