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

// Create the User model
const User = model('User', userSchema);

export default User;