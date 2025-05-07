export const typeDefs = `
  type User {
    _id: ID!
    userName: String!
    email: String
    googleId: String
    savedGames: [VideoGame]
    friends: [User]
    friendRequests: [User]
    status: String
    lastSeen: String
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

  type FriendRequest {
    _id: ID!
    userName: String!
    sentTime: String
  }

  type Message {
    _id: ID!
    senderId: ID!
    receiverId: ID!
    content: String!
    timestamp: String!
    read: Boolean!
    sender: User
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
    getFriends: [User]
    getFriendRequests: [FriendRequest]
    searchUsers(username: String!): [User]
    getMessages(friendId: ID!, limit: Int): [Message]
    getUnreadMessageCount(friendId: ID): Int
  }

  type Mutation {
    login(userName: String, email: String, password: String!): Auth
    addUser(userName: String!, email: String, password: String): Auth
    saveGame(game: VideoGameInput!): User
    removeGame(gameId: ID!): User
    sendFriendRequest(userId: ID!): User
    acceptFriendRequest(userId: ID!): User
    declineFriendRequest(userId: ID!): User
    removeFriend(userId: ID!): User
    updateStatus(status: String!): User
    sendMessage(receiverId: ID!, content: String!): Message
    markMessagesAsRead(senderId: ID!): Boolean
  }
`;