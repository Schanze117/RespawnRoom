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