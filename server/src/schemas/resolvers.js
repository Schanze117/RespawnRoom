import User from '../models/users.js';
import { signToken } from '../middleware/auth.js';

export const resolvers = { 
  Query: {
    // This query retrieves the current user's information
    me: async (_parent, _args, context) => {
      if (!context.user) {
        throw new Error('You need to be logged in!');
      }

      const foundUser = await User.findById(context.user._id);

      if (!foundUser) {
        throw new Error('Cannot find a user with this id!');
      }

      return foundUser;
    },
  },

  Mutation: {
    // This mutation is used to add a new user
    addUser: async (_parent, { userName, email, password }) => {
      const user = await User.create({ userName, email, password });
    
      if (!user) {
        throw new Error('Something is wrong!');
      }
    
      const token = signToken(user.userName, user.email, user._id);
      return { token, user };
    },
    // This mutation is used to log in a user
    login: async (_parent, { userName, email, password }) => {
      const user = await User.findOne({ $or: [{ userName }, { email }] });
    
      if (!user) {
        throw new Error("Can't find this user");
      }
    
      const correctPw = await user.isCorrectPassword(password);
    
      if (!correctPw) {
        throw new Error('Wrong password!');
      }
    
      const token = signToken(user.userName, user.email, user._id);
      return { token, user };
    },
    // This mutation is used to save a game
    saveGame: async (_parent, { game }, context) => {
      if (!context.user) {
        throw new Error('You need to be logged in!');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $addToSet: { savedGames: game } },
        { new: true, runValidators: true }
      );

      return updatedUser;
    },
    // This mutation is used to remove a game
    removeGame: async (_parent, { gameId }, context) => {
      if (!context.user) {
        throw new Error('You need to be logged in!');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedGames: { gameId } } },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error("Couldn't find user with this id!");
      }

      return updatedUser;
    },
  },
};