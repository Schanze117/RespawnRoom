import { User } from '../models/index.js';

export const seedUsers = async () => {
  try {
    await User.bulkCreate([
      { userName: 'user1' },
      { userName: 'user2' },
      { userName: 'user3' },
    ], {
      individualHooks: true,
      returning: true,
    });
    console.log('Users have been seeded successfully.');
  } catch (err) {
    console.error('Error seeding users:', err);
  }
};