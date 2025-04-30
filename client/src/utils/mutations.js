import { gql } from '@apollo/client';

// This mutation is used to log in a user
export const LOGIN_USER = gql`
  mutation LoginUser($userName: String!, $password: String!) {
    login(userName: $userName, password: $password) {
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