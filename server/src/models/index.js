import sequelize from '../config/connection.js';
import { UserFactory } from './users.js';
import { VideoGameFactory } from './videogames.js';

    const User = UserFactory(sequelize);
    const VideoGame = VideoGameFactory(sequelize);

    User.hasMany(VideoGame, {
      foreignKey: 'userId',
    });
    VideoGame.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
    });

export { User, VideoGame };