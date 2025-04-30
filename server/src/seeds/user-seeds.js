import User from '../models/users.js';

export const seedUsers = async () => {
  try {
    // Delete all existing users to avoid duplicates
    await User.deleteMany({});
    console.log('Existing users have been cleared.');

    // Insert new users
    await User.insertMany([
      { userName: 'user1', password: 'password1' },
      { userName: 'user2', password: 'password2' },
      { userName: 'user3', password: 'password3' },
    ]);
    console.log('Users have been seeded successfully.');
  } catch (err) {
    console.error('Error seeding users:', err);
  }
};