// filepath: c:\Users\bames\bootcamp\RespawnRoom\server\src\models\videogames.js
import { Schema } from 'mongoose';

// Define the VideoGame schema
const videoGameSchema = new Schema(
  {
    cover: {
      type: String,
      required: false, // Make cover optional to allow saving games without covers
      default: '' // Provide a default empty value
    },
    name: {
      type: String,
      required: true,
    },
    genres: {
      type: [String], // Array of strings for genres
      required: true,
    },
    playerPerspectives: {
      type: [String], // Array of strings for player perspectives
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId, // Reference to a User document
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

export default videoGameSchema; 