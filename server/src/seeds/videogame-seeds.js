import { VideoGame } from "../models/index.js";

export const seedVideoGames = async () => {
    await VideoGame.bulkCreate([
        { name: 'Game1', genre: 'Action', userId: 1 },
        { name: 'Game2', genre: 'Adventure', userId: 2 },
        { name: 'Game3', genre: 'RPG', userId: 3 },
    ]);
}