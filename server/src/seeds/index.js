import { seedUsers } from './user-seeds.js';
import { seedVideoGames } from './videogame-seeds.js';
import sequelize from '../config/connection.js';

const seedAll = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('\n----- DATABASE SYNCED -----\n');

    await seedUsers();
    console.log('\n----- USERS SEEDED -----\n');

    // await seedVideoGames();
    // console.log('\n----- VIDEOGAMES SEEDED -----\n');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database', err);
    process.exit(1);
  }
};

seedAll();