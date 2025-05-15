import User from '../models/users.js';
import { signToken } from '../middleware/auth.js';
import { GraphQLError } from 'graphql';
import { VideoGame, Message } from '../models/index.js';

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

    // Get the current user's friends list
    getFriends: async (_parent, _args, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        const user = await User.findById(context.user._id).populate('friends');
        
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return user.friends;
      } catch (err) {
        console.error('Error fetching friends:', err);
        throw new GraphQLError('Failed to fetch friends', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Get the current user's friend requests
    getFriendRequests: async (_parent, _args, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        const user = await User.findById(context.user._id).populate('friendRequests');
        
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Format the friend requests for the client
        // For real-time applications, you would want to store the request time
        // Currently adding a dummy time indication for display purposes
        const formattedRequests = user.friendRequests.map(requester => ({
          _id: requester._id,
          userName: requester.userName,
          sentTime: 'recently' // In a real app, store and return the actual time
        }));

        return formattedRequests;
      } catch (err) {
        console.error('Error fetching friend requests:', err);
        throw new GraphQLError('Failed to fetch friend requests', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Search for users by username
    searchUsers: async (_parent, { username }, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        // Get current user with friends and requests to exclude them
        const currentUser = await User.findById(context.user._id)
          .populate('friends')
          .populate('friendRequests');
        
        if (!currentUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        // Get IDs to exclude from search results
        const currentUserId = currentUser._id.toString();
        const friendIds = currentUser.friends.map(friend => friend._id.toString());
        const requestIds = currentUser.friendRequests.map(request => request._id.toString());
        
        // Find users whose usernames contain the search string (case insensitive)
        // Exclude the current user, friends, and users who have sent friend requests
        const users = await User.find({
          userName: { $regex: username, $options: 'i' }
        })
        .limit(20);
        
        // Filter out already connected users client-side for more flexibility
        const filteredUsers = users.filter(user => {
          const userId = user._id.toString();
          return userId !== currentUserId && 
                 !friendIds.includes(userId) && 
                 !requestIds.includes(userId);
        });

        return filteredUsers;
      } catch (err) {
        console.error('Error searching users:', err);
        throw new GraphQLError('Failed to search users', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    getMessages: async (parent, { friendId, limit = 50 }, context) => {
      // Ensure user is authenticated
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!');
      }

      try {
        // Find messages between current user and friend (in both directions)
        // sort by timestamp in descending order and limit to the specified amount
        const messages = await Message.find({
          $or: [
            { senderId: context.user._id, receiverId: friendId },
            { senderId: friendId, receiverId: context.user._id }
          ]
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate({
          path: 'senderId',
          select: '_id userName'
        });

        // Handle the case where no messages are found
        if (!messages || messages.length === 0) {
          return [];
        }

        // Map messages to the expected format, ensuring sender is properly populated
        const formattedMessages = messages.map(message => {
          // Ensure senderId exists and is populated
          const sender = message.senderId && typeof message.senderId === 'object' 
            ? message.senderId 
            : { _id: message.senderId, userName: 'Unknown' };

          return {
            _id: message._id,
            senderId: sender._id,
            receiverId: message.receiverId,
            content: message.content,
            timestamp: message.timestamp,
            read: message.read,
            sender: sender
          };
        });

        // Reverse the array to show messages in ascending order (oldest first)
        return formattedMessages.reverse();
      } catch (error) {
        console.error("Error getting messages:", error);
        // Return an empty array instead of throwing an error
        return [];
      }
    },

    getUnreadMessageCount: async (parent, { friendId }, context) => {
      // Ensure user is authenticated
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!');
      }

      // Count unread messages from a specific friend if provided, otherwise all unread
      const query = { receiverId: context.user._id, read: false };
      if (friendId) {
        query.senderId = friendId;
      }

      return Message.countDocuments(query);
    },
  },

  Mutation: {
    // This mutation is used to add a new user
    addUser: async (_parent, { userName, email, password }) => {
      try {
        // Check if password is the same as username or email
        if (password === userName || password === email) {
          throw new GraphQLError('Password cannot be the same as your username or email', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        
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
    login: async (_parent, { userName, email, password }) => {
      try {
        // Check if either userName or email is provided
        if (!userName && !email) {
          throw new GraphQLError("Either username or email is required", {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        let user;
        
        // Find user by userName if provided, otherwise by email
        if (userName) {
          user = await User.findOne({ userName });
          if (!user) {
            throw new GraphQLError("No user found with this username", {
              extensions: { code: 'USER_NOT_FOUND' }
            });
          }
        } else {
          user = await User.findOne({ email });
          if (!user) {
            throw new GraphQLError("No user found with this email address", {
              extensions: { code: 'USER_NOT_FOUND' }
            });
          }
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

    // Send a friend request to another user
    sendFriendRequest: async (_parent, { userId }, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        // Check if the target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Check if trying to add self
        if (userId === context.user._id) {
          throw new GraphQLError('Cannot send friend request to yourself', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Get the current user
        const currentUser = await User.findById(context.user._id);
        if (!currentUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Convert IDs to strings for comparison
        const userIdStr = userId.toString();
        const currentUserIdStr = context.user._id.toString();
        
        // Check if already friends (comparing as strings)
        const alreadyFriends = currentUser.friends.some(friendId => 
          friendId.toString() === userIdStr
        );
        
        if (alreadyFriends) {
          throw new GraphQLError('Already friends with this user', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Check if request already sent (comparing as strings)
        const requestAlreadySent = targetUser.friendRequests.some(requesterId => 
          requesterId.toString() === currentUserIdStr
        );
        
        if (requestAlreadySent) {
          throw new GraphQLError('Friend request already sent', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Add current user to target user's friend requests
        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { friendRequests: context.user._id } }
        );

        return await User.findById(context.user._id);
      } catch (err) {
        console.error('Error sending friend request:', err);
        throw new GraphQLError(err.message || 'Failed to send friend request', {
          extensions: { code: err.extensions?.code || 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Accept a friend request
    acceptFriendRequest: async (_parent, { userId }, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        // Get the current user
        const currentUser = await User.findById(context.user._id);
        if (!currentUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Convert IDs to strings for comparison
        const userIdStr = userId.toString();
        
        // Check if request exists
        const requestExists = currentUser.friendRequests.some(requesterId => 
          requesterId.toString() === userIdStr
        );
        
        if (!requestExists) {
          throw new GraphQLError('No friend request from this user', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Add to friends lists for both users
        await User.findByIdAndUpdate(
          context.user._id,
          { 
            $addToSet: { friends: userId },
            $pull: { friendRequests: userId }
          }
        );

        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { friends: context.user._id } }
        );

        // Return updated user with populated friends
        return await User.findById(context.user._id).populate('friends');
      } catch (err) {
        console.error('Error accepting friend request:', err);
        throw new GraphQLError(err.message || 'Failed to accept friend request', {
          extensions: { code: err.extensions?.code || 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Decline a friend request
    declineFriendRequest: async (_parent, { userId }, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        // Get the current user
        const currentUser = await User.findById(context.user._id);
        if (!currentUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Convert IDs to strings for comparison
        const userIdStr = userId.toString();
        
        // Check if request exists
        const requestExists = currentUser.friendRequests.some(requesterId => 
          requesterId.toString() === userIdStr
        );
        
        if (!requestExists) {
          throw new GraphQLError('No friend request from this user', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Remove from friend requests
        await User.findByIdAndUpdate(
          context.user._id,
          { $pull: { friendRequests: userId } }
        );

        // Return updated user with populated friend requests
        return await User.findById(context.user._id).populate('friendRequests');
      } catch (err) {
        console.error('Error declining friend request:', err);
        throw new GraphQLError(err.message || 'Failed to decline friend request', {
          extensions: { code: err.extensions?.code || 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Remove a friend
    removeFriend: async (_parent, { userId }, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        // Get the current user
        const currentUser = await User.findById(context.user._id);
        if (!currentUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Convert IDs to strings for comparison
        const userIdStr = userId.toString();
        
        // Check if they are friends
        const isFriend = currentUser.friends.some(friendId => 
          friendId.toString() === userIdStr
        );
        
        if (!isFriend) {
          throw new GraphQLError('Not friends with this user', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Remove from both users' friends lists
        await User.findByIdAndUpdate(
          context.user._id,
          { $pull: { friends: userId } }
        );

        await User.findByIdAndUpdate(
          userId,
          { $pull: { friends: context.user._id } }
        );

        // Return updated user with populated friends
        return await User.findById(context.user._id).populate('friends');
      } catch (err) {
        console.error('Error removing friend:', err);
        throw new GraphQLError(err.message || 'Failed to remove friend', {
          extensions: { code: err.extensions?.code || 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Update user status
    updateStatus: async (_parent, { status }, context) => {
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        // Validate status
        const validStatuses = ['Online', 'Offline', 'Away', 'Do Not Disturb'];
        if (!validStatuses.includes(status)) {
          throw new GraphQLError('Invalid status', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Update the user's status and last seen time
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { 
            status,
            lastSeen: new Date()
          },
          { new: true }
        );

        if (!updatedUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return updatedUser;
      } catch (err) {
        console.error('Error updating status:', err);
        throw new GraphQLError(err.message || 'Failed to update status', {
          extensions: { code: err.extensions?.code || 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    sendMessage: async (parent, { receiverId, content }, context) => {
      // Ensure user is authenticated
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!');
      }

      try {
        // Ensure users are friends
        const user = await User.findById(context.user._id);
        if (!user || !user.friends) {
          throw new Error('User not found or friends list is undefined');
        }

        // Check if receiverId is in the user's friends array
        const isFriend = user.friends.some(
          friendId => friendId.toString() === receiverId.toString()
        );

        if (!isFriend) {
          throw new Error('You can only message your friends');
        }

        // Create the message
        const message = await Message.create({
          senderId: context.user._id,
          receiverId,
          content,
          timestamp: new Date(),
          read: false
        });

        // Populate sender info
        const populatedMessage = await Message.findById(message._id).populate({
          path: 'senderId',
          select: '_id userName'
        });

        if (!populatedMessage) {
          throw new Error('Failed to create or populate message');
        }

        // Create a properly structured response that matches the Message type
        return {
          _id: populatedMessage._id,
          senderId: populatedMessage.senderId._id,
          receiverId: populatedMessage.receiverId,
          content: populatedMessage.content,
          timestamp: populatedMessage.timestamp,
          read: populatedMessage.read,
          sender: {
            _id: populatedMessage.senderId._id,
            userName: populatedMessage.senderId.userName
          }
        };
      } catch (error) {
        console.error('Error sending message:', error);
        throw new Error(`Failed to send message: ${error.message}`);
      }
    },

    markMessagesAsRead: async (parent, { senderId }, context) => {
      // Ensure user is authenticated
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!');
      }

      // Mark all unread messages from the specified sender as read
      const result = await Message.updateMany(
        { receiverId: context.user._id, senderId, read: false },
        { read: true }
      );

      return result.modifiedCount > 0;
    },
  },
};