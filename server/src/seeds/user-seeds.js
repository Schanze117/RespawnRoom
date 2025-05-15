import User from '../models/users.js';

export const seedUsers = async () => {
  try {
    // Delete all existing users to avoid duplicates
    await User.deleteMany({});

    // Create seed users
    const users = [];

    // Insert the users if there are any
    if (users.length > 0) {
      await User.insertMany(users);
    }
  } catch (err) {
  }
};