export const typeDefs = `
  type User {
    _id: ID!
    userName: String!
    email: String
    googleId: String
    savedGames: [VideoGame]
  }

  type VideoGame {
    _id: ID!
    cover: String!
    name: String!
    genres: [String]!
    playerPerspectives: [String]!
    summary: String!
    userId: ID
  }

  type Auth {
    token: String!
    user: User!
  }

  input VideoGameInput {
    cover: String!
    name: String!
    genres: [String]!
    playerPerspectives: [String]!
    summary: String!
    userId: ID
  }

  type Query {
    me: User
    getVideoGames: [VideoGame]
  }

  type Mutation {
    login(email: String!, password: String!): Auth
    addUser(userName: String!, email: String, password: String): Auth
    saveGame(game: VideoGameInput!): User
    removeGame(gameId: ID!): User
  }
`;