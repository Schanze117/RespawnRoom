import mongoose from 'mongoose';
import { seedUsers } from './user-seeds.js';
// import { seedVideoGames } from './videogame-seeds.js';
import db from '../config/connection.js'; // Ensure this connects to your MongoDB instance

const seedAll = async () => {
  try {
    // Connect to MongoDB
    await db;
    console.log('\n----- DATABASE CONNECTED -----\n');

    // Seed users
    await seedUsers();
    console.log('\n----- USERS SEEDED -----\n');

    // Seed video games (uncomment if needed)
    // await seedVideoGames();
    // console.log('\n----- VIDEOGAMES SEEDED -----\n');

    // Close the database connection
    mongoose.connection.close();
    console.log('\n----- DATABASE CONNECTION CLOSED -----\n');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database', err);
    process.exit(1);
  }
};

seedAll();