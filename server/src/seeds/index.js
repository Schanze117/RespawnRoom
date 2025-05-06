import mongoose from 'mongoose';
import { seedUsers } from './user-seeds.js';
import { seedVideoGames } from './videogame-seeds.js';
import db from '../config/connection.js'; // Ensure this connects to your MongoDB instance

const seedAll = async () => {
  try {
    // Connect to MongoDB
    await db;

    // Seed users
    await seedUsers();

    // Seed video games
    await seedVideoGames();

    // Close the database connection
    mongoose.connection.close();

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database', err);
    process.exit(1);
  }
};

seedAll();