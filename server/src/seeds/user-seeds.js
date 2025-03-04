import { User } from '../models/index.js';

export const seedUsers = async () => {
    await User.bulkCreate([
        { userName: 'user1' },
        { userName: 'user2' },
        { userName: 'user3' },
    ], {individualHooks: true});
}