import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

import videoGameSchema from './videogames.js'; // Import the schema, not the model

// Define the User schema
const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true, // Ensure username is required
      unique: true,   // Enforce uniqueness
    },
    password: {
      type: String,
      required: false, // Allow null for Google auth users
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Added sparse to handle null values
      match: [/.+@.+\..+/, 'Must use a valid email address'],
    },
    googleId: {
      type: String,
      required: false,
      sparse: true,  // Changed: Added sparse, removed unique: true
    },
    // Use the videoGameSchema for the savedGames array
    savedGames: [videoGameSchema],
    // Add category tokens for personalized recommendations
    categoryTokens: {
      type: Map,
      of: Number,
      default: {},
    },
    // Track last token decay time
    lastTokenDecay: {
      type: Date,
      default: Date.now,
    },
    // Add friends list - references to other users
    friends: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Add friend requests - references to other users who sent requests
    friendRequests: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    // User's online status
    status: {
      type: String,
      enum: ['Online', 'Offline', 'Away', 'Do Not Disturb'],
      default: 'Offline'
    },
    // Last time user was seen online
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    badges: [
      {
        type: String,
        enum: [
          'First Saved Game',
          'Save Enthusiast',
          'Save Master',
          'First Searched Game',
          'Search Enthusiast',
          'Search Master'
        ],
        default: [],
      }
    ]
  },
  {
    toJSON: {
      virtuals: true,
    },
  }
);

// Hash the password before saving the user
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});

// Add a method to compare passwords
userSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Add a virtual field to calculate the number of saved games
userSchema.virtual('gameCount').get(function () {
  return this.savedGames.length;
});

// Method to update category tokens when game is saved
userSchema.methods.updateCategoryTokens = async function(game) {
  // Extract categories from the game with improved handling for different data formats
  let categories = [];
  
  // Add genres if they exist
  if (game.genres && Array.isArray(game.genres)) {
    const genreNames = game.genres.map(genre => {
      return typeof genre === 'string' ? genre : (genre && genre.name ? genre.name : null);
    }).filter(Boolean); // Remove any null/undefined values
    categories = categories.concat(genreNames);
  }
  
  // Add player perspectives if they exist
  if (game.playerPerspectives && Array.isArray(game.playerPerspectives)) {
    const perspectiveNames = game.playerPerspectives.map(perspective => {
      return typeof perspective === 'string' ? perspective : (perspective && perspective.name ? perspective.name : null);
    }).filter(Boolean); // Remove any null/undefined values
    categories = categories.concat(perspectiveNames);
  }
  
  // Initialize tokens object if it doesn't exist
  if (!this.categoryTokens) {
    this.categoryTokens = new Map();
  }
  
  // Update token counts
  categories.forEach(category => {
    if (category) {
      const currentCount = this.categoryTokens.get(category) || 0;
      this.categoryTokens.set(category, currentCount + 1);
    }
  });
  
  return this.save();
};

// Method to apply decay to category tokens
userSchema.methods.decayTokens = async function() {
  // Check if at least a day has passed since last decay
  const now = new Date();
  const daysSinceLastDecay = (now - this.lastTokenDecay) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastDecay >= 1) {
    // Apply decay to all tokens
    for (const [category, value] of this.categoryTokens.entries()) {
      this.categoryTokens.set(category, value * 0.9);
    }
    
    // Update last decay time
    this.lastTokenDecay = now;
    
    return this.save();
  }
  
  return this;
};

// Create the User model
const User = model('User', userSchema);

export default User;