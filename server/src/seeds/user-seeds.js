import { User } from '../models/index.js';

export const seedUsers = async () => {
  try {
    await User.bulkCreate([
      { userName: 'user1', password: 'password1' },
      { userName: 'user2', password: 'password2' },
      { userName: 'user3', password: 'password3' },

    ], {
      individualHooks: true,
      returning: true,
    });
    console.log('Users have been seeded successfully.');
  } catch (err) {
    console.error('Error seeding users:', err);
  }
};