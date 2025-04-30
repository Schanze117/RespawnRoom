import User from '../models/users.js';
import { signToken } from '../middleware/auth.js';
import { GraphQLError } from 'graphql';

export const resolvers = { 
  Query: {
    // This query retrieves the current user's information
    me: async (_parent, _args, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Try to find by ID first, then by username/email if that fails
      let foundUser = null;
      
      if (context.user._id) {
        foundUser = await User.findById(context.user._id);
      }
      
      // If no user found by ID, try by userName
      if (!foundUser && context.user.userName) {
        foundUser = await User.findOne({ userName: context.user.userName });
      }
      
      // If still no user, try by email
      if (!foundUser && context.user.email) {
        foundUser = await User.findOne({ email: context.user.email });
      }

      if (!foundUser) {
        throw new GraphQLError('Cannot find a user with this id!', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return foundUser;
    },
  },

  Mutation: {
    // This mutation is used to add a new user
    addUser: async (_parent, { userName, email, password }) => {
      try {
        const user = await User.create({ userName, email, password });
      
        if (!user) {
          throw new GraphQLError('Something went wrong creating the user!', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
      
        const token = signToken(user.userName, user.email, user._id);
        return { token, user };
      } catch (err) {
        console.error('Error creating user:', err);
        
        // Handle duplicate email error
        if (err.code === 11000) {
          throw new GraphQLError('Email or username already exists', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        
        throw new GraphQLError(err.message || 'Failed to create user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    
    // This mutation is used to log in a user
    login: async (_parent, { email, password }) => {
      try {
        const user = await User.findOne({ email });
      
        if (!user) {
          throw new GraphQLError("No user found with this email address", {
            extensions: { code: 'USER_NOT_FOUND' }
          });
        }
      
        const correctPw = await user.isCorrectPassword(password);
      
        if (!correctPw) {
          throw new GraphQLError('Incorrect password', {
            extensions: { code: 'INVALID_CREDENTIALS' }
          });
        }
      
        const token = signToken(user.userName, user.email, user._id);
        return { token, user };
      } catch (err) {
        console.error('Login error:', err);
        throw new GraphQLError(err.message || 'Login failed', {
          extensions: { code: err.extensions?.code || 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    
    // This mutation is used to save a game
    saveGame: async (_parent, { game }, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedGames: game } },
          { new: true, runValidators: true }
        );

        if (!updatedUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return updatedUser;
      } catch (err) {
        console.error('Error saving game:', err);
        throw new GraphQLError(err.message || 'Failed to save game', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    
    // This mutation is used to remove a game
    removeGame: async (_parent, { gameId }, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedGames: { _id: gameId } } },
          { new: true }
        );

        if (!updatedUser) {
          throw new GraphQLError("Couldn't find user with this id!", {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return updatedUser;
      } catch (err) {
        console.error('Error removing game:', err);
        throw new GraphQLError(err.message || 'Failed to remove game', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
  },
};